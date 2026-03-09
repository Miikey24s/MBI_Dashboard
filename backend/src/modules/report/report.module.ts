import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Report, Widget } from '../../thuc-the/report.entity';
import { QueryModule } from '../query/query.module';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Widget]), QueryModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
