import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: any = 'Internal server error';

        // Case 1: Standard HTTP Exception (thrown directly in Gateway)
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'string' ? res : (res as any).message || message;
        }
        // Case 2: Error emitted by ClientProxy / TCP RPC
        else if (exception) {
            const errorPayload = exception.error ?? exception;

            if (typeof errorPayload === 'object' && errorPayload !== null) {
                const rawStatus =
                    errorPayload.statusCode ||
                    errorPayload.status ||
                    exception.statusCode ||
                    exception.status;

                if (typeof rawStatus === 'number' && rawStatus >= 100 && rawStatus < 600) {
                    status = rawStatus;
                }

                message =
                    errorPayload.message ||
                    exception.message ||
                    'Microservice communication error';
            } else if (typeof errorPayload === 'string') {
                message = errorPayload;
            } else if (typeof exception.message === 'string') {
                message = exception.message;
            }

            // In case message is stringified JSON
            if (typeof message === 'string') {
                try {
                    const parsed = JSON.parse(message);
                    if (parsed && typeof parsed === 'object') {
                        if (parsed.statusCode || parsed.status) {
                            status = parsed.statusCode || parsed.status;
                        }
                        if (parsed.message) {
                            message = parsed.message;
                        }
                    }
                } catch {
                    // Not JSON string
                }
            }
        }

        if (typeof status !== 'number' || status < 100 || status >= 600) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        this.logger.error(
            `[API-GATEWAY] ⚠️ Handled error -> Status: ${status} | Message: ${JSON.stringify(message)}`,
        );

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
        });
    }
}

