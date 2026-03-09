'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Spin, Empty, Button, Select, Table, Statistic, Modal, Input, Popconfirm, message, Dropdown } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, TableOutlined, NumberOutlined, DeleteOutlined, EditOutlined, AreaChartOutlined, DotChartOutlined, FunnelPlotOutlined, DashboardOutlined, DownloadOutlined, FilePdfOutlined, FileImageOutlined, EyeOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { REPORT_TEMPLATES } from '../templates';
import { renderPreviewWidget } from '../PreviewWidget';

const resizeHandleStyles = `
  .react-grid-item > .react-resizable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    z-index: 10;
  }
  .react-grid-item > .react-resizable-handle::after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    border-right: 3px solid rgba(0, 0, 0, 0.4);
    border-bottom: 3px solid rgba(0, 0, 0, 0.4);
  }
  .react-grid-item > .react-resizable-handle-se {
    bottom: 0;
    right: 0;
    cursor: se-resize;
  }
  .react-grid-item > .react-resizable-handle-se::after {
    right: 3px;
    bottom: 3px;
  }
  .react-grid-item > .react-resizable-handle-sw {
    bottom: 0;
    left: 0;
    cursor: sw-resize;
  }
  .react-grid-item > .react-resizable-handle-sw::after {
    left: 3px;
    bottom: 3px;
    transform: rotate(90deg);
  }
`;

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ColumnDef { name: string; displayName: string; type: string; }
interface Dataset { id: number; ten: string; columns: ColumnDef[]; }
interface LayoutItem { i: string; x: number; y: number; w: number; h: number; }
interface ChartConfig {
  id: number;
  ten: string;
  chartType: string;
  datasetId: number | null;
  xColumn: string;
  yColumn: string;
  columns: string[]; // For table type
  layout: LayoutItem;
}
interface UserProfile { id: number; toChucId: number; }

const CHART_TYPES = [
  { value: 'bar', label: 'Biểu đồ cột', icon: <BarChartOutlined /> },
  { value: 'line', label: 'Biểu đồ đường', icon: <LineChartOutlined /> },
  { value: 'area', label: 'Biểu đồ vùng', icon: <AreaChartOutlined /> },
  { value: 'pie', label: 'Biểu đồ tròn', icon: <PieChartOutlined /> },
  { value: 'donut', label: 'Biểu đồ donut', icon: <PieChartOutlined /> },
  { value: 'gauge', label: 'Đồng hồ đo', icon: <DashboardOutlined /> },
  { value: 'scatter', label: 'Biểu đồ phân tán', icon: <DotChartOutlined /> },
  { value: 'funnel', label: 'Biểu đồ phễu', icon: <FunnelPlotOutlined /> },
  { value: 'table', label: 'Bảng dữ liệu', icon: <TableOutlined /> },
  { value: 'card', label: 'Hiển thị số', icon: <NumberOutlined /> },
];

export default function ReportViewPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [report, setReport] = useState<{ id: number; ten: string; moTa: string; templateId?: string } | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [chartsData, setChartsData] = useState<Record<number, any>>({});
  const [containerWidth, setContainerWidth] = useState(1200);
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [chartName, setChartName] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]); // For table type
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { if (currentUser) { fetchReport(); fetchDatasets(); } }, [currentUser, reportId]);
  useEffect(() => { if (selectedDataset) handlePreview(); }, [selectedDataset]);
  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('grid-container');
      if (container) setContainerWidth(container.offsetWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { router.push('/login'); return; }
      const res = await fetch('http://localhost:3001/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCurrentUser((await res.json()).data || await res.json());
      else router.push('/login');
    } catch { setLoading(false); }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/report/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        if (data.widgets?.length) {
          const loadedCharts = data.widgets.map((w: any) => ({
            id: w.id, ten: w.ten, chartType: w.chartType, datasetId: w.datasetId,
            xColumn: w.config?.xColumn || '', yColumn: w.config?.yColumn || '',
            columns: w.config?.columns || [],
            layout: { i: String(w.id), x: w.position?.x || 0, y: w.position?.y || 0, w: w.position?.w || 4, h: w.position?.h || 3 },
          }));
          setCharts(loadedCharts);
          loadedCharts.forEach((c: ChartConfig) => fetchChartData(c));
        } else { setCharts([]); setChartsData({}); }
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchDatasets = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`http://localhost:3001/api/dataset?toChucId=${currentUser.toChucId}`);
      if (res.ok) setDatasets(await res.json());
    } catch {}
  };

  const fetchChartData = async (chart: ChartConfig) => {
    if (!chart.datasetId) return; // Widget chưa config
    try {
      const res = await fetch(`http://localhost:3001/api/dataset/${chart.datasetId}/data?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setChartsData(prev => ({ ...prev, [chart.id]: data }));
      }
    } catch {}
  };

  const handlePreview = async () => {
    if (!selectedDataset) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/dataset/${selectedDataset}/data?limit=100`);
      if (res.ok) setPreviewData(await res.json());
    } catch {} finally { setPreviewLoading(false); }
  };

  const handleSaveChart = async () => {
    const needsXY = ['bar', 'line', 'area', 'pie', 'donut', 'funnel'].includes(chartType);
    const needsScatterXY = chartType === 'scatter';
    if (!selectedDataset || !chartName) return;
    if (needsXY && (!xColumn || !yColumn)) return;
    if (needsScatterXY && (!xColumn || !yColumn)) return;
    if (chartType === 'card' && !yColumn) return;
    if (chartType === 'gauge' && !yColumn) return;
    if (chartType === 'table' && selectedColumns.length === 0) return;
    
    const config = { xColumn, yColumn, columns: selectedColumns };
    const position = editingChart?.layout 
      ? { x: editingChart.layout.x, y: editingChart.layout.y, w: editingChart.layout.w, h: editingChart.layout.h }
      : { x: 0, y: Infinity, w: 4, h: 3 }; // New chart goes to bottom

    try {
      if (editingChart) {
        await fetch(`http://localhost:3001/api/report/widget/${editingChart.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ten: chartName, chartType, config, datasetId: selectedDataset, position }),
        });
        message.success('Đã cập nhật');
      } else {
        await fetch(`http://localhost:3001/api/report/${reportId}/widget`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ten: chartName, chartType, config, datasetId: selectedDataset, position }),
        });
        message.success('Đã thêm biểu đồ');
      }
      setModalOpen(false);
      resetForm();
      fetchReport();
    } catch { message.error('Lỗi'); }
  };

  const handleDeleteChart = async (id: number) => {
    try {
      await fetch(`http://localhost:3001/api/report/widget/${id}`, { method: 'DELETE' });
      message.success('Đã xóa');
      fetchReport();
    } catch { message.error('Lỗi'); }
  };

  const handleLayoutChange = useCallback((newLayout: any) => {
    // Save positions to backend
    if (!Array.isArray(newLayout)) return;
    newLayout.forEach((item: any) => {
      const chartId = parseInt(item.i);
      if (!isNaN(chartId)) {
        fetch(`http://localhost:3001/api/report/widget/${chartId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: { x: item.x, y: item.y, w: item.w, h: item.h } }),
        }).catch(() => {});
      }
    });
  }, []);

  const openAddModal = () => { resetForm(); setModalOpen(true); };
  const openEditModal = (chart: ChartConfig) => {
    setEditingChart(chart); setChartName(chart.ten); setChartType(chart.chartType);
    setSelectedDataset(chart.datasetId); setXColumn(chart.xColumn); setYColumn(chart.yColumn);
    setSelectedColumns(chart.columns || []);
    setPreviewData(chartsData[chart.id] || null); setModalOpen(true);
  };
  const resetForm = () => {
    setEditingChart(null); setChartName(''); setChartType('bar');
    setSelectedDataset(datasets[0]?.id || null); setXColumn(''); setYColumn(''); 
    setSelectedColumns([]); setPreviewData(null);
  };

  const currentDataset = datasets.find(d => d.id === selectedDataset);
  const allColumns = currentDataset?.columns || [];

  // Export functions
  const exportToPNG = async () => {
    if (!gridRef.current || !report) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(gridRef.current, {
        backgroundColor: '#f0f2f5',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${report.ten.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      message.success('Đã xuất PNG');
    } catch (err) {
      message.error('Lỗi xuất PNG');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!gridRef.current || !report) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(gridRef.current, {
        backgroundColor: '#f0f2f5',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // A4 dimensions in mm
      const pdfWidth = 297; // A4 landscape width
      const pdfHeight = 210; // A4 landscape height
      
      // Calculate scaling to fit
      const ratio = Math.min(pdfWidth / (imgWidth / 2), (pdfHeight - 20) / (imgHeight / 2));
      const scaledWidth = (imgWidth / 2) * ratio;
      const scaledHeight = (imgHeight / 2) * ratio;
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      // Add title
      pdf.setFontSize(16);
      pdf.text(report.ten, 10, 12);
      pdf.setFontSize(10);
      pdf.setTextColor(128);
      pdf.text(`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`, 10, 18);
      
      // Add image centered
      const xOffset = (pdfWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, 22, scaledWidth, scaledHeight);
      
      pdf.save(`${report.ten.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.pdf`);
      message.success('Đã xuất PDF');
    } catch (err) {
      message.error('Lỗi xuất PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportMenuItems = [
    { key: 'pdf', label: 'Xuất PDF', icon: <FilePdfOutlined />, onClick: exportToPDF },
    { key: 'png', label: 'Xuất PNG', icon: <FileImageOutlined />, onClick: exportToPNG },
  ];

  const renderChartContent = (chart: ChartConfig, data: any, height = 250, width = 400) => {
    // Widget chưa config dataset
    if (!chart.datasetId) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa chọn nguồn dữ liệu" />;
    }
    if (!data?.data?.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu" />;
    const rows = data.data;
    const ds = datasets.find(d => d.id === chart.datasetId);
    const getColName = (col: string) => ds?.columns.find(c => c.name === col)?.displayName || col;

    // Card: cần yColumn
    if (chart.chartType === 'card') {
      if (!chart.yColumn) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn cột tính tổng" />;
      }
      const total = rows.reduce((sum: number, r: any) => sum + (Number(r[chart.yColumn]) || 0), 0);
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Statistic title={getColName(chart.yColumn)} value={total}
            formatter={(v) => Number(v).toLocaleString('vi-VN')}
            styles={{ content: { fontSize: 36, color: '#1890ff' } }} />
        </div>
      );
    }

    // Table: cần chọn columns
    if (chart.chartType === 'table') {
      const allCols = ds?.columns || [];
      if (allCols.length === 0) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có cột dữ liệu" />;
      }
      // Chỉ hiện các cột được chọn, hoặc tất cả nếu chưa chọn
      const displayCols = chart.columns?.length > 0 
        ? allCols.filter(c => chart.columns.includes(c.name))
        : allCols;
      if (displayCols.length === 0) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn cột hiển thị" />;
      }
      return (
        <Table size="small" dataSource={rows} rowKey={(record) => JSON.stringify(record).slice(0, 50)}
          pagination={{ pageSize: 5, size: 'small' }} scroll={{ x: 'max-content', y: height - 60 }}
          columns={displayCols.map(c => ({
            title: c.displayName, dataIndex: c.name, width: 100, ellipsis: true,
            render: (v: any) => {
              if (v == null) return '-';
              if (typeof v === 'number') return v.toLocaleString('vi-VN');
              if (typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}/)) return new Date(v).toLocaleDateString('vi-VN');
              return String(v);
            },
          }))} />
      );
    }

    // Gauge: chỉ cần yColumn
    if (chart.chartType === 'gauge') {
      if (!chart.yColumn) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn giá trị đo" />;
      }
      const total = rows.reduce((sum: number, r: any) => sum + (Number(r[chart.yColumn]) || 0), 0);
      const avg = total / rows.length;
      const maxVal = Math.max(...rows.map((r: any) => Number(r[chart.yColumn]) || 0));
      return (
        <ReactECharts style={{ height: '100%', width: '100%' }} option={{
          tooltip: { formatter: '{b}: {c}' },
          series: [{
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: maxVal * 1.2 || 100,
            progress: { show: true, width: 12 },
            axisLine: { lineStyle: { width: 12 } },
            axisTick: { show: false },
            splitLine: { length: 8, lineStyle: { width: 2, color: '#999' } },
            axisLabel: { distance: 20, fontSize: 10, formatter: (v: number) => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v.toFixed(0) },
            pointer: { itemStyle: { color: '#1890ff' } },
            detail: { valueAnimation: true, fontSize: 18, offsetCenter: [0, '70%'], formatter: (v: number) => v.toLocaleString('vi-VN') },
            data: [{ value: Math.round(avg), name: getColName(chart.yColumn) }],
          }],
        }} />
      );
    }

    // Scatter: cần cả xColumn và yColumn đều là số
    if (chart.chartType === 'scatter') {
      if (!chart.xColumn || !chart.yColumn) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn trục X và Y" />;
      }
      const scatterData = rows.map((r: any) => [Number(r[chart.xColumn]) || 0, Number(r[chart.yColumn]) || 0]).slice(0, 100);
      return (
        <ReactECharts style={{ height: '100%', width: '100%' }} option={{
          tooltip: { trigger: 'item', formatter: (p: any) => `${getColName(chart.xColumn)}: ${p.value[0].toLocaleString()}<br/>${getColName(chart.yColumn)}: ${p.value[1].toLocaleString()}` },
          xAxis: { type: 'value', name: getColName(chart.xColumn), nameLocation: 'middle', nameGap: 25, axisLabel: { fontSize: 9 } },
          yAxis: { type: 'value', name: getColName(chart.yColumn), nameLocation: 'middle', nameGap: 40, axisLabel: { fontSize: 9 } },
          series: [{ type: 'scatter', data: scatterData, symbolSize: 8, itemStyle: { color: '#1890ff' } }],
          grid: { left: 55, right: 15, top: 15, bottom: 40 },
        }} />
      );
    }

    // Bar, Line, Area, Pie, Donut, Funnel: cần xColumn và yColumn
    if (['bar', 'line', 'area', 'pie', 'donut', 'funnel'].includes(chart.chartType)) {
      if (!chart.xColumn || !chart.yColumn) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn trục X và Y" />;
      }
    }

    // Group by X, sum Y
    const formatValue = (val: any) => {
      if (val == null) return 'N/A';
      if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(val).toLocaleDateString('vi-VN');
      }
      return String(val);
    };
    
    const grouped = new Map<string, number>();
    rows.forEach((r: any) => {
      const key = formatValue(r[chart.xColumn]);
      grouped.set(key, (grouped.get(key) || 0) + (Number(r[chart.yColumn]) || 0));
    });
    const chartData = Array.from(grouped.entries()).slice(0, 15);

    if (chartData.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu để hiển thị" />;
    }

    // Pie chart
    if (chart.chartType === 'pie') {
      const legendMaxLen = width > 500 ? 20 : width > 350 ? 12 : 8;
      return (
        <ReactECharts style={{ height: '100%', width: '100%' }} option={{
          title: { text: `${getColName(chart.yColumn)} theo ${getColName(chart.xColumn)}`, left: 'center', top: 0, textStyle: { fontSize: 12, fontWeight: 'normal', color: '#666' } },
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          legend: { type: 'scroll', orient: 'vertical', right: 5, top: 25, bottom: 10, textStyle: { fontSize: 10 }, pageButtonItemGap: 5, pageIconSize: 10, formatter: (name: string) => name.length > legendMaxLen ? name.slice(0, legendMaxLen) + '...' : name },
          series: [{ type: 'pie', radius: ['20%', '50%'], center: ['30%', '55%'], data: chartData.map(([name, value]) => ({ name, value })), label: { show: false } }],
        }} />
      );
    }

    // Donut chart (pie với lỗ lớn hơn)
    if (chart.chartType === 'donut') {
      const legendMaxLen = width > 500 ? 20 : width > 350 ? 12 : 8;
      const total = chartData.reduce((sum, [, v]) => sum + v, 0);
      return (
        <ReactECharts style={{ height: '100%', width: '100%' }} option={{
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          legend: { type: 'scroll', orient: 'vertical', right: 5, top: 20, bottom: 10, textStyle: { fontSize: 10 }, formatter: (name: string) => name.length > legendMaxLen ? name.slice(0, legendMaxLen) + '...' : name },
          graphic: [{ type: 'text', left: 'center', top: '42%', style: { text: total.toLocaleString('vi-VN'), fontSize: 16, fontWeight: 'bold', fill: '#333' } }, { type: 'text', left: 'center', top: '52%', style: { text: 'Tổng', fontSize: 11, fill: '#999' } }],
          series: [{ type: 'pie', radius: ['45%', '65%'], center: ['35%', '50%'], data: chartData.map(([name, value]) => ({ name, value })), label: { show: false }, itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 } }],
        }} />
      );
    }

    // Funnel chart
    if (chart.chartType === 'funnel') {
      const sortedData = [...chartData].sort((a, b) => b[1] - a[1]);
      return (
        <ReactECharts style={{ height: '100%', width: '100%' }} option={{
          tooltip: { trigger: 'item', formatter: '{b}: {c}' },
          legend: { show: false },
          series: [{
            type: 'funnel',
            left: '10%',
            top: 10,
            bottom: 10,
            width: '80%',
            min: 0,
            max: sortedData[0]?.[1] || 100,
            minSize: '20%',
            maxSize: '100%',
            sort: 'descending',
            gap: 2,
            label: { show: true, position: 'inside', fontSize: 10, formatter: '{b}' },
            itemStyle: { borderColor: '#fff', borderWidth: 1 },
            data: sortedData.map(([name, value]) => ({ name, value })),
          }],
        }} />
      );
    }

    // Area chart (line với fill)
    if (chart.chartType === 'area') {
      return (
        <ReactECharts style={{ height: '100%', width: '100%' }} option={{
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: chartData.map(([n]) => n), axisLabel: { rotate: 30, fontSize: 9, interval: 0 }, name: getColName(chart.xColumn), nameLocation: 'middle', nameGap: 35, nameTextStyle: { fontSize: 11, color: '#666' } },
          yAxis: { type: 'value', axisLabel: { fontSize: 9, formatter: (v: number) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v }, name: getColName(chart.yColumn), nameLocation: 'middle', nameGap: 40, nameTextStyle: { fontSize: 11, color: '#666' } },
          series: [{ name: getColName(chart.yColumn), type: 'line', data: chartData.map(([, v]) => v), smooth: true, areaStyle: { opacity: 0.3 }, itemStyle: { color: '#52c41a' } }],
          grid: { left: 60, right: 15, top: 15, bottom: 55 },
        }} />
      );
    }

    // Bar, Line
    return (
      <ReactECharts style={{ height: '100%', width: '100%' }} option={{
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: chartData.map(([n]) => n), axisLabel: { rotate: 30, fontSize: 9, interval: 0 }, name: getColName(chart.xColumn), nameLocation: 'middle', nameGap: 35, nameTextStyle: { fontSize: 11, color: '#666' } },
        yAxis: { type: 'value', axisLabel: { fontSize: 9, formatter: (v: number) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v }, name: getColName(chart.yColumn), nameLocation: 'middle', nameGap: 40, nameTextStyle: { fontSize: 11, color: '#666' } },
        series: [{ name: getColName(chart.yColumn), type: chart.chartType, data: chartData.map(([, v]) => v), smooth: chart.chartType === 'line', itemStyle: { color: '#1890ff' } }],
        grid: { left: 60, right: 15, top: 15, bottom: 55 },
      }} />
    );
  };

  if (loading || !currentUser) {
    return <MainLayout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin /></div></MainLayout>;
  }

  if (!report) {
    return <MainLayout><Empty description="Không tìm thấy báo cáo" /></MainLayout>;
  }

  const layout = charts.map(c => c.layout);

  return (
    <MainLayout>
      <style>{resizeHandleStyles}</style>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/reports')} type="text" style={{ marginLeft: -8 }}>Quay lại</Button>
          <h2 style={{ margin: '8px 0 0', fontWeight: 500 }}>{report.ten}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {report.templateId && (
            <Button icon={<EyeOutlined />} onClick={() => setTemplatePreviewOpen(true)}>Xem mẫu</Button>
          )}
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight" disabled={charts.length === 0 || exporting}>
            <Button icon={<DownloadOutlined />} loading={exporting}>Xuất báo cáo</Button>
          </Dropdown>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Thêm biểu đồ</Button>
        </div>
      </div>

      <div id="grid-container" ref={gridRef} style={{ background: '#f0f2f5', borderRadius: 8, minHeight: 500, padding: 8 }}>
        {charts.length === 0 ? (
          <Card style={{ margin: 8 }}><Empty description="Chưa có biểu đồ nào">
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Thêm biểu đồ đầu tiên</Button>
          </Empty></Card>
        ) : (
          // @ts-ignore - react-grid-layout types issue
          <GridLayout className="layout" layout={layout.map(l => ({ ...l, minW: 3, minH: 2 }))} cols={12} rowHeight={80} width={containerWidth - 16}
            onDragStop={handleLayoutChange} onResizeStop={handleLayoutChange} draggableHandle=".drag-handle" isResizable={true}
            compactType={null} preventCollision={false} resizeHandles={['se', 'sw']}>
            {charts.map((chart) => (
              <div key={chart.id} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="drag-handle" style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'move', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{chart.ten}</span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditModal(chart)} />
                    <Popconfirm title="Xóa?" onConfirm={() => handleDeleteChart(chart.id)}>
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </span>
                </div>
                <div style={{ padding: 8, height: 'calc(100% - 45px)' }}>
                  {chartsData[chart.id] ? renderChartContent(chart, chartsData[chart.id], 250, (chart.layout.w / 12) * (containerWidth - 16)) : <Spin />}
                </div>
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal title={editingChart ? 'Sửa biểu đồ' : 'Thêm biểu đồ'} open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleSaveChart} okText={editingChart ? 'Cập nhật' : 'Thêm'} width={800}
        okButtonProps={{ disabled: !chartName || !selectedDataset || (['bar','line','area','pie','donut','funnel','scatter'].includes(chartType) && (!xColumn || !yColumn)) || (['card','gauge'].includes(chartType) && !yColumn) || (chartType === 'table' && selectedColumns.length === 0) }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Tên biểu đồ</div>
              <Input value={chartName} onChange={(e) => setChartName(e.target.value)} placeholder="Nhập tên" />
            </div>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Nguồn dữ liệu</div>
              <Select style={{ width: '100%' }} value={selectedDataset} onChange={(v) => { setSelectedDataset(v); setXColumn(''); setYColumn(''); }}
                options={datasets.map(d => ({ value: d.id, label: d.ten }))} />
            </div>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Loại biểu đồ</div>
              <Select style={{ width: '100%' }} value={chartType} onChange={(v) => { setChartType(v); setXColumn(''); setYColumn(''); }}
                options={CHART_TYPES.map(t => ({ value: t.value, label: <span>{t.icon} {t.label}</span> }))} />
            </div>
            {['bar', 'line', 'area', 'pie', 'donut', 'funnel'].includes(chartType) && (
              <>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Trục X (nhóm theo)</div>
                  <Select style={{ width: '100%' }} value={xColumn} onChange={setXColumn} placeholder="Chọn cột"
                    options={allColumns.filter(c => c.type === 'text' || c.type === 'date').map(c => ({ value: c.name, label: c.displayName }))} />
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Trục Y (tính tổng)</div>
                  <Select style={{ width: '100%' }} value={yColumn} onChange={setYColumn} placeholder="Chọn cột"
                    options={allColumns.filter(c => c.type === 'number').map(c => ({ value: c.name, label: c.displayName }))} />
                </div>
              </>
            )}
            {chartType === 'scatter' && (
              <>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Trục X (số)</div>
                  <Select style={{ width: '100%' }} value={xColumn} onChange={setXColumn} placeholder="Chọn cột số"
                    options={allColumns.filter(c => c.type === 'number').map(c => ({ value: c.name, label: c.displayName }))} />
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Trục Y (số)</div>
                  <Select style={{ width: '100%' }} value={yColumn} onChange={setYColumn} placeholder="Chọn cột số"
                    options={allColumns.filter(c => c.type === 'number').map(c => ({ value: c.name, label: c.displayName }))} />
                </div>
              </>
            )}
            {['card', 'gauge'].includes(chartType) && (
              <div>
                <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>{chartType === 'gauge' ? 'Giá trị đo' : 'Cột tính tổng'}</div>
                <Select style={{ width: '100%' }} value={yColumn} onChange={setYColumn} placeholder="Chọn cột"
                  options={allColumns.filter(c => c.type === 'number').map(c => ({ value: c.name, label: c.displayName }))} />
              </div>
            )}
            {chartType === 'table' && (
              <div>
                <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Chọn cột hiển thị</div>
                <Select mode="multiple" style={{ width: '100%' }} value={selectedColumns} onChange={setSelectedColumns} 
                  placeholder="Chọn các cột" maxTagCount={3}
                  options={allColumns.map(c => ({ value: c.name, label: c.displayName }))} />
              </div>
            )}
          </div>
          <div style={{ flex: 1, background: '#fafafa', borderRadius: 8, padding: 12, minHeight: 300 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Preview</div>
            {previewLoading ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}><Spin /></div>
              : previewData ? renderChartContent({ id: 0, ten: '', chartType, datasetId: selectedDataset!, xColumn, yColumn, columns: selectedColumns, layout: { i: '0', x: 0, y: 0, w: 4, h: 3 } }, previewData, 250)
              : <Empty description="Chọn nguồn dữ liệu" style={{ marginTop: 80 }} />}
          </div>
        </div>
      </Modal>

      {/* Template Preview Modal */}
      <Modal
        title={`Mẫu: ${REPORT_TEMPLATES.find(t => t.id === report?.templateId)?.name || ''}`}
        open={templatePreviewOpen}
        onCancel={() => setTemplatePreviewOpen(false)}
        footer={<Button onClick={() => setTemplatePreviewOpen(false)}>Đóng</Button>}
        width={1100}
        centered
      >
        {report?.templateId && (() => {
          const template = REPORT_TEMPLATES.find(t => t.id === report.templateId);
          if (!template || template.widgets.length === 0) return null;
          const maxY = Math.max(...template.widgets.map(w => w.position.y + w.position.h));
          const cellHeight = 550 / Math.max(maxY, 6);
          const cellWidth = 1084 / 12;
          return (
            <div style={{ background: '#f0f2f5', borderRadius: 8, padding: 8, height: 550, position: 'relative', overflow: 'hidden' }}>
              {template.widgets.map((widget, idx) => {
                const widgetHeight = widget.position.h * cellHeight - 8;
                return (
                  <div key={idx} style={{ position: 'absolute', left: widget.position.x * cellWidth + 4, top: widget.position.y * cellHeight + 4, width: widget.position.w * cellWidth - 8, height: widgetHeight, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '6px 10px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{widget.ten}</div>
                    <div style={{ padding: 6, height: 'calc(100% - 30px)' }}>{renderPreviewWidget(widget, idx, widgetHeight)}</div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Modal>
    </MainLayout>
  );
}
