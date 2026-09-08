import { NestFactory } from '@nestjs/core';
import { EventServiceModule } from './event-service.module.js';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(EventServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3003,
    }
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen()
}
bootstrap();
