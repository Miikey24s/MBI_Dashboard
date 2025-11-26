import { Controller, Post, Body, Inject, Get, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Client } from '@temporalio/client';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { TEMPORAL_CLIENT } from '../temporal/temporal.provider';
import { SalesRecord } from '../entities/sales-record.entity';

@Controller('sales')
export class SalesController {
  constructor(
    @Inject(TEMPORAL_CLIENT) private readonly temporalClient: Client,
    @InjectRepository(SalesRecord) private readonly salesRepository: Repository<SalesRecord>,
  ) {}

  @Get()
  async getSales(@Query('tenantId') tenantId: string) {
    if (!tenantId) {
      return [];
    }
    return this.salesRepository.find({
      where: { tenantId },
      order: { date: 'DESC' },
    });
  }

  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File, @Body('tenantId') tenantId: string) {
    if (!file || !tenantId) {
      return { error: 'File and tenantId are required' };
    }

    // Parse Excel buffer
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    // Map to strictly typed objects
    const data = rawData.map((item: any) => ({
      tenantId,
      amount: item.Amount || item.amount,
      date: item.Date || item.date || new Date().toISOString(),
      source: item.Source || item.source || 'EXCEL_UPLOAD',
    }));

    const handle = await this.temporalClient.workflow.start('importSalesWorkflow', {
      taskQueue: 'bi-etl-queue',
      args: [tenantId, data],
      workflowId: `sales-etl-excel-${tenantId}-${Date.now()}`,
    });

    return {
      message: 'Excel parsed and ETL Workflow started',
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
      recordCount: data.length,
    };
  }

  @Post('trigger-etl')
  async triggerEtl(@Body('tenantId') tenantId: string) {
    if (!tenantId) {
      return { error: 'tenantId is required' };
    }

    // Mock data for manual trigger
    const mockData = [
      { amount: 100, date: new Date().toISOString(), source: 'API_A', tenantId },
      { amount: 200, date: new Date().toISOString(), source: 'API_B', tenantId },
    ];

    const handle = await this.temporalClient.workflow.start('importSalesWorkflow', {
      taskQueue: 'bi-etl-queue',
      args: [tenantId, mockData],
      workflowId: `sales-etl-${tenantId}-${Date.now()}`,
    });

    return {
      message: 'Sales ETL Workflow started',
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
    };
  }
}
