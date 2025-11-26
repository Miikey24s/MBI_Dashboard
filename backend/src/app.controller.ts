import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { Client } from '@temporalio/client';
import { TEMPORAL_CLIENT } from './temporal/temporal.provider';
import { pingWorkflow } from './workflows/ping.workflow';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(TEMPORAL_CLIENT) private readonly temporalClient: Client
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping-temporal')
  async pingTemporal(): Promise<string> {
    const handle = await this.temporalClient.workflow.start(pingWorkflow, {
      taskQueue: 'bi-etl-queue',
      workflowId: 'ping-' + Date.now(),
      args: ['NestJS'],
    });
    return await handle.result();
  }
}
