import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tăng giới hạn body size cho file upload (50MB)
  app.use(json({ limit: '50mb' }));

  // Bật validation cho DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các field không có trong DTO
      transform: true, // Tự động chuyển đổi kiểu dữ liệu
      forbidNonWhitelisted: true, // Báo lỗi nếu có field lạ
    }),
  );

  app.setGlobalPrefix('api', { exclude: [''] });
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
