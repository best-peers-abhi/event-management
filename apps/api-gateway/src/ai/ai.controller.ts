import {
  Body,
  Controller,
  Inject,
  Logger,
  Post,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Request } from 'express';
import { firstValueFrom, timeout } from 'rxjs';
import { GenerateAiDto } from './dto/generate-ai.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    @Inject('AI_SERVICE') private readonly aiService: ClientProxy,
  ) {}

  /**
   * Unified AI generation endpoint for titles and descriptions
   * POST /ai/generate
   */
  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generate(
    @Body() dto: GenerateAiDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = request.user;
    this.logger.log(
      `[API-GATEWAY] 📥 AI Generation request received from User ID ${user?.userId || 'unknown'}: type="${dto.type}"`,
    );

    try {
      // 15 seconds timeout for LLM generation RPC
      const result = await firstValueFrom(
        this.aiService.send('ai.generate', dto).pipe(timeout(15000)),
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        `[API-GATEWAY] Error calling AI service: ${error?.message || error}`,
        error?.stack,
      );

      const status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error?.message || 'Failed to generate AI suggestions. Please try again.';
      throw new HttpException(message, status);
    }
  }
}
