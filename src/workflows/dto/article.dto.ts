import { ApiProperty } from '@nestjs/swagger';

export class GenerateArticleDto {
  @ApiProperty({
    description: '文章主题',
    example: '人工智能对未来工作的影响',
  })
  topic: string;

  @ApiProperty({
    description: '文章语言',
    enum: ['zh', 'en'],
    default: 'zh',
    required: false,
  })
  language?: 'zh' | 'en';

  @ApiProperty({
    description: '文章风格',
    enum: ['professional', 'casual', 'academic'],
    default: 'professional',
    required: false,
  })
  style?: 'professional' | 'casual' | 'academic';

  @ApiProperty({
    description: '文章字数',
    example: 1000,
    required: false,
  })
  wordCount?: number;
}

export class ArticleResponseDto {
  @ApiProperty({
    description: '文章标题',
    example: '人工智能革命：重塑未来职业格局',
  })
  title: string;

  @ApiProperty({
    description: '文章内容',
    example: '近年来，人工智能技术的快速发展...',
  })
  content: string;

  @ApiProperty({
    description: '文章摘要',
    example: '本文探讨了人工智能对未来就业市场的影响...',
  })
  summary: string;

  @ApiProperty({
    description: '关键词列表',
    example: ['人工智能', '就业市场', '职业变革'],
  })
  keywords: string[];
}
