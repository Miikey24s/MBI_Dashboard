import { proxyActivities } from '@temporalio/workflow';
import type { SalesEtlActivities } from '../activities/sales-etl.activities';

const { getDailySales, sendTelegramAlert } = proxyActivities<SalesEtlActivities>({
  startToCloseTimeout: '1 minute',
});

export async function checkLowSalesWorkflow(tenantId: string): Promise<string> {
  const totalSales = await getDailySales(tenantId);
  
  if (totalSales < 1000000) {
    const message = `⚠️ Alert: Low sales detected for ${tenantId}. Total: ${totalSales}`;
    await sendTelegramAlert(message);
    return `Alert sent: ${message}`;
  }
  
  return `Sales OK: ${totalSales}`;
}
