import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsController } from './workflows.controller';
import { ArticleService } from './services/article.service';
import { GenerateArticleDto } from './dto/article.dto';

describe('WorkflowsController', () => {
  let controller: WorkflowsController;
  let articleService: ArticleService;

  // 模拟 ArticleService 的返回数据
  const mockArticleOutput = {
    title: '测试标题',
    content: '测试内容',
    summary: '测试摘要',
    keywords: ['关键词1', '关键词2'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowsController],
      providers: [
        {
          provide: ArticleService,
          useValue: {
            generateArticle: jest.fn().mockResolvedValue(mockArticleOutput),
          },
        },
      ],
    }).compile();

    controller = module.get<WorkflowsController>(WorkflowsController);
    articleService = module.get<ArticleService>(ArticleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateArticle', () => {
    it('should generate article successfully', async () => {
      const params: GenerateArticleDto = {
        topic: '测试主题',
        language: 'zh' as const,
        style: 'professional',
        wordCount: 1000,
      };

      const result = await controller.generateArticle(params);

      expect(result).toEqual(mockArticleOutput);
      const generateArticle = jest.spyOn(articleService, 'generateArticle');
      expect(generateArticle).toHaveBeenCalledWith(params);
      expect(generateArticle).toHaveBeenCalledTimes(1);
    });

    it('should use default values when optional params are not provided', async () => {
      const generateArticle = jest.spyOn(articleService, 'generateArticle');
      const params = {
        topic: '测试主题',
      };

      await controller.generateArticle(params);

      expect(generateArticle).toHaveBeenCalledWith({
        topic: '测试主题',
      });
    });

    it('should handle errors from article service', async () => {
      const params = {
        topic: '测试主题',
      };

      const errorMessage = 'Article generation failed';
      jest
        .spyOn(articleService, 'generateArticle')
        .mockRejectedValueOnce(new Error(errorMessage));

      await expect(controller.generateArticle(params)).rejects.toThrow(
        errorMessage,
      );
    });
  });
});
