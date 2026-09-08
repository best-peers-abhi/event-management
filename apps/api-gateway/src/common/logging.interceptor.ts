import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const http = context.switchToHttp();
        const request = http.getRequest<Request>();
        const response = http.getResponse<Response>();

        if (!request || !request.method) {
            return next.handle();
        }

        const { method, originalUrl } = request;
        const startTime = Date.now();

        this.logger.log(`[API-GATEWAY] 🌐 ---> HTTP Request: ${method} ${originalUrl}`);

        return next.handle().pipe(
            tap({
                next: () => {
                    const statusCode = response.statusCode;
                    const duration = Date.now() - startTime;
                    this.logger.log(`[API-GATEWAY] 🌐 <--- HTTP Response: ${method} ${originalUrl} ${statusCode} (+${duration}ms)`);
                },
                error: (error) => {
                    const statusCode = error?.status || error?.statusCode || 500;
                    const duration = Date.now() - startTime;
                    this.logger.error(`[API-GATEWAY] 🌐 <--- HTTP Response Error: ${method} ${originalUrl} ${statusCode} (+${duration}ms) - ${error?.message}`);
                }
            }),
        );
    }
}
