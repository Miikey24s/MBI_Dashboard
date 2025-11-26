import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Worker, NativeConnection } from '@temporalio/worker';
import { ConfigService } from '@nestjs/config';
import * as pingActivities from '../activities/ping.activity';
import { SalesEtlActivities } from '../activities/sales-etl.activities';

@Injectable()
export class WorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private worker: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly salesEtlActivities: SalesEtlActivities,
  ) {}

  async onApplicationBootstrap() {
    const address = this.configService.get<string>('TEMPORAL_ADDRESS') || 'localhost:7233';
    
    const connection = await NativeConnection.connect({
      address,
    });

    this.worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: 'bi-etl-queue',
      workflowsPath: require.resolve('../workflows/index'),
      activities: {
        ...pingActivities,
        validateData: this.salesEtlActivities.validateData.bind(this.salesEtlActivities),
        transformData: this.salesEtlActivities.transformData.bind(this.salesEtlActivities),
        loadDataToDB: this.salesEtlActivities.loadDataToDB.bind(this.salesEtlActivities),
      },
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
