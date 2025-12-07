import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { Worker, NativeConnection } from '@temporalio/worker';
import { ConfigService } from '@nestjs/config';
import * as pingActivities from '../activities/ping.activity';
import { SalesEtlActivities } from '../activities/sales-etl.activities';
import * as path from 'path';

@Injectable()
export class WorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private worker: Worker | null = null;
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly salesEtlActivities: SalesEtlActivities,
  ) {}

  async onApplicationBootstrap() {
    const address =
      this.configService.get<string>('TEMPORAL_ADDRESS') || 'localhost:7233';

    try {
      const connection = await NativeConnection.connect({
        address,
      });

      // Use absolute path to workflows
      const workflowsPath = path.join(__dirname, '../workflows/index');

      this.worker = await Worker.create({
        connection,
        namespace: 'default',
        taskQueue: 'bi-etl-queue',
        workflowsPath,
        activities: {
          ...pingActivities,
          validateData:
            this.salesEtlActivities.validateData.bind(this.salesEtlActivities),
          transformData:
            this.salesEtlActivities.transformData.bind(this.salesEtlActivities),
          loadDataToDB:
            this.salesEtlActivities.loadDataToDB.bind(this.salesEtlActivities),
          updateJobStatus:
            this.salesEtlActivities.updateJobStatus.bind(this.salesEtlActivities),
          getDailySales:
            this.salesEtlActivities.getDailySales.bind(this.salesEtlActivities),
          sendTelegramAlert:
            this.salesEtlActivities.sendTelegramAlert.bind(this.salesEtlActivities),
        },
      });

      this.worker.run();
      this.logger.log('✅ Temporal Worker started on queue: bi-etl-queue');
    } catch (error) {
      this.logger.warn(
        `⚠️ Could not connect to Temporal server at ${address}. ETL workflows will not be available.`,
      );
      this.logger.warn(
        'To enable Temporal, make sure Temporal server is running (docker-compose up -d)',
      );
    }
  }

  async onApplicationShutdown() {
    if (this.worker) {
      this.worker.shutdown();
    }
  }
}
