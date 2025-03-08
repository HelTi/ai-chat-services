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
