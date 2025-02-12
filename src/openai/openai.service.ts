import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      baseURL:
        this.configService.get<string>('OPENAI_API_BASE_URL') ||
        'https://api.openai.com',
    });
  }

  async createChatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
  ) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('AI_MODEL') || 'gpt-4',
        messages,
      });

      return response;
    } catch (error) {
      this.logger.error('AI API error:', error);
      throw error instanceof Error ? error : new Error('AI API error');
    }
  }

  async createChatCompletionStream(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
  ) {
    try {
      const stream = await this.openai.chat.completions.create({
        model: this.configService.get<string>('AI_MODEL') || 'gpt-4',
        messages,
        stream: true,
      });

      return stream;
    } catch (error) {
      this.logger.error('AI API error:', error);
      throw error instanceof Error ? error : new Error('AI API error');
    }
  }
}
