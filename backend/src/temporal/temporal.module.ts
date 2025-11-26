import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemporalClientProvider } from './temporal.provider';
import { WorkerService } from './worker.service';
import { SalesEtlActivities } from '../activities/sales-etl.activities';
import { SalesRecord } from '../entities/sales-record.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SalesRecord]),
  ],
  providers: [TemporalClientProvider, WorkerService, SalesEtlActivities],
  exports: [TemporalClientProvider],
})
export class TemporalModule {}
