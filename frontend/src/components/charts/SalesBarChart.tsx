'use client';

import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatVND, MONTH_NAMES } from '@/lib/utils';
import type { SalesByMonth } from '@/lib/api';

interface SalesBarChartProps {
  data: SalesByMonth[];
  title?: string;
}

export function SalesBarChart({ data, title = 'Doanh thu theo tháng' }: SalesBarChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const months = data.map(item => MONTH_NAMES[item.month - 1]);
  const totals = data.map(item => item.total);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const month = params[0].axisValue;
        const value = params[0].data;
        return `${month}<br/>Doanh thu: ${formatVND(value)}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } },
      axisLabel: { 
        color: isDark ? '#9ca3af' : '#6b7280',
        rotate: 45,
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        color: isDark ? '#9ca3af' : '#6b7280',
        formatter: (value: number) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
          return value;
        },
      },
      splitLine: { lineStyle: { color: isDark ? '#374151' : '#f3f4f6' } },
    },
    series: [
      {
        data: totals,
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '300px' }} />
      </CardContent>
    </Card>
  );
}
