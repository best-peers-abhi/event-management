import { NestFactory } from '@nestjs/core';
import { EventServiceModule } from './event-service.module.js';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('EventServiceBootstrap');

  const app = await NestFactory.create(EventServiceModule);

  // 1. TCP RPC Transport (Port 3003) for Synchronous Operations
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.TCP_HOST || '0.0.0.0',
      port: Number(process.env.TCP_PORT) || 3003,
    },
  });

  // 2. Kafka Transport for Asynchronous Event Consumption
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'event-service',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: 'event-service-group',
        allowAutoTopicCreation: true,
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();
  logger.log('🚀 Event Service is running on TCP (port 3003) & Kafka (event-service-group)');
}
await bootstrap();
