import { Module } from '@nestjs/common';
import { EventController } from './event.controller.js';
import { EventService } from './event.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity.js';
import { EventRegistration } from './entities/event-registration.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventRegistration])],
  controllers: [EventController],
  providers: [EventService]
})
export class EventModule { }
