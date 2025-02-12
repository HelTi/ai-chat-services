import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { OpenAiService } from './openai.service';
import { Response } from 'express';
import OpenAI from 'openai';

@Controller('openai')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAiService) {}
  @Get('')
  async test(): Promise<any> {
    return await this.openaiService.createChatCompletion([
      { role: 'user', content: '测试响应' },
    ]);
  }

  @Post('chat')
  async chat(
    @Body() body: { messages: OpenAI.Chat.ChatCompletionMessageParam[] },
  ) {
    return await this.openaiService.createChatCompletion(body.messages);
  }

  @Post('chat/stream')
  async streamChat(@Res() response: Response) {
    try {
      const stream = await this.openaiService.createChatCompletionStream([
        { role: 'user', content: '测试流式响应' },
      ]);

      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          response.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      response.end();
    } catch (error) {
      console.error('Stream error:', error);
      response.status(500).json({ error: 'Stream processing failed' });
    }
  }
}
