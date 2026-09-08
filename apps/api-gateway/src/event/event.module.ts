import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventController } from './event.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [
        AuthModule,
        ClientsModule.register([
            {
                name: 'EVENT_SERVICE',
                transport: Transport.TCP,
                options: {
                    host: 'localhost',
                    port: 3003,
                },
            },
        ]),
    ],
    providers: [],
    exports: [],
    controllers: [EventController],
})
export class EventModule { }
