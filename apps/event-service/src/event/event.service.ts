import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './entities/event.entity.js';
import { ILike, Repository } from 'typeorm';
import { EventRegistration } from './entities/event-registration.entity.js';
import { RpcException } from '@nestjs/microservices';
import { RedisService } from '../redis/redis.service.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationJobData } from './interfaces/notification-job.interface.js';

@Injectable()
export class EventService {
    private readonly logger = new Logger(EventService.name);

    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,

        @InjectRepository(EventRegistration)
        private registrationRepository: Repository<EventRegistration>,

        private readonly redisService: RedisService,

        @InjectQueue('notification-queue')
        private readonly notificationQueue: Queue<NotificationJobData>,
    ) { }


    // =========================================================================
    // REDIS KEY HELPERS & CACHE MANAGEMENT
    // =========================================================================

    private getSeatsKey(eventId: number): string {
        return `event:${eventId}:available_seats`;
    }

    private getCacheKey(eventId: number): string {
        return `cache:event:${eventId}`;
    }

    private getListCacheKey(search?: string): string {
        return `cache:events:all:${search?.trim().toLowerCase() || 'default'}`;
    }

    private async invalidateEventsCache(eventId?: number): Promise<void> {
        if (eventId) {
            await this.redisService.del(this.getCacheKey(eventId));
        }
        await this.redisService.del([
            this.getListCacheKey(),
            'cache:events:all:default',
        ]);
    }

    private async ensureRedisSeatInventory(eventId: number, capacity: number): Promise<number> {
        const key = this.getSeatsKey(eventId);
        const existing = await this.redisService.get(key);
        if (existing !== null && existing !== undefined) {
            return Number(existing);
        }

        // Lazy initialize from PostgreSQL registration count
        const registeredCount = await this.registrationRepository.count({
            where: { eventId },
        });
        const available = Math.max(0, capacity - registeredCount);
        await this.redisService.set(key, available);
        this.logger.log(`[EVENT-SERVICE] ⚡ Redis inventory initialized: Event ${eventId} -> ${available} seats left.`);
        return available;
    }

    // =========================================================================
    // 1. CREATE EVENT
    // =========================================================================
    async create(data: {
        title: string;
        description: string;
        location: string;
        startDate: string;
        endDate: string;
        capacity: number;
        userId: number;
    }) {
        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Creating event "${data.title}" by User ${data.userId}...`);
        const event = this.eventRepository.create({
            title: data.title,
            description: data.description,
            location: data.location,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            capacity: data.capacity,
            createdBy: data.userId,
        });

        const savedEvent = await this.eventRepository.save(event);
        this.logger.log(`[EVENT-SERVICE] ✅ Database: Event saved with ID: ${savedEvent.id}`);

        // Initialize Redis seat inventory
        await this.redisService.set(this.getSeatsKey(savedEvent.id), savedEvent.capacity);

        // Invalidate cached lists
        await this.invalidateEventsCache();

        return savedEvent;
    }

    // =========================================================================
    // 2. FIND ALL EVENTS (WITH OPTIONAL SEARCH & REDIS CACHING)
    // =========================================================================
    async findAll(query?: { search?: string }) {
        const cacheKey = this.getListCacheKey(query?.search);

        // Cache-Aside: Check Redis first
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            this.logger.log(`[EVENT-SERVICE] ⚡ Redis Cache HIT: Returning cached events list for "${query?.search ?? 'all'}"`);
            try {
                return JSON.parse(cached);
            } catch {
                // In case of corrupt cache entry, proceed to DB
            }
        }

        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Fetching all events (search: ${query?.search ?? 'none'})...`);
        const whereClause = query?.search
            ? [
                { title: ILike(`%${query.search}%`) },
                { location: ILike(`%${query.search}%`) },
            ]
            : {};

        const events = await this.eventRepository.find({
            where: whereClause,
            order: { startDate: 'ASC' },
        });

        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Retrieved ${events.length} events. Caching in Redis (60s TTL)...`);
        await this.redisService.set(cacheKey, JSON.stringify(events), 60);

        return events;
    }

    // =========================================================================
    // 3. FIND ONE EVENT BY ID (WITH REMAINING CAPACITY & REDIS CACHING)
    // =========================================================================
    async findOne(id: number) {
        const cacheKey = this.getCacheKey(id);

        // Cache-Aside: Check Redis cache first
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            this.logger.log(`[EVENT-SERVICE] ⚡ Redis Cache HIT: Event ${id}`);
            try {
                return JSON.parse(cached);
            } catch {
                // In case of corrupt cache entry, proceed to DB
            }
        }

        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Finding event by ID: ${id}...`);
        const event = await this.eventRepository.findOne({
            where: { id },
        });

        if (!event) {
            this.logger.warn(`[EVENT-SERVICE] ⚠️ Event with ID ${id} not found.`);
            throw new RpcException({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Event with ID ${id} not found`,
            });
        }

        const registeredCount = await this.registrationRepository.count({
            where: { eventId: id },
        });

        const remainingSeats = Math.max(0, event.capacity - registeredCount);

        // Keep Redis inventory in sync
        await this.redisService.set(this.getSeatsKey(id), remainingSeats);

        const result = {
            ...event,
            registeredCount,
            remainingSeats,
        };

        // Cache single event for 120s
        await this.redisService.set(cacheKey, JSON.stringify(result), 120);

        return result;
    }

    // =========================================================================
    // 4. UPDATE EVENT (ORGANIZER ONLY)
    // =========================================================================
    async update(data: {
        id: number;
        userId: number;
        title?: string;
        description?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        capacity?: number;
    }) {
        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Updating event ID: ${data.id} by User ${data.userId}...`);
        const event = await this.eventRepository.findOne({
            where: { id: data.id },
        });

        if (!event) {
            throw new RpcException({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Event with ID ${data.id} not found`,
            });
        }

        if (event.createdBy !== data.userId) {
            this.logger.warn(`[EVENT-SERVICE] 🚫 Unauthorized: User ${data.userId} is not creator of event ${data.id}`);
            throw new RpcException({
                statusCode: HttpStatus.FORBIDDEN,
                message: 'You are not authorized to update this event',
            });
        }

        if (data.capacity !== undefined) {
            const registeredCount = await this.registrationRepository.count({
                where: { eventId: data.id },
            });
            if (data.capacity < registeredCount) {
                throw new RpcException({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: `New capacity (${data.capacity}) cannot be less than current registrations (${registeredCount})`,
                });
            }
            event.capacity = data.capacity;
            // Update Redis seat counter
            const newAvailable = Math.max(0, data.capacity - registeredCount);
            await this.redisService.set(this.getSeatsKey(data.id), newAvailable);
        }

        if (data.title) event.title = data.title;
        if (data.description) event.description = data.description;
        if (data.location) event.location = data.location;
        if (data.startDate) event.startDate = new Date(data.startDate);
        if (data.endDate) event.endDate = new Date(data.endDate);

        const updated = await this.eventRepository.save(event);
        await this.invalidateEventsCache(data.id);

        this.logger.log(`[EVENT-SERVICE] ✅ Database & Redis: Event ${data.id} updated successfully.`);
        return updated;
    }

    // =========================================================================
    // 5. DELETE EVENT (ORGANIZER ONLY)
    // =========================================================================
    async remove(data: { id: number; userId: number }) {
        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Deleting event ID: ${data.id} by User ${data.userId}...`);
        const event = await this.eventRepository.findOne({
            where: { id: data.id },
        });

        if (!event) {
            throw new RpcException({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Event with ID ${data.id} not found`,
            });
        }

        if (event.createdBy !== data.userId) {
            this.logger.warn(`[EVENT-SERVICE] 🚫 Unauthorized: User ${data.userId} is not creator of event ${data.id}`);
            throw new RpcException({
                statusCode: HttpStatus.FORBIDDEN,
                message: 'You are not authorized to delete this event',
            });
        }

        // Delete associated registrations first
        await this.registrationRepository.delete({ eventId: data.id });
        await this.eventRepository.delete(data.id);

        // Delete Redis seat counter and cache
        await this.redisService.del([this.getSeatsKey(data.id), this.getCacheKey(data.id)]);
        await this.invalidateEventsCache();

        this.logger.log(`[EVENT-SERVICE] ✅ Database & Redis: Event ${data.id} and registrations deleted.`);
        return {
            message: 'Event and associated registrations deleted successfully',
            eventId: data.id,
        };
    }

    // =========================================================================
    // 6. REGISTER FOR EVENT (With Atomic Zero-Overbooking Pre-Reservation)
    // =========================================================================
    async register(data: {
        eventId: number;
        userId: number;
    }) {
        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Processing registration for User ${data.userId} in Event ${data.eventId}...`);

        // 1. Check whether event exists
        const event = await this.eventRepository.findOne({
            where: {
                id: data.eventId,
            },
        });

        if (!event) {
            throw new RpcException({
                statusCode: HttpStatus.NOT_FOUND,
                message: 'Event not found',
            });
        }

        // 2. Check whether user is already registered in DB
        const existingRegistration =
            await this.registrationRepository.findOne({
                where: {
                    eventId: data.eventId,
                    userId: data.userId,
                },
            });

        if (existingRegistration) {
            throw new RpcException({
                statusCode: HttpStatus.CONFLICT,
                message: 'User is already registered for this event',
            });
        }

        // 3. Ensure Redis inventory is loaded
        await this.ensureRedisSeatInventory(data.eventId, event.capacity);

        // 4. ATOMIC PRE-RESERVATION IN REDIS
        // Redis DECR runs single-threaded in memory (< 1ms)
        const seatsAfterDecr = await this.redisService.decr(this.getSeatsKey(data.eventId));

        if (seatsAfterDecr < 0) {
            // Revert the negative decrement immediately
            await this.redisService.incr(this.getSeatsKey(data.eventId));
            this.logger.warn(`[EVENT-SERVICE] 🛑 Atomic check failed: Event ${data.eventId} is fully booked.`);
            throw new RpcException({
                statusCode: HttpStatus.CONFLICT,
                message: 'Event is already full',
            });
        }

        // 5. Commit registration in PostgreSQL
        try {
            const registration =
                this.registrationRepository.create({
                    eventId: data.eventId,
                    userId: data.userId,
                });

            const saved = await this.registrationRepository.save(registration);
            await this.invalidateEventsCache(data.eventId);

            // 6. BullMQ Asynchronous Job Dispatch (Producer)
            try {
                const job = await this.notificationQueue.add(
                    'send-registration-notification',
                    {
                        eventId: data.eventId,
                        userId: data.userId,
                        eventTitle: event.title,
                        registeredAt: saved.registeredAt ? saved.registeredAt.toISOString() : new Date().toISOString(),
                    },
                    {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 2000,
                        },
                        removeOnComplete: true,
                        removeOnFail: false,
                    },
                );

                this.logger.log(`[BULLMQ:PRODUCER] 🚀 Enqueued Job #${job.id} into 'notification-queue' (Event: "${event.title}", User: ${data.userId})`);
            } catch (queueError: any) {
                // Background queue failure should not abort the confirmed DB ticket, but be logged clearly
                this.logger.error(`[BULLMQ:PRODUCER] ⚠️ Failed to enqueue notification job: ${queueError.message}`);
            }

            this.logger.log(`[EVENT-SERVICE] ✅ Database & Redis: User ${data.userId} registered for Event ${data.eventId}. Remaining seats: ${seatsAfterDecr}`);
            return saved;
        } catch (dbError: any) {
            // Compensation transaction: rollback Redis held slot if DB write fails
            await this.redisService.incr(this.getSeatsKey(data.eventId));
            this.logger.error(`[EVENT-SERVICE] ⚠️ Database save failed, rolled back Redis slot: ${dbError.message}`);
            throw dbError;
        }
    }

    // =========================================================================
    // 7. CANCEL REGISTRATION
    // =========================================================================
    async cancelRegistration(data: { eventId: number; userId: number }) {
        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Cancelling registration for User ${data.userId} from Event ${data.eventId}...`);
        const registration = await this.registrationRepository.findOne({
            where: {
                eventId: data.eventId,
                userId: data.userId,
            },
        });

        if (!registration) {
            throw new RpcException({
                statusCode: HttpStatus.NOT_FOUND,
                message: 'Registration not found for this event',
            });
        }

        await this.registrationRepository.remove(registration);

        // Release slot back in Redis
        await this.redisService.incr(this.getSeatsKey(data.eventId));
        await this.invalidateEventsCache(data.eventId);

        this.logger.log(`[EVENT-SERVICE] ✅ Database & Redis: Registration cancelled and seat slot released.`);
        return {
            message: 'Registration cancelled successfully',
            eventId: data.eventId,
            userId: data.userId,
        };
    }

    // =========================================================================
    // 8. GET ATTENDEES FOR AN EVENT
    // =========================================================================
    async getAttendees(eventId: number) {
        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Fetching attendees for Event ID: ${eventId}...`);
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
        });

        if (!event) {
            throw new RpcException({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Event with ID ${eventId} not found`,
            });
        }

        const attendees = await this.registrationRepository.find({
            where: { eventId },
            order: { registeredAt: 'DESC' },
        });

        return {
            eventId,
            eventTitle: event.title,
            totalAttendees: attendees.length,
            attendees,
        };
    }

    // =========================================================================
    // ASYNCHRONOUS EVENT-DRIVEN HANDLERS (Used with @EventPattern / client.emit)
    // =========================================================================

    handleEventCreatedAsync(data: any) {
        this.logger.log(`[EVENT-SERVICE] 🔔 (ASYNC EVENT-DRIVEN) @EventPattern('event.created') received!`);
        this.logger.log(`[EVENT-SERVICE] 📧 Simulating: Sending confirmation email to Organizer (User ID: ${data.createdBy})...`);
        this.logger.log(`[EVENT-SERVICE] 🌐 Simulating: Broadcasting event "${data.title}" (ID: ${data.id}) to recommendation feeds.`);
    }

    handleEventRegisteredAsync(data: any) {
        this.logger.log(`[EVENT-SERVICE] 🎟️ (ASYNC EVENT-DRIVEN) @EventPattern('event.registered') received!`);
        this.logger.log(`[EVENT-SERVICE] 📧 Simulating: Sending Ticket with QR Code to Attendee (User ID: ${data.userId}) for Event ID: ${data.eventId}...`);
        this.logger.log(`[EVENT-SERVICE] 📊 Simulating: Updating event analytics and real-time attendance counter.`);
    }
}
