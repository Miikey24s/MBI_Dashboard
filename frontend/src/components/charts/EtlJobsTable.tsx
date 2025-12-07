'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import type { EtlJob } from '@/lib/api';

interface EtlJobsTableProps {
  data: EtlJob[];
  title?: string;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  PENDING: 'warning',
  PROCESSING: 'default',
  SUCCESS: 'success',
  FAILED: 'error',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
};

export function EtlJobsTable({ data, title = 'ETL Jobs gần đây' }: EtlJobsTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Chưa có ETL job nào
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  File
                </th>
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                    {job.fileName}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={statusVariant[job.status]}>
                      {statusLabel[job.status]}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                    {formatDateTime(job.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
