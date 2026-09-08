import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Logger,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

interface AuthenticatedRequest extends Request {
    user: {
        userId: number;
        email: string;
    };
}

@Controller('event')
export class EventController {
    private readonly logger = new Logger(EventController.name);

    constructor(
        @Inject('EVENT_SERVICE') private readonly eventService: ClientProxy,
    ) { }

    // =========================================================================
    // 1. CREATE EVENT (POST /event) - Protected
    // =========================================================================
    @UseGuards(JwtAuthGuard)
    @Post()
    async create(
        @Body() createEventDto: any,
        @Req() request: AuthenticatedRequest,
    ) {
        const user = request.user;
        const payload = {
            ...createEventDto,
            userId: user.userId,
        };

        this.logger.log(`[API-GATEWAY] 📥 HTTP POST /event received from User ID: ${user.userId}`);
        this.logger.log(`[API-GATEWAY] ➡️ Step 1 (Synchronous RPC): Calling eventService.send('events.create')...`);

        // 1. SYNCHRONOUS RPC: Wait for event to be created in DB
        const createdEvent = await firstValueFrom(
            this.eventService.send('events.create', payload),
        );

        // 2. ASYNCHRONOUS EVENT-DRIVEN NOTIFICATION (client.emit):
        // Fire-and-forget background task (e.g. notify subscribers, indexing, analytics)
        this.logger.log(`[API-GATEWAY] ⚡ Step 2 (Async Fire-and-Forget): Calling eventService.emit('event.created')...`);
        this.eventService.emit('event.created', createdEvent);

        return createdEvent;
    }

    // =========================================================================
    // 2. GET ALL EVENTS (GET /event?search=...) - Public
    // =========================================================================
    @Get()
    async findAll(@Query() query: any) {
        this.logger.log(`[API-GATEWAY] 📥 HTTP GET /event received (search: ${query?.search ?? 'none'})`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP 'events.findAll' to EVENT_SERVICE (port 3003)...`);
        return this.eventService.send('events.findAll', query || {});
    }

    // =========================================================================
    // 3. GET SINGLE EVENT BY ID (GET /event/:id) - Public
    // =========================================================================
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        this.logger.log(`[API-GATEWAY] 📥 HTTP GET /event/${id} received`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP 'events.findOne' (ID: ${id}) to EVENT_SERVICE (port 3003)...`);
        return this.eventService.send('events.findOne', id);
    }

    // =========================================================================
    // 4. UPDATE EVENT (PATCH /event/:id) - Protected (Organizer Only)
    // =========================================================================
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEventDto: any,
        @Req() request: AuthenticatedRequest,
    ) {
        const user = request.user;
        this.logger.log(`[API-GATEWAY] 📥 HTTP PATCH /event/${id} received from User ID: ${user.userId}`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP 'events.update' (ID: ${id}) to EVENT_SERVICE (port 3003)...`);

        return this.eventService.send('events.update', {
            id,
            userId: user.userId,
            ...updateEventDto,
        });
    }

    // =========================================================================
    // 5. DELETE EVENT (DELETE /event/:id) - Protected (Organizer Only)
    // =========================================================================
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: AuthenticatedRequest,
    ) {
        const user = request.user;
        this.logger.log(`[API-GATEWAY] 📥 HTTP DELETE /event/${id} received from User ID: ${user.userId}`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP 'events.remove' (ID: ${id}) to EVENT_SERVICE (port 3003)...`);

        return this.eventService.send('events.remove', {
            id,
            userId: user.userId,
        });
    }

    // =========================================================================
    // 6. REGISTER FOR EVENT (POST /event/:id/register) - Protected
    // =========================================================================
    @UseGuards(JwtAuthGuard)
    @Post(':id/register')
    async register(
        @Param('id', ParseIntPipe) eventId: number,
        @Req() request: AuthenticatedRequest,
    ) {
        const user = request.user;
        this.logger.log(`[API-GATEWAY] 📥 HTTP POST /event/${eventId}/register received from User ID: ${user.userId}`);
        this.logger.log(`[API-GATEWAY] ➡️ Step 1 (Synchronous RPC): Calling eventService.send('events.register')...`);

        // 1. SYNCHRONOUS RPC: Check capacity & save registration in DB
        const registration = await firstValueFrom(
            this.eventService.send('events.register', {
                eventId,
                userId: user.userId,
            }),
        );

        // 2. ASYNCHRONOUS EVENT-DRIVEN NOTIFICATION (client.emit):
        // Fire-and-forget background task (e.g. email ticket, QR code generation)
        this.logger.log(`[API-GATEWAY] ⚡ Step 2 (Async Fire-and-Forget): Calling eventService.emit('event.registered')...`);
        this.eventService.emit('event.registered', {
            eventId,
            userId: user.userId,
            registrationId: registration?.id,
        });

        return registration;
    }

    // =========================================================================
    // 7. CANCEL REGISTRATION (DELETE /event/:id/register) - Protected
    // =========================================================================
    @UseGuards(JwtAuthGuard)
    @Delete(':id/register')
    async cancelRegistration(
        @Param('id', ParseIntPipe) eventId: number,
        @Req() request: AuthenticatedRequest,
    ) {
        const user = request.user;
        this.logger.log(`[API-GATEWAY] 📥 HTTP DELETE /event/${eventId}/register received from User ID: ${user.userId}`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP 'events.cancelRegistration' to EVENT_SERVICE (port 3003)...`);

        return this.eventService.send('events.cancelRegistration', {
            eventId,
            userId: user.userId,
        });
    }

    // =========================================================================
    // 8. GET EVENT ATTENDEES (GET /event/:id/attendees) - Protected
    // =========================================================================
    @UseGuards(JwtAuthGuard)
    @Get(':id/attendees')
    async getAttendees(
        @Param('id', ParseIntPipe) eventId: number,
    ) {
        this.logger.log(`[API-GATEWAY] 📥 HTTP GET /event/${eventId}/attendees received`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP 'events.getAttendees' (Event ID: ${eventId}) to EVENT_SERVICE (port 3003)...`);

        return this.eventService.send('events.getAttendees', eventId);
    }
}

