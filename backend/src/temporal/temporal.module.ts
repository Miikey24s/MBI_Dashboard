import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TemporalClientProvider } from './temporal.provider';
import { WorkerService } from './worker.service';

@Module({
  imports: [ConfigModule],
  providers: [TemporalClientProvider, WorkerService],
  exports: [TemporalClientProvider],
})
export class TemporalModule {}
