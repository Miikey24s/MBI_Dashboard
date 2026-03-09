'use client';

import { Statistic, Table } from 'antd';
import dynamic from 'next/dynamic';
import { SAMPLE_DATA, TemplateWidget } from './templates';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// Render widget preview với dữ liệu mẫu
export function renderPreviewWidget(widget: TemplateWidget, index: number, height: number) {
  const { chartType, ten } = widget;
  const chartHeight = height - 32;

  if (chartType === 'card') {
    const values = [SAMPLE_DATA.total, SAMPLE_DATA.count, SAMPLE_DATA.average];
    const fontSize = chartHeight > 100 ? 24 : 18;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Statistic 
          title={ten} 
          value={values[index % 3]} 
          formatter={(v) => Number(v).toLocaleString('vi-VN')}
          styles={{ content: { fontSize, color: '#1890ff' } }}
        />
      </div>
    );
  }

  if (chartType === 'bar') {
    return (
      <ReactECharts style={{ height: '100%', width: '100%' }} option={{
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: SAMPLE_DATA.categories, axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
        series: [{ type: 'bar', data: SAMPLE_DATA.values1, itemStyle: { color: '#1890ff' } }],
        grid: { left: 35, right: 10, top: 10, bottom: 25 },
      }} />
    );
  }

  if (chartType === 'line') {
    return (
      <ReactECharts style={{ height: '100%', width: '100%' }} option={{
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: SAMPLE_DATA.categories, axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
        series: [{ type: 'line', data: SAMPLE_DATA.values2, smooth: true, itemStyle: { color: '#52c41a' } }],
        grid: { left: 35, right: 10, top: 10, bottom: 25 },
      }} />
    );
  }

  if (chartType === 'area') {
    return (
      <ReactECharts style={{ height: '100%', width: '100%' }} option={{
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: SAMPLE_DATA.categories, axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
        series: [{ type: 'line', data: SAMPLE_DATA.values2, smooth: true, areaStyle: { opacity: 0.3 }, itemStyle: { color: '#52c41a' } }],
        grid: { left: 35, right: 10, top: 10, bottom: 25 },
      }} />
    );
  }

  if (chartType === 'pie') {
    return (
      <ReactECharts style={{ height: '100%', width: '100%' }} option={{
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { type: 'scroll', orient: 'vertical', right: 5, top: 'middle', textStyle: { fontSize: 9 }, itemWidth: 10, itemHeight: 10 },
        series: [{ type: 'pie', radius: ['25%', '55%'], center: ['35%', '50%'], data: SAMPLE_DATA.pieData, label: { show: false } }],
      }} />
    );
  }

  if (chartType === 'donut') {
    const total = SAMPLE_DATA.pieData.reduce((sum, d) => sum + d.value, 0);
    return (
      <ReactECharts style={{ height: '100%', width: '100%' }} option={{
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { type: 'scroll', orient: 'vertical', right: 5, top: 'middle', textStyle: { fontSize: 9 }, itemWidth: 10, itemHeight: 10 },
        graphic: [
          { type: 'text', left: '28%', top: '45%', style: { text: total.toLocaleString(), fontSize: 12, fontWeight: 'bold', fill: '#333', textAlign: 'center' } },
          { type: 'text', left: '28%', top: '55%', style: { text: 'Tổng', fontSize: 9, fill: '#999', textAlign: 'center' } },
        ],
        series: [{ type: 'pie', radius: ['40%', '60%'], center: ['32%', '50%'], data: SAMPLE_DATA.pieData, label: { show: false }, itemStyle: { borderRadius: 3, borderColor: '#fff', borderWidth: 2 } }],
      }} />
    );
  }

  if (chartType === 'gauge') {
    return (
      <ReactECharts style={{ height: '100%', width: '100%' }} option={{
        series: [{
          type: 'gauge', center: ['50%', '60%'], radius: '85%', startAngle: 200, endAngle: -20, min: 0, max: 100,
          progress: { show: true, width: 8 }, axisLine: { lineStyle: { width: 8 } }, axisTick: { show: false },
          splitLine: { length: 6, lineStyle: { width: 1.5, color: '#999' } }, axisLabel: { distance: 12, fontSize: 9 },
          pointer: { width: 4, itemStyle: { color: '#1890ff' } },
          detail: { valueAnimation: true, fontSize: 14, offsetCenter: [0, '75%'], formatter: '{value}%' },
          data: [{ value: SAMPLE_DATA.gaugeValue, name: '' }],
        }],
      }} />
    );
  }

  if (chartType === 'scatter') {
    return (
      <ReactECharts style={{ height: '100%', width: '100%' }} option={{
        tooltip: { trigger: 'item', formatter: 'X: {c0}<br/>Y: {c1}' },
        xAxis: { type: 'value', axisLabel: { fontSize: 9 } },
        yAxis: { type: 'value', axisLabel: { fontSize: 9 } },
        series: [{ type: 'scatter', data: SAMPLE_DATA.scatterData, symbolSize: 8, itemStyle: { color: '#1890ff' } }],
        grid: { left: 35, right: 10, top: 10, bottom: 25 },
      }} />
    );
  }

  if (chartType === 'funnel') {
    return (
      <ReactECharts style={{ height: '100%', width: '100%' }} option={{
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        series: [{
          type: 'funnel', left: '5%', right: '5%', top: 5, bottom: 5, minSize: '20%', maxSize: '100%',
          sort: 'descending', gap: 2, label: { show: true, position: 'inside', fontSize: 9, color: '#fff' },
          data: SAMPLE_DATA.funnelData,
        }],
      }} />
    );
  }

  if (chartType === 'table') {
    return (
      <Table size="small" dataSource={SAMPLE_DATA.tableData} rowKey="id" pagination={false} scroll={{ y: chartHeight - 40 }}
        columns={[
          { title: 'Tên', dataIndex: 'ten', width: 100, ellipsis: true },
          { title: 'SL', dataIndex: 'soLuong', width: 60, render: (v: number) => v.toLocaleString() },
          { title: 'Doanh thu', dataIndex: 'doanhThu', width: 100, render: (v: number) => (v/1e6).toFixed(1) + 'M' },
        ]}
      />
    );
  }

  return null;
}
