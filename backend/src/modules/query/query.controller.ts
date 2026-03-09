import { Controller, Post, Body } from '@nestjs/common';
import { QueryService } from './query.service';
import { IsNumber, IsOptional, IsArray, IsObject } from 'class-validator';

class ExecuteQueryDto {
  @IsNumber()
  datasetId: number;

  @IsObject()
  config: {
    dimensions?: string[];
    measures?: { column: string; aggregate: string; alias?: string }[];
    filters?: { column: string; operator: string; value: any }[];
    sort?: { column: string; direction: string };
    limit?: number;
  };
}

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post('execute')
  execute(@Body() dto: ExecuteQueryDto) {
    return this.queryService.executeQuery(dto.datasetId, dto.config as any);
  }
}
