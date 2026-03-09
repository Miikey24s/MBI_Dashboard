import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasetService } from './dataset.service';
import { DatasetController } from './dataset.controller';
import { Dataset, DataRow } from '../../thuc-the/dataset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dataset, DataRow])],
  controllers: [DatasetController],
  providers: [DatasetService],
  exports: [DatasetService],
})
export class DatasetModule {}
