import { Module } from '@nestjs/common';
import { EventController } from './event.controller.js';
import { EventService } from './event.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Event } from './entities/event.entity.js';
import { EventRegistration } from './entities/event-registration.entity.js';
import { NotificationProcessor } from './processors/notification.processor.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventRegistration]),
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
  ],
  controllers: [EventController],
  providers: [EventService, NotificationProcessor],
  exports: [EventService],
})
export class EventModule { }

