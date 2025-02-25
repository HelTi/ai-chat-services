import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('ai chat services')
    .setDescription('ai chat services API')
    .setVersion('1.0')
    .addTag('ai')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const corsOptions = {
    origin:
      process.env.NODE_ENV === 'production'
        ? /^https:\/\/(.*\.)?ttkit\.cn$/ // 生产环境只允许 ttkit.cn 及其子域名访问
        : ['http://localhost:3000', 'http://localhost:3001'], // 开发环境允许特定域名访问
    credentials: true,
  };
  app.enableCors(corsOptions);

  const port = process.env.PORT ?? 3030;
  await app.listen(port);
  console.log(`Server is running on port http://localhost:${port}`);
  console.log(
    `Swagger documentation is available at http://localhost:${port}/api`,
  );
}
bootstrap().catch(err => console.error('Bootstrap error:', err));
