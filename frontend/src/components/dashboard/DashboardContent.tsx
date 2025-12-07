'use client';

import { DollarSign, TrendingUp, FileSpreadsheet, Database } from 'lucide-react';
import {
  MetricCard,
  SalesLineChart,
  SalesBarChart,
  SalesPieChart,
  RecentSalesTable,
  EtlJobsTable,
} from '@/components/charts';
import { EmptyState } from './EmptyState';
import type {
  OverviewData,
  SalesByDate,
  SalesBySource,
  SalesByMonth,
  SalesRecord,
  EtlJob,
} from '@/lib/api';

interface DashboardContentProps {
  overview: OverviewData;
  salesByDate: SalesByDate[];
  salesBySource: SalesBySource[];
  salesByMonth: SalesByMonth[];
  recentSales: SalesRecord[];
  etlJobs: EtlJob[];
}

export function DashboardContent({
  overview,
  salesByDate,
  salesBySource,
  salesByMonth,
  recentSales,
  etlJobs,
}: DashboardContentProps) {
  const hasData = overview.recordCount > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Metric Cards - show zeros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Tổng doanh thu"
            value={0}
            format="currency"
            icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          />
          <MetricCard
            title="Doanh thu tháng này"
            value={0}
            format="currency"
            icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          />
          <MetricCard
            title="Số giao dịch"
            value={0}
            format="number"
            icon={<FileSpreadsheet className="h-6 w-6 text-purple-600" />}
          />
          <MetricCard
            title="ETL Jobs"
            value={overview.etlJobCount}
            format="number"
            icon={<Database className="h-6 w-6 text-orange-600" />}
          />
        </div>

        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tổng doanh thu"
          value={overview.totalRevenue}
          format="currency"
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
        />
        <MetricCard
          title="Doanh thu tháng này"
          value={overview.monthlyRevenue}
          previousValue={overview.lastMonthRevenue}
          format="currency"
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
        />
        <MetricCard
          title="Số giao dịch"
          value={overview.recordCount}
          format="number"
          icon={<FileSpreadsheet className="h-6 w-6 text-purple-600" />}
        />
        <MetricCard
          title="ETL Jobs"
          value={overview.etlJobCount}
          format="number"
          icon={<Database className="h-6 w-6 text-orange-600" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesLineChart data={salesByDate} />
        <SalesBarChart data={salesByMonth} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SalesPieChart data={salesBySource} />
        </div>
        <div className="lg:col-span-2">
          <RecentSalesTable data={recentSales} />
        </div>
      </div>

      {/* ETL Jobs */}
      <EtlJobsTable data={etlJobs} />
    </div>
  );
}
