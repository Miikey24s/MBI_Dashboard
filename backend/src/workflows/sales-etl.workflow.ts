import { proxyActivities } from '@temporalio/workflow';
import type { SalesEtlActivities } from '../activities/sales-etl.activities';
import { EtlStatus } from '../common/enums';

const { validateData, transformData, loadDataToDB, updateJobStatus } = proxyActivities<SalesEtlActivities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
  },
});

export async function importSalesWorkflow(tenantId: string, data: any[], jobId: string): Promise<string> {
  try {
    // 1. Validate
    const validData = await validateData(data);

    // 2. Transform
    const records = await transformData(validData);

    // 3. Load
    await loadDataToDB(records, jobId);

    // 4. Update Job Status
    await updateJobStatus(jobId, EtlStatus.SUCCESS);

    return 'ETL Process Completed Successfully';
  } catch (error) {
    await updateJobStatus(jobId, EtlStatus.FAILED);
    throw error;
  }
}
