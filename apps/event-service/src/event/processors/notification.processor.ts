import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationJobData } from '../interfaces/notification-job.interface.js';

@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    /**
     * Core unit of work executed by the worker when a job is pulled from Redis.
     */
    async process(job: Job<NotificationJobData>): Promise<{
        success: boolean;
        jobId: string;
        eventId: number;
        userId: number;
        processedAt: string;
    }> {
        this.logger.log(`================================================================================`);
        this.logger.log(`[BULLMQ:WORKER] ⚙️ Processing Job ID: #${job.id} (Queue: "notification-queue")`);
        this.logger.log(`[BULLMQ:WORKER] 🏷️ Job Name: "${job.name}" | Attempt: ${job.attemptsMade + 1} of ${job.opts.attempts || 1}`);
        this.logger.log(`[BULLMQ:WORKER] 📦 Payload: Event ID ${job.data.eventId} ("${job.data.eventTitle}") for User ID ${job.data.userId}`);
        this.logger.log(`[BULLMQ:WORKER] 🕒 Queued At: ${job.data.registeredAt}`);
        this.logger.log(`================================================================================`);

        // Step 1: Update progress to 25%
        await job.updateProgress(25);
        this.logger.log(`[BULLMQ:WORKER] 📊 Job #${job.id} Progress: 25% (Payload validation completed)`);

        // Step 2: Simulate processing latency (educational demonstration without sending real emails)
        await new Promise((resolve) => setTimeout(resolve, 300));
        await job.updateProgress(75);
        this.logger.log(`[BULLMQ:WORKER] 📊 Job #${job.id} Progress: 75% (Simulated background dispatch executed)`);

        // Step 3: Complete job
        await job.updateProgress(100);
        this.logger.log(`[BULLMQ:WORKER] 📊 Job #${job.id} Progress: 100% (Job execution finished)`);

        return {
            success: true,
            jobId: job.id ?? 'unknown',
            eventId: job.data.eventId,
            userId: job.data.userId,
            processedAt: new Date().toISOString(),
        };
    }

    // =========================================================================
    // BULLMQ LIFECYCLE EVENT LISTENERS
    // =========================================================================

    @OnWorkerEvent('active')
    onActive(job: Job<NotificationJobData>) {
        this.logger.log(`[BULLMQ:LIFECYCLE] 🟡 Job #${job.id} transitioned to ACTIVE state (Worker acquired lock from Redis)`);
    }

    @OnWorkerEvent('progress')
    onProgress(job: Job<NotificationJobData>, progress: number | object) {
        this.logger.log(`[BULLMQ:LIFECYCLE] 📈 Job #${job.id} reported progress: ${typeof progress === 'number' ? `${progress}%` : JSON.stringify(progress)}`);
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<NotificationJobData>, result: any) {
        const duration = job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : 'N/A';
        this.logger.log(`[BULLMQ:LIFECYCLE] 🟢 Job #${job.id} transitioned to COMPLETED state (Execution time: ${duration}ms)`);
        this.logger.log(`[BULLMQ:LIFECYCLE] 📄 Job Result: ${JSON.stringify(result)}`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<NotificationJobData>, error: Error) {
        this.logger.error(`[BULLMQ:LIFECYCLE] 🔴 Job #${job.id} transitioned to FAILED state!`);
        this.logger.error(`[BULLMQ:LIFECYCLE] ⚠️ Error message: ${error.message}`);
        this.logger.error(`[BULLMQ:LIFECYCLE] 🔄 Attempts made: ${job.attemptsMade} / Max allowed: ${job.opts.attempts || 1}`);

        if (job.attemptsMade < (job.opts.attempts || 1)) {
            this.logger.warn(`[BULLMQ:LIFECYCLE] ⏳ Job #${job.id} will be retried automatically by BullMQ using exponential backoff.`);
        } else {
            this.logger.error(`[BULLMQ:LIFECYCLE] 💀 Job #${job.id} has exhausted all retry attempts and moved to the Dead Letter Queue (DLQ).`);
        }
    }
}
