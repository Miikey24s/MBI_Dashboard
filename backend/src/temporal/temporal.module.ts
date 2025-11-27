import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemporalClientProvider } from './temporal.provider';
import { WorkerService } from './worker.service';
import { SalesEtlActivities } from '../activities/sales-etl.activities';
import { SalesRecord } from '../entities/sales-record.entity';
import { EtlJob } from '../entities/etl-job.entity';
import { TelegramService } from '../services/telegram.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SalesRecord, EtlJob]),
  ],
  providers: [TemporalClientProvider, WorkerService, SalesEtlActivities, TelegramService],
  exports: [TemporalClientProvider],
})
export class TemporalModule {}
