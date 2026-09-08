import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserServiceModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3001,
    },
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen();
}
await bootstrap();
