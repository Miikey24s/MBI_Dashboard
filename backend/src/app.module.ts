import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { SalesController } from './controllers/sales.controller';
import { AppService } from './app.service';
import { TemporalModule } from './temporal/temporal.module';
import { SalesRecord } from './entities/sales-record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Chỉ dùng cho môi trường dev, không dùng cho production
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([SalesRecord]),
    TemporalModule,
  ],
  controllers: [AppController, SalesController],
  providers: [AppService],
})
export class AppModule {}
