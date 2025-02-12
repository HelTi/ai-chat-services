import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS，允许所有来源
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ?? 3030;
  await app.listen(port);
  console.log(`Server is running on port http://localhost:${port}`);
}
bootstrap().catch(err => console.error('Bootstrap error:', err));
