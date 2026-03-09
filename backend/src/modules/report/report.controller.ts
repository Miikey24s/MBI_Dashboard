import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { IsNumber, IsString, IsOptional, IsObject, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ReportService } from './report.service';

class CreateWidgetDto {
  @ValidateIf((o) => o.datasetId !== null && o.datasetId !== undefined)
  @IsNumber()
  @Transform(({ value }) => value === null ? null : Number(value))
  datasetId?: number | null;

  @IsString()
  ten: string;

  @IsString()
  chartType: string;

  @IsObject()
  @IsOptional()
  config?: any;

  @IsObject()
  position: { x: number; y: number; w: number; h: number };
}

class UpdateWidgetDto {
  @IsNumber()
  @IsOptional()
  datasetId?: number;

  @IsString()
  @IsOptional()
  ten?: string;

  @IsString()
  @IsOptional()
  chartType?: string;

  @IsObject()
  @IsOptional()
  config?: any;

  @IsObject()
  @IsOptional()
  position?: { x: number; y: number; w: number; h: number };
}

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // Report endpoints
  @Post()
  createReport(
    @Body('toChucId') toChucId: number,
    @Body('ten') ten: string,
    @Body('moTa') moTa?: string,
    @Body('templateId') templateId?: string,
  ) {
    return this.reportService.createReport(toChucId, ten, moTa, templateId);
  }

  @Get()
  findAllReports(@Query('toChucId') toChucId: string) {
    const id = parseInt(toChucId, 10);
    if (isNaN(id)) return [];
    return this.reportService.findAllReports(id);
  }

  @Get(':id')
  findOneReport(@Param('id') id: string) {
    return this.reportService.findOneReport(+id);
  }

  @Get(':id/data')
  getReportData(@Param('id') id: string) {
    return this.reportService.getReportData(+id);
  }

  @Patch(':id')
  updateReport(@Param('id') id: string, @Body() data: { ten?: string; moTa?: string }) {
    return this.reportService.updateReport(+id, data);
  }

  @Delete(':id')
  removeReport(@Param('id') id: string) {
    return this.reportService.removeReport(+id);
  }

  // Widget endpoints
  @Post(':reportId/widget')
  createWidget(@Param('reportId') reportId: string, @Body() dto: CreateWidgetDto) {
    return this.reportService.createWidget(
      +reportId,
      dto.datasetId ?? null,
      dto.ten,
      dto.chartType as any,
      dto.config || {},
      dto.position,
    );
  }

  @Get('widget/:widgetId/data')
  getWidgetData(@Param('widgetId') widgetId: string) {
    return this.reportService.getWidgetData(+widgetId);
  }

  @Patch('widget/:widgetId')
  updateWidget(@Param('widgetId') widgetId: string, @Body() dto: UpdateWidgetDto) {
    return this.reportService.updateWidget(+widgetId, dto as any);
  }

  @Delete('widget/:widgetId')
  removeWidget(@Param('widgetId') widgetId: string) {
    return this.reportService.removeWidget(+widgetId);
  }
}
