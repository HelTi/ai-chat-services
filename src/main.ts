import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('AI Chat API')
    .setDescription('The AI Chat API description')
    .setVersion('1.0')
    .addTag('ai')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 启用 CORS，允许所有来源
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ?? 3030;
  await app.listen(port);
  console.log(`Server is running on port http://localhost:${port}`);
  console.log(
    `Swagger documentation is available at http://localhost:${port}/api`,
  );
}
bootstrap().catch(err => console.error('Bootstrap error:', err));
