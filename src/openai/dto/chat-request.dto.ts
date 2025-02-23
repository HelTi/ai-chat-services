import { ApiProperty } from '@nestjs/swagger';
import OpenAI from 'openai';

export class ChatRequestDto {
  @ApiProperty({
    description: 'Array of chat messages',
    example: [
      {
        role: 'user',
        content: 'Hello, how are you?',
      },
    ],
  })
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
}
