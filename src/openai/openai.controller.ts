import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { OpenAiService } from './openai.service';
import { Response } from 'express';
import OpenAI from 'openai';
import { PromptsTemplate } from 'src/config/prompt';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

// 添加 DTO 类
import { ChatRequestDto } from './dto/chat-request.dto';
import { StreamChatRequestDto } from './dto/stream-chat-request.dto';

@ApiTags('openai')
@Controller('openai')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAiService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({ status: 200, description: 'Test response successful.' })
  async test(): Promise<any> {
    return await this.openaiService.createChatCompletion([
      { role: 'user', content: 'who are you?' },
    ]);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat completion endpoint' })
  @ApiResponse({ status: 200, description: 'Chat completion successful.' })
  @ApiBody({ type: ChatRequestDto })
  async chat(@Body() body: ChatRequestDto) {
    return await this.openaiService.createChatCompletion(body.messages);
  }

  @Post('chat/stream')
  @ApiOperation({ summary: 'Streaming chat completion endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Streaming chat started successfully.',
  })
  @ApiBody({ type: StreamChatRequestDto })
  async streamChat(
    @Res() response: Response,
    @Body() body: StreamChatRequestDto,
  ) {
    const promptTemplate = body?.promptTemplate || 'default';

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: PromptsTemplate[promptTemplate] },
      ...(body?.messages || []),
    ];

    try {
      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');

      const stream =
        await this.openaiService.createChatCompletionStream(messages);

      for await (const chunk of stream) {
        const content = chunk || '';
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
