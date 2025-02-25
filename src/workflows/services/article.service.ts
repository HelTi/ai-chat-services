import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import {
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplates } from 'src/config/langchain/promptTemplate';

export interface ArticleGenerateParams {
  topic: string;
  language?: 'zh' | 'en';
  style?: 'professional' | 'casual' | 'academic';
  wordCount?: number;
}

export interface ArticleOutput {
  title: string;
  content: string;
  summary: string;
  keywords: string[];
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
  ): Promise<any> {
    try {
      // 创建支持流式输出的模型实例
      const streamingModel = this.streamingModel;

      // 如果没有提供流处理器，使用常规处理
      if (!streamHandler) {
        return this.generateArticleLCELNormal(params);
      }

      // 大纲生成（不流式）
      const outlinePrompt = PromptTemplate.fromTemplate(
        '为标题为` {title} `的文章生成详细的大纲。我希望大纲包括引言、主要章节和结论，内容逻辑清晰简洁。',
      );
      const outlineSteam = await outlinePrompt
        .pipe(this.model)
        .pipe(new StringOutputParser())
        .stream({ title: params.topic });

      // 通知大纲已生成
      let outline = '';
      for await (const chunk of outlineSteam) {
        streamHandler(chunk, 'outline');
        outline += chunk;
      }

      // 文章内容生成（流式）
      const articlePrompt = PromptTemplate.fromTemplate(
        '根据以下大纲: {outline} 写一篇详细的文章：这篇文章应该结构良好，内容丰富，引人入胜。',
      );

      // 开始流式生成文章
      const contentStream = await articlePrompt
        .pipe(streamingModel)
        .pipe(new StringOutputParser())
        .stream({ outline });

      let fullContent = '';
      for await (const chunk of contentStream) {
        streamHandler(chunk, 'content');
        fullContent += chunk;
      }

      // 摘要生成（不流式）
      const summaryPrompt = PromptTemplate.fromTemplate(
        '请为以下文章内容生成一个简洁的摘要（200字以内）：{content}',
      );
      const summaryStream = await summaryPrompt
        .pipe(this.model)
        .pipe(new StringOutputParser())
        .stream({ content: fullContent });

      // 通知摘要已生成
      let summary = '';
      for await (const chunk of summaryStream) {
        streamHandler(chunk, 'summary');
        summary += chunk;
      }

      // 关键词生成（不流式）
      const keywordsPrompt = PromptTemplate.fromTemplate(
        '请为以下文章内容提取1-2个关键词或标签，以JSON数组格式返回：{content}',
      );
      const keywords = await keywordsPrompt
        .pipe(this.model)
        .pipe(new StringOutputParser())
        .pipe(new JsonOutputParser<string[]>())
        .invoke({ content: outline });

      // 通知关键词已生成
      streamHandler(JSON.stringify(keywords), 'keywords');

      // 返回完整结果
      return {
        title: params.topic,
        outline,
        content: fullContent,
        summary,
        keywords,
      };
    } catch (error) {
      this.logger.error('Article generation error:', error);
      throw error;
    }
  }

  // 保留原有的非流式处理方法
  private async generateArticleLCELNormal(
    params: ArticleGenerateParams,
  ): Promise<any> {
    try {
      const outlinePrompt = PromptTemplate.fromTemplate(
        '为标题为` {title} `的文章生成详细的大纲。提纲应包括文章的主要部分和子部分。',
      );
      const outlineChain = outlinePrompt
        .pipe(this.model)
        .pipe(new StringOutputParser());

      const articlePrompt = PromptTemplate.fromTemplate(
        '根据以下大纲: {outline} 写一篇详细的文章：这篇文章应该结构良好，内容丰富，引人入胜。',
      );
      const articleChain = articlePrompt
        .pipe(this.model)
        .pipe(new StringOutputParser());

      const summaryPrompt = PromptTemplate.fromTemplate(
        '请为以下文章内容生成一个简洁的摘要（200字以内）：{content}',
      );
      const summaryChain = summaryPrompt
        .pipe(this.model)
        .pipe(new StringOutputParser());

      const keywordsPrompt = PromptTemplate.fromTemplate(
        '请为以下文章内容提取1-2个关键词或标签，以JSON数组格式返回：{content}',
      );
      const keywordsChain = keywordsPrompt
        .pipe(this.model)
        .pipe(new StringOutputParser())
        .pipe(new JsonOutputParser<string[]>());

      const formatChain = new RunnableLambda({
        func: (input: {
          outline: string;
          content: string;
          summary: string;
          keywords: string[];
        }) => ({
          title: params.topic,
          outline: input.outline,
          content: input.content,
          summary: input.summary,
          keywords: input.keywords,
        }),
      });

      const fullChain = new RunnablePassthrough()
        .pipe(outlineChain)
        .pipe(
          new RunnableLambda({
            func: (outline: string) => ({
              outline,
              outlineForPrompt: outline,
            }),
          }),
        )
        .pipe(
          RunnableSequence.from([
            {
              outline: (input: { outline: string }) => input.outline,
              content: (input: { outline: string }) =>
                articleChain.invoke({ outline: input.outline }),
            },
            new RunnableLambda({
              func: async (input: { outline: string; content: string }) => {
                const summary = await summaryChain.invoke({
                  content: input.content,
                });
                const keywords = await keywordsChain.invoke({
                  content: input.content,
                });
                return {
                  outline: input.outline,
                  content: input.content,
                  summary,
                  keywords,
                };
              },
            }),
            formatChain,
          ]),
        );

      const response = await fullChain.invoke({
        title: params.topic,
      });

      return response;
    } catch (error) {
      this.logger.error('Article generation error:', error);
      throw error;
    }
  }

  async test(): Promise<any> {
    const r = await this.model.invoke('Hello, world!');
    return r;
  }
}
