import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryService } from './query.service';
import { QueryController } from './query.controller';
import { DataRow } from '../../thuc-the/dataset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DataRow])],
  controllers: [QueryController],
  providers: [QueryService],
  exports: [QueryService],
})
export class QueryModule {}
