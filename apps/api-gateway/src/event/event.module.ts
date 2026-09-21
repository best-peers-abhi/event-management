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
                    host: process.env.EVENT_SERVICE_HOST || 'localhost',
                    port: Number(process.env.EVENT_SERVICE_PORT) || 3003,
                },
            },
            {
                name: 'KAFKA_SERVICE',
                transport: Transport.KAFKA,
                options: {
                    client: {
                        clientId: 'api-gateway',
                        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
                    },
                    producer: {
                        allowAutoTopicCreation: true,
                    },
                },
            },
        ]),
    ],
    providers: [],
    exports: [],
    controllers: [EventController],
})
export class EventModule { }
