'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Empty, Button, Space, Table, Tag } from 'antd';
import { DatabaseOutlined, FileTextOutlined, AppstoreOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Dataset {
  id: number;
  ten: string;
  tenFile: string;
  rowCount: number;
  columns: { name: string; displayName: string; type: string; role: string }[];
  ngayTao: string;
}

interface Report {
  id: number;
  ten: string;
  moTa: string;
  ngayCapNhat: string;
  widgets?: any[];
}

interface UserProfile {
  id: number;
  toChucId: number;
  hoTen: string;
  vaiTro: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { 
        router.push('/login'); 
        return; 
      }
      const res = await fetch('http://localhost:3001/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const response = await res.json();
        setCurrentUser(response.data || response);
      } else {
        // Token không hợp lệ, xóa và redirect
        localStorage.removeItem('accessToken');
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('accessToken');
      router.push('/login');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [dsRes, rpRes] = await Promise.all([
        fetch(`http://localhost:3001/api/dataset?toChucId=${currentUser.toChucId}`),
        fetch(`http://localhost:3001/api/report?toChucId=${currentUser.toChucId}`),
      ]);
      if (dsRes.ok) setDatasets(await dsRes.json());
      if (rpRes.ok) setReports(await rpRes.json());
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // Thống kê
  const totalRows = datasets.reduce((sum, ds) => sum + (ds.rowCount || 0), 0);
  const totalColumns = datasets.reduce((sum, ds) => sum + (ds.columns?.length || 0), 0);

  // Chart: Số dòng theo dataset
  const datasetChart = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: datasets.slice(0, 10).map((d) => d.ten.length > 15 ? d.ten.slice(0, 15) + '...' : d.ten),
      axisLabel: { fontSize: 11, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 },
    },
    series: [
      {
        type: 'bar',
        data: datasets.slice(0, 10).map((d) => d.rowCount),
        itemStyle: { color: '#1890ff' },
        barWidth: '60%',
      },
    ],
    grid: { left: 50, right: 20, top: 20, bottom: 60 },
  };

  // Chart: Phân bố kiểu cột
  const columnTypes = datasets.reduce((acc, ds) => {
    ds.columns?.forEach((col) => {
      acc[col.type] = (acc[col.type] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const typeColors: Record<string, string> = {
    text: '#1890ff',
    number: '#52c41a',
    date: '#faad14',
    boolean: '#722ed1',
  };

  const pieChart = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 11 } },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['35%', '50%'],
        data: Object.entries(columnTypes).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          itemStyle: { color: typeColors[name] || '#999' },
        })),
        label: { show: false },
      },
    ],
  };

  if (loading || !currentUser) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Spin />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontWeight: 500 }}>Xin chào, {currentUser.hoTen}!</h2>
        <p style={{ color: '#666', margin: '4px 0 0' }}>Tổng quan hệ thống BI</p>
      </div>

      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable onClick={() => router.push('/datasets')}>
            <Statistic
              title={<span><DatabaseOutlined style={{ color: '#1890ff' }} /> Datasets</span>}
              value={datasets.length}
              styles={{ content: { color: '#1890ff', fontSize: 24 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable onClick={() => router.push('/reports')}>
            <Statistic
              title={<span><FileTextOutlined style={{ color: '#52c41a' }} /> Báo cáo</span>}
              value={reports.length}
              styles={{ content: { color: '#52c41a', fontSize: 24 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={<span><AppstoreOutlined style={{ color: '#722ed1' }} /> Tổng dòng dữ liệu</span>}
              value={totalRows}
              formatter={(v) => Number(v).toLocaleString('vi-VN')}
              styles={{ content: { color: '#722ed1', fontSize: 24 } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title={<span><AppstoreOutlined style={{ color: '#faad14' }} /> Tổng cột</span>}
              value={totalColumns}
              styles={{ content: { color: '#faad14', fontSize: 24 } }}
            />
          </Card>
        </Col>
      </Row>

      {datasets.length === 0 && reports.length === 0 ? (
        <Card style={{ marginTop: 24, textAlign: 'center', padding: 40 }}>
          <Empty description="Chưa có dữ liệu nào">
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/datasets')}>
                Upload dữ liệu Excel
              </Button>
            </Space>
          </Empty>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={24} lg={14}>
              <Card size="small" title="Số dòng theo Dataset">
                {datasets.length > 0 ? (
                  <ReactECharts option={datasetChart} style={{ height: 260 }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Chưa có dữ liệu</div>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" title="Phân bố kiểu cột">
                {totalColumns > 0 ? (
                  <ReactECharts option={pieChart} style={{ height: 260 }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Chưa có dữ liệu</div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Danh sách báo cáo gần đây */}
          <Card
            size="small"
            title="Báo cáo gần đây"
            style={{ marginTop: 16 }}
            extra={
              <Button size="small" onClick={() => router.push('/reports')}>
                Xem tất cả
              </Button>
            }
          >
            {reports.length > 0 ? (
              <Table
                dataSource={reports.slice(0, 5)}
                columns={[
                  { title: 'Tên báo cáo', dataIndex: 'ten', key: 'ten' },
                  { title: 'Mô tả', dataIndex: 'moTa', key: 'moTa', ellipsis: true },
                  {
                    title: 'Cập nhật',
                    dataIndex: 'ngayCapNhat',
                    key: 'ngayCapNhat',
                    width: 120,
                    render: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
                  },
                  {
                    title: '',
                    key: 'actions',
                    width: 80,
                    render: (_: any, record: Report) => (
                      <Button size="small" icon={<EyeOutlined />} onClick={() => router.push(`/reports/${record.id}`)}>
                        Xem
                      </Button>
                    ),
                  },
                ]}
                pagination={false}
                size="small"
                rowKey="id"
              />
            ) : (
              <Empty description="Chưa có báo cáo">
                <Button type="primary" onClick={() => router.push('/reports')}>
                  Tạo báo cáo
                </Button>
              </Empty>
            )}
          </Card>

          {/* Danh sách datasets gần đây */}
          <Card
            size="small"
            title="Datasets gần đây"
            style={{ marginTop: 16 }}
            extra={
              <Button size="small" onClick={() => router.push('/datasets')}>
                Xem tất cả
              </Button>
            }
          >
            {datasets.length > 0 ? (
              <Table
                dataSource={datasets.slice(0, 5)}
                columns={[
                  { title: 'Tên', dataIndex: 'ten', key: 'ten' },
                  {
                    title: 'File',
                    dataIndex: 'tenFile',
                    key: 'tenFile',
                    render: (v: string) => <Tag>{v}</Tag>,
                  },
                  {
                    title: 'Cột',
                    dataIndex: 'columns',
                    key: 'columns',
                    width: 60,
                    render: (cols: any[]) => cols?.length || 0,
                  },
                  {
                    title: 'Dòng',
                    dataIndex: 'rowCount',
                    key: 'rowCount',
                    width: 80,
                    render: (v: number) => v?.toLocaleString('vi-VN'),
                  },
                  {
                    title: 'Ngày tạo',
                    dataIndex: 'ngayTao',
                    key: 'ngayTao',
                    width: 100,
                    render: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
                  },
                ]}
                pagination={false}
                size="small"
                rowKey="id"
              />
            ) : (
              <Empty description="Chưa có dataset">
                <Button type="primary" onClick={() => router.push('/datasets')}>
                  Upload dữ liệu
                </Button>
              </Empty>
            )}
          </Card>
        </>
      )}
    </MainLayout>
  );
}
