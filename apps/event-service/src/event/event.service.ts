import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './entities/event.entity.js';
import { ILike, Repository } from 'typeorm';
import { EventRegistration } from './entities/event-registration.entity.js';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class EventService {
    private readonly logger = new Logger(EventService.name);

    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,

        @InjectRepository(EventRegistration)
        private registrationRepository: Repository<EventRegistration>,
    ) { }

    // 1. CREATE EVENT
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
        return savedEvent;
    }

    // 2. FIND ALL EVENTS (WITH OPTIONAL SEARCH)
    async findAll(query?: { search?: string }) {
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

        this.logger.log(`[EVENT-SERVICE] 🗄️ Database: Retrieved ${events.length} events.`);
        return events;
    }

    // 3. FIND ONE EVENT BY ID (WITH REMAINING CAPACITY INFO)
    async findOne(id: number) {
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

        return {
            ...event,
            registeredCount,
            remainingSeats: Math.max(0, event.capacity - registeredCount),
        };
    }

    // 4. UPDATE EVENT (ORGANIZER ONLY)
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
        }

        if (data.title) event.title = data.title;
        if (data.description) event.description = data.description;
        if (data.location) event.location = data.location;
        if (data.startDate) event.startDate = new Date(data.startDate);
        if (data.endDate) event.endDate = new Date(data.endDate);

        const updated = await this.eventRepository.save(event);
        this.logger.log(`[EVENT-SERVICE] ✅ Database: Event ${data.id} updated successfully.`);
        return updated;
    }

    // 5. DELETE EVENT (ORGANIZER ONLY)
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

        this.logger.log(`[EVENT-SERVICE] ✅ Database: Event ${data.id} and registrations deleted.`);
        return {
            message: 'Event and associated registrations deleted successfully',
            eventId: data.id,
        };
    }

    // 6. REGISTER FOR EVENT
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

        // 2. Check whether user already registered
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

        // 3. Check event capacity
        const registrationCount =
            await this.registrationRepository.count({
                where: {
                    eventId: data.eventId,
                },
            });

        if (registrationCount >= event.capacity) {
            throw new RpcException({
                statusCode: HttpStatus.CONFLICT,
                message: 'Event is already full',
            });
        }

        // 4. Create registration
        const registration =
            this.registrationRepository.create({
                eventId: data.eventId,
                userId: data.userId,
            });

        const saved = await this.registrationRepository.save(registration);
        this.logger.log(`[EVENT-SERVICE] ✅ Database: User ${data.userId} registered successfully for Event ${data.eventId}.`);
        return saved;
    }

    // 7. CANCEL REGISTRATION
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
        this.logger.log(`[EVENT-SERVICE] ✅ Database: Registration cancelled successfully.`);
        return {
            message: 'Registration cancelled successfully',
            eventId: data.eventId,
            userId: data.userId,
        };
    }

    // 8. GET ATTENDEES FOR AN EVENT
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

