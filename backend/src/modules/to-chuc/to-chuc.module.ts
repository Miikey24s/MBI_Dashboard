import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToChucService } from './to-chuc.service';
import { ToChucController } from './to-chuc.controller';
import { ToChuc } from '../../thuc-the';

@Module({
  imports: [TypeOrmModule.forFeature([ToChuc])],
  controllers: [ToChucController],
  providers: [ToChucService],
  exports: [ToChucService],
})
export class ToChucModule {}
