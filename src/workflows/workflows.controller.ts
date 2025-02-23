import { Body, Controller, Get, Post } from '@nestjs/common';
import { ArticleService } from './services/article.service';
import { GenerateArticleDto, ArticleResponseDto } from './dto/article.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

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
  ): Promise<ArticleResponseDto> {
    return await this.articleService.generateArticle(generateArticleDto);
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
}
