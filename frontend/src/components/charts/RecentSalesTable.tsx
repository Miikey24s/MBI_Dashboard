'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatVND, formatDate } from '@/lib/utils';
import type { SalesRecord } from '@/lib/api';

interface RecentSalesTableProps {
  data: SalesRecord[];
  title?: string;
}

export function RecentSalesTable({ data, title = 'Giao dịch gần đây' }: RecentSalesTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Chưa có dữ liệu
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
                  Ngày
                </th>
                <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nguồn
                </th>
                <th className="py-3 px-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Số tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(record.date)}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="secondary">{record.source}</Badge>
                  </td>
                  <td className="py-3 px-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    {formatVND(record.amount)}
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
