import { proxyActivities } from '@temporalio/workflow';
import type { SalesEtlActivities } from '../activities/sales-etl.activities';

const { validateData, transformData, loadDataToDB } = proxyActivities<SalesEtlActivities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
  },
});

export async function importSalesWorkflow(tenantId: string, data: any[]): Promise<string> {
  // 1. Validate
  const validData = await validateData(data);

  // 2. Transform
  const records = await transformData(validData);

  // 3. Load
  await loadDataToDB(records);

  return 'ETL Process Completed Successfully';
}
