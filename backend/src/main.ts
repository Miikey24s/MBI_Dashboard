import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedDatabase } from './seed';
import { createSuperAdmin } from './create-super-admin';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Seed database on startup
  try {
    const dataSource = app.get(DataSource);
    await seedDatabase(dataSource);
    await createSuperAdmin(dataSource);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }

  await app.listen(process.env.PORT ?? 4000);
  console.log(`🚀 Backend running on http://localhost:${process.env.PORT ?? 4000}`);
}
bootstrap();
