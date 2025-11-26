import { Controller, Post, Body, Inject, Get, Query } from '@nestjs/common';
import { Client } from '@temporalio/client';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  @Post('trigger-etl')
  async triggerEtl(@Body('tenantId') tenantId: string) {
    if (!tenantId) {
      return { error: 'tenantId is required' };
    }

    const handle = await this.temporalClient.workflow.start('importSalesWorkflow', {
      taskQueue: 'bi-etl-queue',
      args: [tenantId],
      workflowId: `sales-etl-${tenantId}-${Date.now()}`,
    });

    return {
      message: 'Sales ETL Workflow started',
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
    };
  }
}
