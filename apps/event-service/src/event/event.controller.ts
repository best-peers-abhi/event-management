import { Controller, Logger } from '@nestjs/common';
import { EventService } from './event.service.js';
import { Ctx, EventPattern, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';

@Controller('event')
export class EventController {
    private readonly logger = new Logger(EventController.name);

    constructor(private readonly eventService: EventService) { }

    // =========================================================================
    // REQUEST - RESPONSE MESSAGE PATTERNS (Synchronous RPC via client.send)
    // =========================================================================

    @MessagePattern('events.create')
    async create(@Payload() data: any) {
        this.logger.log(`[EVENT-SERVICE] 📥 Microservice received TCP pattern 'events.create' for: "${data.title}"`);
        return this.eventService.create(data);
    }

    @MessagePattern('events.findAll')
    async findAll(@Payload() query: any) {
        this.logger.log(`[EVENT-SERVICE] 📥 Microservice received TCP pattern 'events.findAll'`);
        return this.eventService.findAll(query);
    }

    @MessagePattern('events.findOne')
    async findOne(@Payload() id: number) {
        this.logger.log(`[EVENT-SERVICE] 📥 Microservice received TCP pattern 'events.findOne' for ID: ${id}`);
        return this.eventService.findOne(Number(id));
    }

    @MessagePattern('events.update')
    async update(@Payload() data: any) {
        this.logger.log(`[EVENT-SERVICE] 📥 Microservice received TCP pattern 'events.update' for ID: ${data.id}`);
        return this.eventService.update(data);
    }

    @MessagePattern('events.remove')
    async remove(@Payload() data: { id: number; userId: number }) {
        this.logger.log(`[EVENT-SERVICE] 📥 Microservice received TCP pattern 'events.remove' for ID: ${data.id}`);
        return this.eventService.remove(data);
    }

    @MessagePattern('events.register')
    async register(@Payload() data: any) {
        this.logger.log(`[EVENT-SERVICE] 📥 Microservice received TCP pattern 'events.register' for Event ID: ${data.eventId}`);
        return this.eventService.register(data);
    }

    @MessagePattern('events.cancelRegistration')
    async cancelRegistration(@Payload() data: { eventId: number; userId: number }) {
        this.logger.log(`[EVENT-SERVICE] 📥 Microservice received TCP pattern 'events.cancelRegistration' for Event ID: ${data.eventId}`);
        return this.eventService.cancelRegistration(data);
    }

    @MessagePattern('events.getAttendees')
    async getAttendees(@Payload() eventId: number) {
        this.logger.log(`[EVENT-SERVICE] 📥 Microservice received TCP pattern 'events.getAttendees' for Event ID: ${eventId}`);
        return this.eventService.getAttendees(Number(eventId));
    }

    // =========================================================================
    // EVENT PATTERNS (Asynchronous Kafka Pub/Sub via client.emit)
    // =========================================================================

    @EventPattern('event.created')
    async handleEventCreated(@Payload() data: any, @Ctx() context?: KafkaContext | unknown) {
        const kafkaCtx = context as KafkaContext;
        this.logger.log(`[EVENT-SERVICE] 🔔 [KAFKA CONSUMER] Consumed 'event.created' topic for Event: "${data?.title}" (ID: ${data?.id})`);
        this.eventService.handleEventCreatedAsync(data);
        const topic = kafkaCtx.getTopic();
        const partition = kafkaCtx.getPartition();
        const message = kafkaCtx.getMessage();

        this.logger.log(
            `[KAFKA] Topic: ${topic}, Partition: ${partition}, Offset: ${message.offset}`,
        );
    }

    @EventPattern('event.registered')
    async handleEventRegistered(@Payload() data: any) {
        this.logger.log(`[EVENT-SERVICE] 📥 Event received via @EventPattern('event.registered')`);
        this.eventService.handleEventRegisteredAsync(data);
    }
}

