import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { ArticleService } from './services/article.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [WorkflowsController],
  providers: [ArticleService],
})
export class WorkflowsModule {}
