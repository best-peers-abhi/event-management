import { NestFactory } from '@nestjs/core';
import { AiServiceModule } from './ai-service.module.js';
import { Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AiServiceBootstrap');
  const port = Number(process.env.TCP_PORT) || 3004;
  const host = process.env.TCP_HOST || '0.0.0.0';

  const app = await NestFactory.createMicroservice(
    AiServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen();
  logger.log(`[AI-SERVICE] 🚀 Microservice running on TCP ${host}:${port}`);
}
await bootstrap();
