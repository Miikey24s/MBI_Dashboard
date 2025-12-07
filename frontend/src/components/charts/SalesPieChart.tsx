'use client';

import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatVND } from '@/lib/utils';
import type { SalesBySource } from '@/lib/api';

interface SalesPieChartProps {
  data: SalesBySource[];
  title?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function SalesPieChart({ data, title = 'Doanh thu theo nguồn' }: SalesPieChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const chartData = data.map((item, index) => ({
    name: item.source,
    value: item.total,
    itemStyle: { color: COLORS[index % COLORS.length] },
  }));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>Doanh thu: ${formatVND(params.value)}<br/>Tỷ lệ: ${params.percent}%`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: isDark ? '#9ca3af' : '#6b7280' },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark ? '#1f2937' : '#ffffff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: isDark ? '#fff' : '#333',
          },
        },
        labelLine: { show: false },
        data: chartData,
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
