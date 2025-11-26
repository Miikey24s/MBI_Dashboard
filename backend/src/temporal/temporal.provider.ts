import { Provider } from '@nestjs/common';
import { Connection, Client } from '@temporalio/client';
import { ConfigService } from '@nestjs/config';

export const TEMPORAL_CLIENT = 'TEMPORAL_CLIENT';

export const TemporalClientProvider: Provider = {
  provide: TEMPORAL_CLIENT,
  useFactory: async (configService: ConfigService) => {
    const address = configService.get<string>('TEMPORAL_ADDRESS') || 'localhost:7233';
    const connection = await Connection.connect({ address });
    return new Client({ connection });
  },
  inject: [ConfigService],
};
