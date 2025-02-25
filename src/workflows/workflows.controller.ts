import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ArticleService } from './services/article.service';
import { GenerateArticleDto, ArticleResponseDto } from './dto/article.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('workflows')
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly articleService: ArticleService) {}

  @Post('article')
  @ApiOperation({ summary: '生成文章' })
  @ApiResponse({
    status: 200,
    description: '文章生成成功',
    type: ArticleResponseDto,
  })
  async generateArticle(
    @Body() generateArticleDto: GenerateArticleDto,
  ): Promise<any> {
    return await this.articleService.generateArticleLCEL(generateArticleDto);
  }

  @Get('test')
  @ApiOperation({ summary: '测试' })
  @ApiResponse({
    status: 200,
    description: '测试响应成功',
  })
  async test(): Promise<any> {
    return await this.articleService.test();
  }

  @Post('generate-article/stream')
  @ApiOperation({ summary: '生成文章流式模式' })
  @ApiResponse({
    status: 200,
    description: '文章生成成功',
    type: ArticleResponseDto,
  })
  async generateArticleStream(
    @Res() response: Response,
    @Body() body: GenerateArticleDto,
  ) {
    console.log('body', body);
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    try {
      await this.articleService.generateArticleLCEL(body, (chunk, type) => {
        response.write(`data: ${JSON.stringify({ type, content: chunk })}\n\n`);
      });

      response.end();
    } catch (error) {
      console.error('Stream error:', error);
      response.status(500).json({ error: 'Stream processing failed' });
    }
  }
}
