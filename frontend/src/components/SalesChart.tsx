'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/providers/LanguageProvider';

interface SalesData {
  date: string;
  amount: number;
}

interface SalesChartProps {
  data: SalesData[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  
  // Transform data for ECharts
  // Assuming data is sorted or we might want to sort it by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const dates = sortedData.map(item => new Date(item.date).toLocaleDateString());
  const amounts = sortedData.map(item => item.amount);

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: t.chartTitle,
      left: 'center',
      textStyle: {
        color: resolvedTheme === 'dark' ? '#fff' : '#333'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates,
      name: t.chartDate,
      axisLabel: {
        color: resolvedTheme === 'dark' ? '#ccc' : '#333'
      },
      nameTextStyle: {
        color: resolvedTheme === 'dark' ? '#ccc' : '#333'
      }
    },
    yAxis: {
      type: 'value',
      name: t.chartAmount,
      axisLabel: {
        color: resolvedTheme === 'dark' ? '#ccc' : '#333'
      },
      nameTextStyle: {
        color: resolvedTheme === 'dark' ? '#ccc' : '#333'
      },
      splitLine: {
        lineStyle: {
          color: resolvedTheme === 'dark' ? '#444' : '#eee'
        }
      }
    },
    series: [
      {
        data: amounts,
        type: 'line',
        smooth: true,
        areaStyle: {},
        itemStyle: {
          color: '#3b82f6' // Blue-500
        }
      }
    ]
  };

  return (
    <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
      <ReactECharts 
        option={option} 
        style={{ height: '400px', width: '100%' }} 
        theme={resolvedTheme === 'dark' ? 'dark' : undefined}
      />
    </div>
  );
};

export default SalesChart;
