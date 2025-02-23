import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenAiModule } from './openai/openai.module';
import { ConfigModule } from '@nestjs/config';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({
  imports: [
    OpenAiModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WorkflowsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
