import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsController } from './workflows.controller';
import { ArticleService } from './services/article.service';
import { GenerateArticleDto } from './dto/article.dto';
import { ArticleResult } from './services/article.service';
import { ConfigService } from '@nestjs/config';

describe('WorkflowsController', () => {
  let controller: WorkflowsController;
  let articleService: ArticleService;

  // 模拟 ArticleService 的返回数据
  const mockArticleOutput: ArticleResult = {
    title: '测试标题',
    outline: '测试大纲',
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
            generateArticleLCEL: jest.fn().mockResolvedValue(mockArticleOutput),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation(key => {
              if (key === 'OPENAI_API_KEY') return 'test-api-key';
              if (key === 'OPENAI_API_BASE_URL')
                return 'https://test-api-url.com';
              return null;
            }),
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
        articleType: 'blog',
        wordCount: 1000,
        openai_api_key: 'test-api-key',
        openai_api_base_url: 'https://test-api-url.com',
        model: 'gpt-4',
        temperature: 0.7,
        streaming: true,
      };

      const result: ArticleResult = await controller.generateArticle(params);

      expect(result).toEqual(mockArticleOutput);
      const generateArticleLCEL = jest.spyOn(
        articleService,
        'generateArticleLCEL',
      );
      expect(generateArticleLCEL).toHaveBeenCalledWith(
        params,
        undefined,
        expect.any(Object),
      );
      expect(generateArticleLCEL).toHaveBeenCalledTimes(1);
    });

    it('should use default values when optional params are not provided', async () => {
      const generateArticleLCEL = jest.spyOn(
        articleService,
        'generateArticleLCEL',
      );
      const params = {
        topic: '测试主题',
        openai_api_key: 'test-api-key',
        openai_api_base_url: 'https://test-api-url.com',
      };

      await controller.generateArticle(params);

      expect(generateArticleLCEL).toHaveBeenCalledWith(
        params,
        undefined,
        expect.any(Object),
      );
    });

    it('should handle errors from article service', async () => {
      const params = {
        topic: '测试主题',
        openai_api_key: 'test-api-key',
        openai_api_base_url: 'https://test-api-url.com',
      };

      const errorMessage = 'Article generation failed';
      jest
        .spyOn(articleService, 'generateArticleLCEL')
        .mockRejectedValueOnce(new Error(errorMessage));

      await expect(controller.generateArticle(params)).rejects.toThrow(
        errorMessage,
      );
    });
  });
});
