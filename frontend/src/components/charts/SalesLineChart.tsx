'use client';

import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatVND } from '@/lib/utils';
import type { SalesByDate } from '@/lib/api';

interface SalesLineChartProps {
  data: SalesByDate[];
  title?: string;
}

export function SalesLineChart({ data, title = 'Doanh thu theo ngày' }: SalesLineChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const dates = data.map(item => {
    const d = new Date(item.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  const totals = data.map(item => item.total);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const date = params[0].axisValue;
        const value = params[0].data;
        return `${date}<br/>Doanh thu: ${formatVND(value)}`;
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
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } },
      axisLabel: { color: isDark ? '#9ca3af' : '#6b7280' },
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
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
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
