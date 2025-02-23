import { ApiProperty } from '@nestjs/swagger';
import OpenAI from 'openai';

export class StreamChatRequestDto {
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

  @ApiProperty({
    description: 'Prompt template name',
    example: 'default',
    required: false,
  })
  promptTemplate?: string;
}
