import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module.js';
import { LoggingInterceptor } from './common/logging.interceptor.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();

