import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleType } from '../services/article.service';

export class GenerateArticleDto {
  @ApiProperty({
    description: '文章主题',
    example: '人工智能的未来发展趋势',
  })
  topic: string;

  @ApiPropertyOptional({
    description: '文章语言',
    enum: ['zh', 'en'],
    default: 'zh',
  })
  language?: 'zh' | 'en';

  @ApiPropertyOptional({
    description: '文章类型',
    enum: ['blog', 'tutorial', 'review', 'opinion', 'general'],
    default: 'general',
  })
  articleType?: ArticleType;

  @ApiPropertyOptional({
    description: '文章字数',
    example: 1000,
    default: 1000,
  })
  wordCount?: number;

  @ApiProperty({
    description: 'OpenAI API Key',
    example: 'sk-...',
  })
  openai_api_key: string;

  @ApiProperty({
    description: 'OpenAI API Base URL',
    example: 'https://api.deepseek.com/v1',
  })
  openai_api_base_url: string;

  @ApiPropertyOptional({
    description: 'OpenAI 模型名称',
    example: 'deepseek-chat',
    default: 'deepseek-chat',
  })
  model?: string;

  @ApiPropertyOptional({
    description: '模型温度参数',
    example: 0.7,
    default: 0.7,
  })
  temperature?: number;

  @ApiPropertyOptional({
    description: '是否使用流式输出',
    example: true,
    default: true,
  })
  streaming?: boolean;
}

export class ArticleResponseDto {
  @ApiProperty({
    description: '文章标题',
    example: '人工智能的未来发展趋势',
  })
  title: string;

  @ApiProperty({
    description: '文章大纲',
    example: '1. 引言\n2. 当前AI技术现状\n3. 未来发展方向\n4. 结论',
  })
  outline: string;

  @ApiProperty({
    description: '文章内容',
    example: '人工智能正在迅速发展...',
  })
  content: string;

  @ApiPropertyOptional({
    description: '文章摘要',
    example: '本文探讨了人工智能的未来发展趋势...',
  })
  summary?: string;

  @ApiPropertyOptional({
    description: '文章关键词',
    example: ['人工智能', '技术趋势'],
    type: [String],
  })
  keywords?: string[];
}
