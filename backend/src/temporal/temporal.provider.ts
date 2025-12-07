import { Provider, Logger } from '@nestjs/common';
import { Connection, Client } from '@temporalio/client';
import { ConfigService } from '@nestjs/config';

export const TEMPORAL_CLIENT = 'TEMPORAL_CLIENT';

const logger = new Logger('TemporalProvider');

// Mock client khi không kết nối được Temporal
class MockTemporalClient {
  workflow = {
    start: async () => {
      logger.warn('Temporal not connected. Workflow not started.');
      return { workflowId: 'mock', firstExecutionRunId: 'mock' };
    },
  };
  schedule = {
    create: async () => {
      logger.warn('Temporal not connected. Schedule not created.');
      return {};
    },
    getHandle: () => ({
      delete: async () => {
        logger.warn('Temporal not connected. Schedule not deleted.');
      },
    }),
  };
}

export const TemporalClientProvider: Provider = {
  provide: TEMPORAL_CLIENT,
  useFactory: async (configService: ConfigService) => {
    const address =
      configService.get<string>('TEMPORAL_ADDRESS') || 'localhost:7233';

    try {
      const connection = await Connection.connect({ address });
      logger.log(`✅ Connected to Temporal server at ${address}`);
      return new Client({ connection });
    } catch (error) {
      logger.warn(
        `⚠️ Could not connect to Temporal server at ${address}. Using mock client.`,
      );
      return new MockTemporalClient() as unknown as Client;
    }
  },
  inject: [ConfigService],
};
