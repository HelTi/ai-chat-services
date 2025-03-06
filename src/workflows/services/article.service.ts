import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplates } from 'src/config/langchain/promptTemplate';

export interface ArticleGenerateParams {
  topic: string;
  language?: 'zh' | 'en';
  style?: 'professional' | 'casual' | 'academic';
  wordCount?: number;
  articleType?: 'blog' | 'tutorial' | 'review' | 'opinion' | 'general';
}

export interface ArticleOutput {
  title: string;
  content: string;
  summary: string;
  keywords: string[];
}

export interface ArticleGenerateOptions {
  generateSummary?: boolean;
  generateKeywords?: boolean;
}

// 定义结果接口，避免使用any
export interface ArticleResult {
  title: string;
  outline: string;
  content: string;
  summary?: string;
  keywords?: string[];
}

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);
  private model: ChatOpenAI;
  private streamingModel: ChatOpenAI;

  constructor(private configService: ConfigService) {
    this.model = new ChatOpenAI({
      model: this.configService.get<string>('AI_MODEL') || 'gpt-4',
      temperature: 0.7,
      configuration: {
        apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        baseURL: this.configService.get<string>('OPENAI_API_BASE_URL'),
      },
    });

    this.streamingModel = new ChatOpenAI({
      model: this.configService.get<string>('AI_MODEL') || 'gpt-4',
      temperature: 0.7,
      streaming: true, // 启用流式输出
      configuration: {
        apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        baseURL: this.configService.get<string>('OPENAI_API_BASE_URL'),
      },
    });
  }

  async generateArticle(params: ArticleGenerateParams): Promise<ArticleOutput> {
    const template = PromptTemplates.articleGenerator;
    try {
      const prompt = PromptTemplate.fromTemplate(template);

      const chain = RunnableSequence.from([
        prompt,
        this.model,
        new StringOutputParser(),
        new JsonOutputParser(),
      ]);

      const response = await chain.invoke({
        topic: params.topic,
        language: params.language || 'zh',
        style: params.style || 'professional',
        wordCount: params.wordCount || 1000,
      });

      const jsonData = response as ArticleOutput;
      return jsonData;
    } catch (error) {
      this.logger.error('Article generation error:', error);
      throw error;
    }
  }

  async generateArticleLCEL(
    params: ArticleGenerateParams,
    streamHandler?: (chunk: string, type: string) => void,
    options?: ArticleGenerateOptions,
  ): Promise<ArticleResult> {
    try {
      const defaultOptions: ArticleGenerateOptions = {
        generateSummary: true,
        generateKeywords: true,
      };

      const finalOptions = { ...defaultOptions, ...options };
      const finalParams = {
        ...params,
        articleType: params.articleType || 'general',
      };

      const streamingModel = this.streamingModel;

      if (!streamHandler) {
        return this.generateArticleLCELNormal(finalParams, finalOptions);
      }

      const outlinePrompt = PromptTemplate.fromTemplate(
        '给定标题：{title}，类型：{articleType}{wordCount}，生成一个简洁的大纲，涵盖文章可能涉及的关键部分。每个条目应清晰且独立，确保大纲简明扼要，同时覆盖必要主题，确保不要给出大纲列表以外的任何内容和总结。',
      );
      const outlineSteam = await outlinePrompt
        .pipe(this.model)
        .pipe(new StringOutputParser())
        .stream({
          title: finalParams.topic,
          articleType: this.getArticleTypeDescription(finalParams.articleType),
          wordCount: finalParams.wordCount
            ? `，字数要求：${finalParams.wordCount}字`
            : '',
        });

      let outline = '';
      for await (const chunk of outlineSteam) {
        streamHandler(chunk, 'outline');
        outline += chunk;
      }

      const articlePrompt = PromptTemplate.fromTemplate(
        '根据以下大纲: {outline} 写一篇{articleType}类型的详细文章{wordCount}：这篇文章应该结构良好，内容丰富，引人入胜。',
      );

      const contentStream = await articlePrompt
        .pipe(streamingModel)
        .pipe(new StringOutputParser())
        .stream({
          outline,
          articleType: this.getArticleTypeDescription(finalParams.articleType),
          wordCount: finalParams.wordCount
            ? `，字数要求：${finalParams.wordCount}字`
            : '',
        });

      let fullContent = '';
      for await (const chunk of contentStream) {
        streamHandler(chunk, 'content');
        fullContent += chunk;
      }

      let summary = '';
      let keywords: string[] = [];

      if (finalOptions.generateSummary) {
        const summaryPrompt = PromptTemplate.fromTemplate(
          '请为以下文章内容生成一个300字以内文章摘要：{content}',
        );
        const summaryStream = await summaryPrompt
          .pipe(this.model)
          .pipe(new StringOutputParser())
          .stream({ content: fullContent });

        for await (const chunk of summaryStream) {
          streamHandler(chunk, 'summary');
          summary += chunk;
        }
      }

      if (finalOptions.generateKeywords) {
        const keywordsPrompt = PromptTemplate.fromTemplate(
          '请为以下文章内容提取1-2个关键词或标签，以JSON数组格式返回：{content}',
        );
        const keywordsResult = await keywordsPrompt
          .pipe(this.model)
          .pipe(new StringOutputParser())
          .pipe(new JsonOutputParser<string[]>())
          .invoke({ content: fullContent });

        keywords = keywordsResult;
        streamHandler(JSON.stringify(keywords), 'keywords');
      }

      const result: ArticleResult = {
        title: finalParams.topic,
        outline,
        content: fullContent,
      };

      if (finalOptions.generateSummary) {
        result.summary = summary;
      }

      if (finalOptions.generateKeywords) {
        result.keywords = keywords;
      }

      return result;
    } catch (error) {
      this.logger.error('Article generation error:', error);
      throw error;
    }
  }

  private async generateArticleLCELNormal(
    params: ArticleGenerateParams,
    options: ArticleGenerateOptions = {
      generateSummary: true,
      generateKeywords: true,
    },
  ): Promise<ArticleResult> {
    try {
      const finalParams = {
        ...params,
        articleType: params.articleType || 'general',
      };

      const outlinePrompt = PromptTemplate.fromTemplate(
        '给定标题：{title}，类型：{articleType}{wordCount}，生成一个简洁的大纲，涵盖文章可能涉及的关键部分。每个条目应清晰且独立，确保大纲简明扼要，同时覆盖必要主题，确保不要给出大纲列表以外的任何内容和总结。',
      );
      const outlineChain = outlinePrompt
        .pipe(this.model)
        .pipe(new StringOutputParser());

      const articlePrompt = PromptTemplate.fromTemplate(
        '根据以下大纲: {outline} 写一篇{articleType}类型的详细文章{wordCount}，这篇文章应该结构良好，内容丰富，引人入胜。',
      );
      const articleChain = articlePrompt
        .pipe(this.model)
        .pipe(new StringOutputParser());

      const outline = await outlineChain.invoke({
        title: finalParams.topic,
        articleType: this.getArticleTypeDescription(finalParams.articleType),
        wordCount: finalParams.wordCount
          ? `，字数要求：${finalParams.wordCount}字`
          : '',
      });
      const content = await articleChain.invoke({
        outline,
        articleType: this.getArticleTypeDescription(finalParams.articleType),
        wordCount: finalParams.wordCount
          ? `，字数要求：${finalParams.wordCount}字`
          : '',
      });

      const result: ArticleResult = {
        title: finalParams.topic,
        outline,
        content,
      };

      if (options.generateSummary) {
        const summaryPrompt = PromptTemplate.fromTemplate(
          '请为以下文章内容生成一个300字以内文章摘要：{content}',
        );
        const summaryChain = summaryPrompt
          .pipe(this.model)
          .pipe(new StringOutputParser());

        result.summary = await summaryChain.invoke({ content });
      }

      if (options.generateKeywords) {
        const keywordsPrompt = PromptTemplate.fromTemplate(
          '请为以下文章内容提取1-2个关键词或标签，以JSON数组格式返回：{content}',
        );
        const keywordsChain = keywordsPrompt
          .pipe(this.model)
          .pipe(new StringOutputParser())
          .pipe(new JsonOutputParser<string[]>());

        result.keywords = await keywordsChain.invoke({ content });
      }

      return result;
    } catch (error) {
      this.logger.error('Article generation error:', error);
      throw error;
    }
  }

  private getArticleTypeDescription(
    type: 'blog' | 'tutorial' | 'review' | 'opinion' | 'general',
  ): string {
    const typeMap = {
      blog: '博客文章',
      tutorial: '教程指南',
      review: '产品评测',
      opinion: '观点评论',
      general: '通用文章',
    };
    return typeMap[type];
  }

  async test(): Promise<any> {
    const r = await this.model.invoke('Hello, world!');
    return r;
  }
}
