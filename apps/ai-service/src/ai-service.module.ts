import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai/ai.controller.js';
import { GroqService } from './groq/groq.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AiController],
  providers: [GroqService],
})
export class AiServiceModule { }
