import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('UserServiceBootstrap');

  const app = await NestFactory.create(UserServiceModule);

  // 1. TCP RPC Transport (Port 3001) for Synchronous Operations
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.TCP_HOST || '0.0.0.0',
      port: Number(process.env.TCP_PORT) || 3001,
    },
  });

  // 2. Kafka Transport for Asynchronous Event Consumption
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'user-service',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: 'user-service-group',
        allowAutoTopicCreation: true,
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.startAllMicroservices();
  logger.log('🚀 User Service is running on TCP (port 3001) & Kafka (user-service-group)');
}
await bootstrap();
