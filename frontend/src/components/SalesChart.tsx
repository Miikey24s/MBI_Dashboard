'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface SalesData {
  date: string;
  amount: number;
}

interface SalesChartProps {
  data: SalesData[];
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  // Transform data for ECharts
  // Assuming data is sorted or we might want to sort it by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const dates = sortedData.map(item => new Date(item.date).toLocaleDateString());
  const amounts = sortedData.map(item => item.amount);

  const option = {
    title: {
      text: 'Sales Over Time',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates,
      name: 'Date'
    },
    yAxis: {
      type: 'value',
      name: 'Amount ($)'
    },
    series: [
      {
        data: amounts,
        type: 'line',
        smooth: true,
        areaStyle: {}
      }
    ]
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <ReactECharts option={option} style={{ height: '400px', width: '100%' }} />
    </div>
  );
};

export default SalesChart;
