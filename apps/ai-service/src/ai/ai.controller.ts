import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GroqService, AiGenerateResult } from '../groq/groq.service.js';
import { AiGenerateDto } from '../dto/ai-generate.dto.js';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly groqService: GroqService) { }

  @MessagePattern('ai.generate')
  async generate(@Payload() data: AiGenerateDto): Promise<AiGenerateResult> {
    this.logger.log(`[AI-SERVICE] 📥 Microservice received TCP message 'ai.generate' of type: "${data.type}"`);
    return this.groqService.generate(data);
  }
}
