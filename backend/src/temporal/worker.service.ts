import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Worker, NativeConnection } from '@temporalio/worker';
import { ConfigService } from '@nestjs/config';
import * as activities from '../activities/ping.activity';

@Injectable()
export class WorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private worker: Worker;

  constructor(private readonly configService: ConfigService) {}

  async onApplicationBootstrap() {
    const address = this.configService.get<string>('TEMPORAL_ADDRESS') || 'localhost:7233';
    
    const connection = await NativeConnection.connect({
      address,
    });

    this.worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: 'bi-etl-queue',
      // Point to the compiled JS file in dist/workflows/ping.workflow.js
      // In development with ts-node, this might need adjustment, but for standard NestJS build:
      workflowsPath: require.resolve('../workflows/ping.workflow'),
      activities,
    });

    this.worker.run();
    console.log('Temporal Worker started on queue: bi-etl-queue');
  }

  async onApplicationShutdown() {
    if (this.worker) {
      this.worker.shutdown();
    }
  }
}
