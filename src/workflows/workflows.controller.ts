import { Body, Controller, Get, Post, Res, Query } from '@nestjs/common';
import { ArticleService } from './services/article.service';
import { GenerateArticleDto, ArticleResponseDto } from './dto/article.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ArticleResult } from './services/article.service';

@ApiTags('workflows')
@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly configService: ConfigService,
  ) {}

  @Post('article')
  @ApiOperation({ summary: '生成文章' })
  @ApiResponse({
    status: 200,
    description: '文章生成成功',
    type: ArticleResponseDto,
  })
  @ApiQuery({ name: 'generateSummary', required: false, type: Boolean })
  @ApiQuery({ name: 'generateKeywords', required: false, type: Boolean })
  async generateArticle(
    @Body() generateArticleDto: GenerateArticleDto,
    @Query('generateSummary') generateSummary?: string,
    @Query('generateKeywords') generateKeywords?: string,
  ): Promise<ArticleResult> {
    const options = {
      generateSummary: generateSummary !== 'false',
      generateKeywords: generateKeywords !== 'false',
    };

    return await this.articleService.generateArticleLCEL(
      generateArticleDto,
      undefined,
      options,
    );
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
  @ApiQuery({ name: 'generateSummary', required: false, type: Boolean })
  @ApiQuery({ name: 'generateKeywords', required: false, type: Boolean })
  async generateArticleStream(
    @Res() response: Response,
    @Body() body: GenerateArticleDto,
    @Query('generateSummary') generateSummary?: string,
    @Query('generateKeywords') generateKeywords?: string,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    try {
      const options = {
        generateSummary: generateSummary === 'true',
        generateKeywords: generateKeywords === 'true',
      };

      await this.articleService.generateArticleLCEL(
        body,
        (chunk, type) => {
          response.write(
            `data: ${JSON.stringify({ type, content: chunk })}\n\n`,
          );
        },
        options,
      );

      response.end();
    } catch (error) {
      console.error('Stream error:', error);
      response.status(500).json({ error: 'Stream processing failed' });
    }
  }
}
