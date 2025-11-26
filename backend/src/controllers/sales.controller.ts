import { Controller, Post, Body, Inject, Get, Query, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
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

  @Delete()
  async deleteSales(@Query('tenantId') tenantId: string) {
    if (!tenantId) {
      return { error: 'tenantId is required' };
    }
    await this.salesRepository.delete({ tenantId });
    return { message: 'All sales records deleted' };
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

    if (rawData.length > 0) {
      console.log('First row of uploaded Excel:', rawData[0]);
    } else {
      console.log('Uploaded Excel is empty');
    }

    // Map to strictly typed objects
    const data = rawData.map((item: any) => ({
      tenantId,
      amount: item.Amount || item.amount || item['Số tiền'] || item['Doanh thu'] || item['Giá trị'] || 0,
      date: item.Date || item.date || item['Ngày'] || item['Ngày tháng'] || new Date().toISOString(),
      source: item.Source || item.source || item['Nguồn'] || item['Kênh'] || 'EXCEL_UPLOAD',
    }));

    // Filter out invalid records (e.g. 0 amount)
    const validData = data.filter(d => d.amount > 0);

    const handle = await this.temporalClient.workflow.start('importSalesWorkflow', {
      taskQueue: 'bi-etl-queue',
      args: [tenantId, validData],
      workflowId: `sales-etl-excel-${tenantId}-${Date.now()}`,
    });

    return {
      message: 'Excel parsed and ETL Workflow started',
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
      recordCount: validData.length,
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
