import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/ping.activity';

const { pingActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function pingWorkflow(name: string): Promise<string> {
  return await pingActivity(name);
}
