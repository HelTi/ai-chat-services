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

  constructor(private configService: ConfigService) {
    this.model = new ChatOpenAI({
      model: this.configService.get<string>('AI_MODEL') || 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
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

  async generateArticleLCEL(params: ArticleGenerateParams): Promise<any> {
    try {
      const outlinePrompt = PromptTemplate.fromTemplate(
        "Generate a detailed outline for an article with the title '{title}'. The outline should include the main sections and sub-sections of the article.",
      );
      const outlineChain = outlinePrompt
        .pipe(this.model)
        .pipe(new StringOutputParser());

      const articlePrompt = PromptTemplate.fromTemplate(
        'Write a comprehensive article based on the following outline: {outline}. The article should be well-structured, informative, and engaging. It should be around 1000 words.',
      );
      const articleChain = articlePrompt
        .pipe(this.model)
        .pipe(new StringOutputParser());

      const formatChain = new RunnableLambda({
        func: (input: { outline: { outline: string }; content: string }) => ({
          outline: input.outline.outline,
          content: input.content,
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
              outline: new RunnablePassthrough(),
              content: (input: { outlineForPrompt: string }) =>
                articleChain.invoke({ outline: input.outlineForPrompt }),
            },
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
