import { Controller, Post, Body, Inject } from '@nestjs/common';
import { Client } from '@temporalio/client';
import { TEMPORAL_CLIENT } from '../temporal/temporal.provider';

@Controller('sales')
export class SalesController {
  constructor(
    @Inject(TEMPORAL_CLIENT) private readonly temporalClient: Client,
  ) {}

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
