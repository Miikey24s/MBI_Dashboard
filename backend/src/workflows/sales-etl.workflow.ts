import { proxyActivities } from '@temporalio/workflow';
import type { SalesEtlActivities } from '../activities/sales-etl.activities';

const { fetchExternalData, transformData, loadDataToDB } = proxyActivities<SalesEtlActivities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
  },
});

export async function importSalesWorkflow(tenantId: string): Promise<string> {
  // 1. Fetch
  const rawData = await fetchExternalData(tenantId);

  // 2. Transform
  const records = await transformData(rawData);

  // 3. Load
  await loadDataToDB(records);

  return 'ETL Process Completed Successfully';
}
