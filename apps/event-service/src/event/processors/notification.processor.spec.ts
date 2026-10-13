import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationProcessor } from './notification.processor.js';
import { Job } from 'bullmq';
import { NotificationJobData } from '../interfaces/notification-job.interface.js';

describe('NotificationProcessor (BullMQ Worker)', () => {
    let processor: NotificationProcessor;

    beforeEach(() => {
        processor = new NotificationProcessor();
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    it('should successfully process a notification job and update progress', async () => {
        const mockJob = {
            id: '101',
            name: 'send-registration-notification',
            attemptsMade: 0,
            opts: { attempts: 3 },
            data: {
                eventId: 1,
                userId: 2,
                eventTitle: 'Dev Conference 2026',
                registeredAt: new Date().toISOString(),
            },
            updateProgress: vi.fn().mockResolvedValue(undefined),
        } as unknown as Job<NotificationJobData>;

        const result = await processor.process(mockJob);

        expect(mockJob.updateProgress).toHaveBeenCalledWith(25);
        expect(mockJob.updateProgress).toHaveBeenCalledWith(75);
        expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
        expect(result).toEqual({
            success: true,
            jobId: '101',
            eventId: 1,
            userId: 2,
            processedAt: expect.any(String),
        });
    });

    it('should trigger onActive and onCompleted lifecycle hooks cleanly', () => {
        const mockJob = {
            id: '102',
            name: 'send-registration-notification',
            processedOn: 1000,
            finishedOn: 1350,
        } as unknown as Job<NotificationJobData>;

        expect(() => processor.onActive(mockJob)).not.toThrow();
        expect(() => processor.onCompleted(mockJob, { success: true })).not.toThrow();
    });

    it('should trigger onFailed lifecycle hook cleanly for both retryable and exhausted errors', () => {
        const retryableJob = {
            id: '103',
            attemptsMade: 1,
            opts: { attempts: 3 },
        } as unknown as Job<NotificationJobData>;

        const exhaustedJob = {
            id: '104',
            attemptsMade: 3,
            opts: { attempts: 3 },
        } as unknown as Job<NotificationJobData>;

        const error = new Error('Simulated network failure');

        expect(() => processor.onFailed(retryableJob, error)).not.toThrow();
        expect(() => processor.onFailed(exhaustedJob, error)).not.toThrow();
    });
});
