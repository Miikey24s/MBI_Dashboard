/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ===== Import Entities =====
import { ToChuc, NguoiDung } from './thuc-the';
import { Dataset, DataRow } from './thuc-the/dataset.entity';
import { Report, Widget } from './thuc-the/report.entity';

// ===== Import Modules =====
import { NguoiDungModule } from './modules/nguoi-dung/nguoi-dung.module';
import { ToChucModule } from './modules/to-chuc/to-chuc.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatasetModule } from './modules/dataset/dataset.module';
import { ReportModule } from './modules/report/report.module';
import { QueryModule } from './modules/query/query.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'bi_user',
      password: process.env.DB_PASSWORD || 'bi_password',
      database: process.env.DB_DATABASE || 'bi_dashboard',
      entities: [
        ToChuc,
        NguoiDung,
        Dataset,
        DataRow,
        Report,
        Widget,
      ],
      synchronize: true,
      logging: false,
    }),

    // Core modules
    AuthModule,
    NguoiDungModule,
    ToChucModule,

    // BI modules
    DatasetModule,
    ReportModule,
    QueryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
