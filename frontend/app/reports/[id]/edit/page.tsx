'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card, Row, Col, Spin, Empty, Button, Modal, Select, Input, Space, message, Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ColumnDef {
  name: string;
  displayName: string;
  type: string;
  role: string;
}

interface Dataset {
  id: number;
  ten: string;
  columns: ColumnDef[];
}

interface WidgetConfig {
  dimensions?: string[];
  measures?: { column: string; aggregate: string; alias?: string }[];
  filters?: any[];
  sort?: { column: string; direction: string };
  limit?: number;
}

interface Widget {
  id: number;
  ten: string;
  chartType: string;
  datasetId: number;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
}

interface Report {
  id: number;
  ten: string;
  moTa: string;
  widgets: Widget[];
}

interface UserProfile { id: number; toChucId: number; }

const CHART_TYPES = [
  { value: 'bar', label: 'Cột' },
  { value: 'line', label: 'Đường' },
  { value: 'pie', label: 'Tròn' },
  { value: 'donut', label: 'Donut' },
  { value: 'card', label: 'Số' },
  { value: 'table', label: 'Bảng' },
];

const AGGREGATES = [
  { value: 'sum', label: 'Tổng' },
  { value: 'avg', label: 'Trung bình' },
  { value: 'count', label: 'Đếm' },
  { value: 'min', label: 'Nhỏ nhất' },
  { value: 'max', label: 'Lớn nhất' },
];

export default function ReportEditPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [widgetsData, setWidgetsData] = useState<Record<number, any>>({});

  // Widget modal
  const [widgetModal, setWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [widgetName, setWidgetName] = useState('');
  const [widgetChartType, setWidgetChartType] = useState('bar');
  const [widgetDatasetId, setWidgetDatasetId] = useState<number | null>(null);
  const [widgetDimensions, setWidgetDimensions] = useState<string[]>([]);
  const [widgetMeasures, setWidgetMeasures] = useState<{ column: string; aggregate: string }[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { if (currentUser) { fetchReport(); fetchDatasets(); } }, [currentUser, reportId]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { router.push('/login'); return; }
      const res = await fetch('http://localhost:3001/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const response = await res.json();
        setCurrentUser(response.data || response);
      } else { router.push('/login'); }
    } catch { setLoading(false); }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/report/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        // Fetch data cho từng widget
        data.widgets?.forEach((w: Widget) => fetchWidgetData(w.id));
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

  const fetchWidgetData = async (widgetId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/report/widget/${widgetId}/data`);
      if (res.ok) {
        const data = await res.json();
        setWidgetsData((prev) => ({ ...prev, [widgetId]: data }));
      }
    } catch {}
  };

  const selectedDataset = datasets.find((d) => d.id === widgetDatasetId);
  const dimensionColumns = selectedDataset?.columns.filter((c) => c.role === 'dimension' || c.role === 'date') || [];
  const measureColumns = selectedDataset?.columns.filter((c) => c.role === 'measure') || [];

  const handlePreview = async () => {
    if (!widgetDatasetId || widgetMeasures.length === 0) return;
    try {
      const config: WidgetConfig = {
        dimensions: widgetDimensions,
        measures: widgetMeasures.map((m) => ({ ...m, alias: `${m.aggregate}_${m.column}` })),
        limit: 20,
      };
      const res = await fetch('http://localhost:3001/api/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: widgetDatasetId, config }),
      });
      if (res.ok) setPreviewData(await res.json());
    } catch {}
  };

  const handleSaveWidget = async () => {
    if (!widgetDatasetId || !widgetName || widgetMeasures.length === 0) {
      message.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const config: WidgetConfig = {
      dimensions: widgetDimensions,
      measures: widgetMeasures.map((m) => ({ ...m, alias: `${m.aggregate}_${m.column}` })),
    };
    const position = editingWidget?.position || { x: 0, y: 0, w: 6, h: 3 };

    try {
      if (editingWidget) {
        // Update
        await fetch(`http://localhost:3001/api/report/widget/${editingWidget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ten: widgetName, chartType: widgetChartType, config, position }),
        });
      } else {
        // Create
        await fetch(`http://localhost:3001/api/report/${reportId}/widget`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            datasetId: widgetDatasetId,
            ten: widgetName,
            chartType: widgetChartType,
            config,
            position,
          }),
        });
      }
      message.success('Đã lưu widget');
      setWidgetModal(false);
      resetWidgetForm();
      fetchReport();
    } catch { message.error('Lỗi'); }
  };

  const handleDeleteWidget = async (widgetId: number) => {
    try {
      await fetch(`http://localhost:3001/api/report/widget/${widgetId}`, { method: 'DELETE' });
      message.success('Đã xóa');
      fetchReport();
    } catch { message.error('Lỗi'); }
  };

  const openEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    setWidgetName(widget.ten);
    setWidgetChartType(widget.chartType);
    setWidgetDatasetId(widget.datasetId);
    setWidgetDimensions(widget.config.dimensions || []);
    setWidgetMeasures(widget.config.measures?.map((m) => ({ column: m.column, aggregate: m.aggregate })) || []);
    setPreviewData(null);
    setWidgetModal(true);
  };

  const resetWidgetForm = () => {
    setEditingWidget(null);
    setWidgetName('');
    setWidgetChartType('bar');
    setWidgetDatasetId(null);
    setWidgetDimensions([]);
    setWidgetMeasures([]);
    setPreviewData(null);
  };

  const renderMiniChart = (widget: Widget) => {
    const data = widgetsData[widget.id];
    if (!data?.data?.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;

    const dims = widget.config.dimensions || [];
    const measures = widget.config.measures || [];
    const measureKey = measures[0]?.alias || `${measures[0]?.aggregate}_${measures[0]?.column}`;

    if (widget.chartType === 'card') {
      return (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#1890ff' }}>
            {data.data[0]?.[measureKey]?.toLocaleString('vi-VN') || 0}
          </div>
        </div>
      );
    }

    if (widget.chartType === 'table') {
      return <div style={{ fontSize: 11, color: '#666' }}>{data.data.length} dòng</div>;
    }

    const chartOption: any = {
      xAxis: { type: 'category', data: data.data.map((d: any) => d[dims[0]]), show: false },
      yAxis: { type: 'value', show: false },
      series: [{ type: widget.chartType === 'line' ? 'line' : 'bar', data: data.data.map((d: any) => d[measureKey]) }],
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
    };

    if (widget.chartType === 'pie' || widget.chartType === 'donut') {
      return (
        <ReactECharts
          option={{
            series: [{
              type: 'pie',
              radius: widget.chartType === 'donut' ? ['30%', '60%'] : '60%',
              data: data.data.map((d: any) => ({ name: d[dims[0]], value: d[measureKey] })),
              label: { show: false },
            }],
          }}
          style={{ height: 100 }}
        />
      );
    }

    return <ReactECharts option={chartOption} style={{ height: 100 }} />;
  };

  if (loading || !currentUser) {
    return <MainLayout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin /></div></MainLayout>;
  }

  if (!report) {
    return <MainLayout><Empty description="Không tìm thấy báo cáo" /></MainLayout>;
  }

  return (
    <MainLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 500 }}>Chỉnh sửa: {report.ten}</h2>
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => router.push(`/reports/${reportId}`)}>Xem</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { resetWidgetForm(); setWidgetModal(true); }}>Thêm widget</Button>
        </Space>
      </div>

      {report.widgets?.length === 0 ? (
        <Card>
          <Empty description="Chưa có widget nào">
            <Button type="primary" onClick={() => { resetWidgetForm(); setWidgetModal(true); }}>Thêm widget đầu tiên</Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {report.widgets?.map((widget) => (
            <Col key={widget.id} xs={24} md={12} lg={8}>
              <Card
                title={widget.ten}
                size="small"
                extra={
                  <Space>
                    <Button size="small" onClick={() => openEditWidget(widget)}>Sửa</Button>
                    <Popconfirm title="Xóa widget?" onConfirm={() => handleDeleteWidget(widget.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                }
              >
                {renderMiniChart(widget)}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Widget Modal */}
      <Modal
        title={editingWidget ? 'Sửa widget' : 'Thêm widget'}
        open={widgetModal}
        onCancel={() => { setWidgetModal(false); resetWidgetForm(); }}
        onOk={handleSaveWidget}
        okText="Lưu"
        width={700}
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Input placeholder="Tên widget" value={widgetName} onChange={(e) => setWidgetName(e.target.value)} />
          
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Dataset</div>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn dataset"
                value={widgetDatasetId}
                onChange={(v) => { setWidgetDatasetId(v); setWidgetDimensions([]); setWidgetMeasures([]); }}
                options={datasets.map((d) => ({ value: d.id, label: d.ten }))}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Loại biểu đồ</div>
              <Select
                style={{ width: '100%' }}
                value={widgetChartType}
                onChange={setWidgetChartType}
                options={CHART_TYPES}
              />
            </Col>
          </Row>

          {selectedDataset && (
            <>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Dimension (phân loại)</div>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Chọn cột phân loại"
                value={widgetDimensions}
                onChange={setWidgetDimensions}
                options={dimensionColumns.map((c) => ({ value: c.name, label: c.displayName }))}
              />

              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Measure (đo lường)</div>
              {widgetMeasures.map((m, idx) => (
                <Row key={idx} gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={12}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Cột"
                      value={m.column}
                      onChange={(v) => {
                        const newM = [...widgetMeasures];
                        newM[idx].column = v;
                        setWidgetMeasures(newM);
                      }}
                      options={measureColumns.map((c) => ({ value: c.name, label: c.displayName }))}
                    />
                  </Col>
                  <Col span={10}>
                    <Select
                      style={{ width: '100%' }}
                      value={m.aggregate}
                      onChange={(v) => {
                        const newM = [...widgetMeasures];
                        newM[idx].aggregate = v;
                        setWidgetMeasures(newM);
                      }}
                      options={AGGREGATES}
                    />
                  </Col>
                  <Col span={2}>
                    <Button danger onClick={() => setWidgetMeasures(widgetMeasures.filter((_, i) => i !== idx))}>X</Button>
                  </Col>
                </Row>
              ))}
              <Button size="small" onClick={() => setWidgetMeasures([...widgetMeasures, { column: '', aggregate: 'sum' }])}>
                + Thêm measure
              </Button>

              <Button onClick={handlePreview} disabled={!widgetMeasures.length}>Preview</Button>

              {previewData && (
                <div style={{ background: '#fafafa', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>Preview ({previewData.data?.length} dòng)</div>
                  <table style={{ width: '100%', fontSize: 11 }}>
                    <thead>
                      <tr>{previewData.columns?.map((c: string) => <th key={c} style={{ textAlign: 'left', padding: 4 }}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {previewData.data?.slice(0, 5).map((row: any, i: number) => (
                        <tr key={i}>
                          {previewData.columns?.map((c: string) => (
                            <td key={c} style={{ padding: 4 }}>{typeof row[c] === 'number' ? row[c].toLocaleString() : row[c]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Space>
      </Modal>
    </MainLayout>
  );
}
