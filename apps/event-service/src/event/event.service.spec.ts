import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from './entities/event.entity.js';
import { EventRegistration } from './entities/event-registration.entity.js';
import { RedisService } from '../redis/redis.service.js';
import { getQueueToken } from '@nestjs/bullmq';
import { RpcException } from '@nestjs/microservices';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('EventService (Atomic Zero-Overbooking & Redis)', () => {
  let service: EventService;

  const mockEventRepo = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    delete: vi.fn(),
  };

  const mockRegistrationRepo = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
    remove: vi.fn(),
  };

  const mockRedisService = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    decr: vi.fn(),
    incr: vi.fn(),
    exists: vi.fn(),
  };

  const mockNotificationQueue = {
    add: vi.fn().mockResolvedValue({ id: 'job-mock-101' }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockEventRepo,
        },
        {
          provide: getRepositoryToken(EventRegistration),
          useValue: mockRegistrationRepo,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: getQueueToken('notification-queue'),
          useValue: mockNotificationQueue,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });


  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Atomic Registration (Zero Overbooking)', () => {
    const mockEvent = {
      id: 1,
      title: 'Dev Conference 2026',
      capacity: 10,
    };

    it('should successfully book a ticket when Redis decr >= 0', async () => {
      mockEventRepo.findOne.mockResolvedValue(mockEvent);
      mockRegistrationRepo.findOne.mockResolvedValue(null); // not registered yet
      mockRedisService.get.mockResolvedValue('5'); // 5 seats left
      mockRedisService.decr.mockResolvedValue(4); // atomic decr -> 4 seats left
      mockRegistrationRepo.create.mockReturnValue({ id: 101, eventId: 1, userId: 2 });
      mockRegistrationRepo.save.mockResolvedValue({ id: 101, eventId: 1, userId: 2 });

      const result = await service.register({ eventId: 1, userId: 2 });

      expect(mockRedisService.decr).toHaveBeenCalledWith('event:1:available_seats');
      expect(mockRegistrationRepo.save).toHaveBeenCalled();
      expect(mockNotificationQueue.add).toHaveBeenCalledWith(
        'send-registration-notification',
        expect.objectContaining({
          eventId: 1,
          userId: 2,
          eventTitle: 'Dev Conference 2026',
        }),
        expect.objectContaining({
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        }),
      );
      expect(result).toEqual({ id: 101, eventId: 1, userId: 2 });
    });

    it('should rollback and throw RpcException Conflict when Redis decr < 0 (sold out)', async () => {
      mockEventRepo.findOne.mockResolvedValue(mockEvent);
      mockRegistrationRepo.findOne.mockResolvedValue(null);
      mockRedisService.get.mockResolvedValue('0');
      mockRedisService.decr.mockResolvedValue(-1); // over-capacity attempt!

      await expect(service.register({ eventId: 1, userId: 3 })).rejects.toThrow(RpcException);

      // Verify immediate compensation rollback in Redis
      expect(mockRedisService.incr).toHaveBeenCalledWith('event:1:available_seats');
      // Verify PostgreSQL was never called for save
      expect(mockRegistrationRepo.save).not.toHaveBeenCalled();
      // Verify BullMQ job was never queued
      expect(mockNotificationQueue.add).not.toHaveBeenCalled();
    });

    it('should rollback Redis slot if database save throws an unexpected error', async () => {
      mockEventRepo.findOne.mockResolvedValue(mockEvent);
      mockRegistrationRepo.findOne.mockResolvedValue(null);
      mockRedisService.get.mockResolvedValue('2');
      mockRedisService.decr.mockResolvedValue(1);
      mockRegistrationRepo.create.mockReturnValue({ eventId: 1, userId: 4 });
      mockRegistrationRepo.save.mockRejectedValue(new Error('DB Connection Timeout'));

      await expect(service.register({ eventId: 1, userId: 4 })).rejects.toThrow('DB Connection Timeout');

      // Verify compensation rollback restored the held slot in Redis
      expect(mockRedisService.incr).toHaveBeenCalledWith('event:1:available_seats');
      // Verify BullMQ job was never queued
      expect(mockNotificationQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('Cache-Aside findAll', () => {
    it('should return cached events when Redis has cache hit', async () => {
      const cachedData = [{ id: 1, title: 'Cached Event' }];
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.findAll();

      expect(mockRedisService.get).toHaveBeenCalledWith('cache:events:all:default');
      expect(mockEventRepo.find).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should query DB and populate Redis when cache miss', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const dbEvents = [{ id: 2, title: 'DB Event' }];
      mockEventRepo.find.mockResolvedValue(dbEvents);

      const result = await service.findAll();

      expect(mockEventRepo.find).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'cache:events:all:default',
        JSON.stringify(dbEvents),
        60,
      );
      expect(result).toEqual(dbEvents);
    });
  });
});
