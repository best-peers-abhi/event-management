import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { AiGenerateDto } from '../dto/ai-generate.dto.js';

export interface AiGenerateResult {
  suggestions: string[];
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private groqClient: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.groqClient = this.initClient();
      this.logger.log('Groq SDK initialized successfully with API key.');
    } else {
      this.logger.warn('GROQ_API_KEY is not defined. Groq AI requests will fail until an API key is provided.');
    }
  }

  private initClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('GROQ_API_KEY is not configured on the server. Please check environment variables.');
    }

    const rawBaseURL = process.env.GROQ_BASE_URL || process.env.GROQ_API_URL;
    // groq-sdk internally appends /openai/v1/chat/completions.
    // If the configured URL ends with /openai/v1, strip it to prevent duplicate path (/openai/v1/openai/v1/...)
    const baseURL = rawBaseURL
      ? rawBaseURL.replace(/\/openai\/v1\/?$/, '').replace(/\/+$/, '')
      : undefined;

    return new Groq({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }

  private getClient(): Groq {
    if (!this.groqClient) {
      this.groqClient = this.initClient();
    }
    return this.groqClient;
  }

  async generate(dto: AiGenerateDto): Promise<AiGenerateResult> {
    const groq = this.getClient();
    const { type, prompt, context } = dto;

    this.logger.log(`[AI-SERVICE] Processing generate request for type: "${type}", prompt: "${prompt.slice(0, 50)}..."`);

    let systemMessage = '';
    let userMessage = '';
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (type === 'title') {
      systemMessage = `You are a creative marketing and event planning assistant.
Generate 3 to 4 catchy, professional, and clear event titles based on the user's keywords or brief concept.
Each title should be distinct in style (e.g. bold/inspirational, professional/conference, punchy/modern).
Return ONLY a valid JSON object with the key "suggestions" containing an array of string titles.
Example format:
{
  "suggestions": [
    "NextGen DevOps & Cloud Architecture Summit 2026",
    "Mastering Modern Cloud Infrastructure: Hands-On Workshop",
    "DevOps Horizons: Microservices, Pipelines & Scale"
  ]
}`;

      userMessage = `Event Concept / Keywords: "${prompt}"`;
      if (context) {
        userMessage += `\nAdditional Context: "${context}"`;
      }
    } else if (type === 'description') {
      systemMessage = `You are an expert event copywriter.
Generate 2 to 3 engaging, well-formatted event descriptions based on the provided topic/title and keywords.
Each description should be approximately 2 to 4 paragraphs or bullet points covering:
1. Event overview & vision
2. What attendees will learn / key highlights
3. Who should attend
Return ONLY a valid JSON object with the key "suggestions" containing an array of string descriptions.
Example format:
{
  "suggestions": [
    "Join leading engineers and architects for an immersive conference...\\n\\nKey Highlights:\\n• Real-world case studies\\n• Live hands-on demos\\n\\nIdeal for developers and technical leads.",
    "Discover the future of scalable systems in this fast-paced summit...\\n\\nAgenda Overview:\\n• Best practices in microservice orchestration\\n• High-throughput messaging with Kafka\\n\\nSecure your spot today!"
  ]
}`;

      userMessage = `Topic / Keywords: "${prompt}"`;
      if (context) {
        userMessage += `\nEvent Title & Context: "${context}"`;
      }
    }

    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500,
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new InternalServerErrorException('Empty response received from Groq AI.');
      }

      const parsed = JSON.parse(responseContent);
      let suggestions: string[] = [];

      if (Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions;
      } else if (Array.isArray(parsed.titles)) {
        suggestions = parsed.titles;
      } else if (Array.isArray(parsed.descriptions)) {
        suggestions = parsed.descriptions;
      } else if (typeof parsed === 'object') {
        // Fallback: collect all string values in the parsed object
        suggestions = Object.values(parsed).filter((v): v is string => typeof v === 'string');
      }

      if (suggestions.length === 0) {
        throw new InternalServerErrorException('Failed to extract suggestions from AI response.');
      }

      this.logger.log(`[AI-SERVICE] Successfully generated ${suggestions.length} suggestions.`);
      return { suggestions };
    } catch (error: any) {
      this.logger.error(`[AI-SERVICE] Groq AI generation error: ${error?.message || error}`, error?.stack);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(error?.message || 'Error occurred while contacting Groq AI service.');
    }
  }
}
