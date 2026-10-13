import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AiController } from './ai.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      {
        name: 'AI_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AI_SERVICE_HOST || 'localhost',
          port: Number(process.env.AI_SERVICE_PORT) || 3004,
        },
      },
    ]),
  ],
  controllers: [AiController],
})
export class AiModule {}
