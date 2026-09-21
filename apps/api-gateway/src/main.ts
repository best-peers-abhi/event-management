import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module.js';
import { LoggingInterceptor } from './common/logging.interceptor.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  app.enableCors({
    origin: ['http://localhost:4000', 'http://127.0.0.1:4000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  app.useGlobalInterceptors(new LoggingInterceptor());
  const port = process.env.PORT ?? process.env.port ?? 3000;
  await app.listen(port, '0.0.0.0');
}
await bootstrap();

