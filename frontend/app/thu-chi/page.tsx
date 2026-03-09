'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, DatePicker,
  message, Popconfirm, Row, Col, Spin, Statistic, Segmented,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, EyeOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';
import dayjs from 'dayjs';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ThuChi {
  id: number; toChucId: number; ngay: string; maGiaoDich: string;
  loaiGiaoDich: 'thu' | 'chi'; danhMuc: string; moTa: string; soTien: number; ghiChu: string;
  tuDong?: boolean; donHangId?: number;
}
interface UserProfile { id: number; toChucId: number; }

const DANH_MUC_THU = [
  { value: 'doanh_thu_ban_hang', label: 'Doanh thu bán hàng' },
  { value: 'thu_khac', label: 'Thu khác' },
];

const DANH_MUC_CHI = [
  { value: 'nhap_hang', label: 'Nhập hàng' },
  { value: 'luong_nhan_vien', label: 'Lương nhân viên' },
  { value: 'thue_mat_bang', label: 'Thuê mặt bằng' },
  { value: 'dien_nuoc', label: 'Điện nước' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'van_chuyen', label: 'Vận chuyển' },
  { value: 'chi_khac', label: 'Chi khác' },
];

const ALL_DANH_MUC = [...DANH_MUC_THU, ...DANH_MUC_CHI];

export default function ThuChiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [thuChiList, setThuChiList] = useState<ThuChi[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingThuChi, setEditingThuChi] = useState<ThuChi | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [viewingThuChi, setViewingThuChi] = useState<ThuChi | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loaiFilter, setLoaiFilter] = useState<'all' | 'thu' | 'chi'>('all');
  const [form] = Form.useForm();

  useEffect(() => { fetchCurrentUser(); }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { router.push('/login'); return; }
      const res = await fetch('http://localhost:3001/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const userData = (await res.json()).data || await res.json();
        setCurrentUser(userData);
        fetchData(userData.toChucId);
      } else { router.push('/login'); }
    } catch { setLoading(false); }
  };

  const fetchData = async (toChucId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/thu-chi?toChucId=${toChucId}`);
      const data = await res.json();
      setThuChiList(data.data || data || []);
    } catch { message.error('Lỗi'); } finally { setLoading(false); }
  };

  const handleCreate = (loai: 'thu' | 'chi') => {
    setEditingThuChi(null);
    form.resetFields();
    form.setFieldsValue({ ngay: dayjs(), loaiGiaoDich: loai });
    setModalVisible(true);
  };

  const handleView = (r: ThuChi) => {
    setViewingThuChi(r);
    setDetailVisible(true);
  };

  const handleEdit = (r: ThuChi) => {
    setEditingThuChi(r);
    form.setFieldsValue({ ...r, ngay: dayjs(r.ngay) });
    setModalVisible(true);
  };

  const handleDelete = async (r: ThuChi) => {
    const res = await fetch(`http://localhost:3001/api/thu-chi/${r.id}`, { method: 'DELETE' });
    if (res.ok) { message.success('Đã xóa'); if (currentUser) fetchData(currentUser.toChucId); }
  };

  const handleSubmit = async (values: any) => {
    if (!currentUser) return;
    const payload = {
      toChucId: currentUser.toChucId,
      ngay: values.ngay.format('YYYY-MM-DD'),
      maGiaoDich: values.maGiaoDich || undefined,
      loaiGiaoDich: values.loaiGiaoDich,
      danhMuc: values.danhMuc,
      moTa: values.moTa,
      soTien: values.soTien,
      ghiChu: values.ghiChu,
    };
    const url = editingThuChi ? `http://localhost:3001/api/thu-chi/${editingThuChi.id}` : 'http://localhost:3001/api/thu-chi';
    const res = await fetch(url, { method: editingThuChi ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { message.success(editingThuChi ? 'Đã cập nhật' : 'Đã tạo'); setModalVisible(false); fetchData(currentUser.toChucId); }
    else { const e = await res.json(); message.error(e.message || 'Lỗi'); }
  };

  const loaiGiaoDich = Form.useWatch('loaiGiaoDich', form);

  // Filter
  const filteredList = loaiFilter === 'all' ? thuChiList : thuChiList.filter(t => t.loaiGiaoDich === loaiFilter);

  // Stats
  const tongThu = thuChiList.filter(t => t.loaiGiaoDich === 'thu').reduce((s, t) => s + Number(t.soTien || 0), 0);
  const tongChi = thuChiList.filter(t => t.loaiGiaoDich === 'chi').reduce((s, t) => s + Number(t.soTien || 0), 0);
  const loiNhuan = tongThu - tongChi;

  // Chart: Thu chi theo ngày (7 ngày gần nhất)
  const chartData = thuChiList.reduce((acc, t) => {
    const ngay = t.ngay?.split('T')[0] || '';
    let item = acc.find(i => i.ngay === ngay);
    if (!item) { item = { ngay, thu: 0, chi: 0 }; acc.push(item); }
    if (t.loaiGiaoDich === 'thu') item.thu += Number(t.soTien || 0);
    else item.chi += Number(t.soTien || 0);
    return acc;
  }, [] as { ngay: string; thu: number; chi: number }[]).sort((a, b) => a.ngay.localeCompare(b.ngay)).slice(-7);

  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Thu', 'Chi'], bottom: 0 },
    xAxis: { type: 'category', data: chartData.map(d => { const dt = new Date(d.ngay); return `${dt.getDate()}/${dt.getMonth() + 1}`; }) },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}K` : v } },
    series: [
      { name: 'Thu', type: 'bar', data: chartData.map(d => d.thu), itemStyle: { color: '#52c41a' } },
      { name: 'Chi', type: 'bar', data: chartData.map(d => d.chi), itemStyle: { color: '#ff4d4f' } },
    ],
    grid: { left: 50, right: 20, top: 20, bottom: 50 }
  };

  const columns = [
    { title: 'Mã', dataIndex: 'maGiaoDich', width: 100, render: (t: string, r: ThuChi) => <Tag color={r.loaiGiaoDich === 'thu' ? 'green' : 'red'}>{t || 'N/A'}</Tag> },
    { title: 'Ngày', dataIndex: 'ngay', width: 90, render: (d: string) => new Date(d).toLocaleDateString('vi-VN') },
    { title: 'Loại', dataIndex: 'loaiGiaoDich', width: 70, render: (v: string) => <Tag color={v === 'thu' ? 'green' : 'red'}>{v === 'thu' ? <><ArrowUpOutlined /> Thu</> : <><ArrowDownOutlined /> Chi</>}</Tag> },
    { title: 'Danh mục', dataIndex: 'danhMuc', width: 140, render: (v: string) => ALL_DANH_MUC.find(d => d.value === v)?.label || v },
    { title: 'Mô tả', dataIndex: 'moTa', ellipsis: true },
    { title: 'Số tiền', dataIndex: 'soTien', width: 120, align: 'right' as const, render: (v: number, r: ThuChi) => <span style={{ color: r.loaiGiaoDich === 'thu' ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>{r.loaiGiaoDich === 'thu' ? '+' : '-'}{new Intl.NumberFormat('vi-VN').format(v)}đ</span> },
    {
      title: '', key: 'action', width: 100,
      render: (_: any, r: ThuChi) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)} />
          {!r.tuDong && (
            <>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
              <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
            </>
          )}
        </Space>
      )
    },
  ];

  if (loading || !currentUser) return <MainLayout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin /></div></MainLayout>;

  return (
    <MainLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 500 }}>Thu Chi</h2>
        <Space>
          <Button type="primary" icon={<ArrowUpOutlined />} style={{ background: '#52c41a' }} onClick={() => handleCreate('thu')}>Phiếu thu</Button>
          <Button type="primary" danger icon={<ArrowDownOutlined />} onClick={() => handleCreate('chi')}>Phiếu chi</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="Tổng thu" value={tongThu} suffix="đ" styles={{ content: { color: '#52c41a' } }} prefix={<ArrowUpOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="Tổng chi" value={tongChi} suffix="đ" styles={{ content: { color: '#ff4d4f' } }} prefix={<ArrowDownOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="Lợi nhuận" value={loiNhuan} suffix="đ" styles={{ content: { color: loiNhuan >= 0 ? '#52c41a' : '#ff4d4f' } }} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card styles={{ body: { padding: 0 } }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <Segmented
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: 'Thu', value: 'thu' },
                  { label: 'Chi', value: 'chi' },
                ]}
                value={loaiFilter}
                onChange={(v) => setLoaiFilter(v as any)}
              />
            </div>
            <Table dataSource={filteredList} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} size="middle" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Thu chi 7 ngày" size="small">
            {chartData.length > 0 ? <ReactECharts option={chartOption} style={{ height: 280 }} /> : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Chưa có dữ liệu</div>}
          </Card>
        </Col>
      </Row>

      <Modal title={editingThuChi ? 'Sửa giao dịch' : (loaiGiaoDich === 'thu' ? 'Thêm phiếu thu' : 'Thêm phiếu chi')} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="loaiGiaoDich" hidden><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="maGiaoDich" label="Mã giao dịch"><Input placeholder="Tự động nếu để trống" /></Form.Item></Col>
            <Col span={12}><Form.Item name="ngay" label="Ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="danhMuc" label="Danh mục" rules={[{ required: true }]}>
                <Select>
                  {(loaiGiaoDich === 'thu' ? DANH_MUC_THU : DANH_MUC_CHI).map(dm => (
                    <Select.Option key={dm.value} value={dm.value}>{dm.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="soTien" label="Số tiền" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
          </Row>
          <Form.Item name="moTa" label="Mô tả" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="ghiChu" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}><Space><Button onClick={() => setModalVisible(false)}>Hủy</Button><Button type="primary" htmlType="submit">{editingThuChi ? 'Lưu' : 'Tạo'}</Button></Space></Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết */}
      <Modal title="Chi tiết giao dịch" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={<Button onClick={() => setDetailVisible(false)}>Đóng</Button>} width={450}>
        {viewingThuChi && (
          <div style={{ marginTop: 16 }}>
            <p><strong>Mã giao dịch:</strong> <Tag color={viewingThuChi.loaiGiaoDich === 'thu' ? 'green' : 'red'}>{viewingThuChi.maGiaoDich || 'N/A'}</Tag></p>
            <p><strong>Ngày:</strong> {new Date(viewingThuChi.ngay).toLocaleDateString('vi-VN')}</p>
            <p><strong>Loại:</strong> <Tag color={viewingThuChi.loaiGiaoDich === 'thu' ? 'green' : 'red'}>{viewingThuChi.loaiGiaoDich === 'thu' ? 'Thu' : 'Chi'}</Tag></p>
            <p><strong>Danh mục:</strong> {ALL_DANH_MUC.find(d => d.value === viewingThuChi.danhMuc)?.label || viewingThuChi.danhMuc}</p>
            <p><strong>Mô tả:</strong> {viewingThuChi.moTa}</p>
            <p><strong>Số tiền:</strong> <span style={{ color: viewingThuChi.loaiGiaoDich === 'thu' ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>{viewingThuChi.loaiGiaoDich === 'thu' ? '+' : '-'}{new Intl.NumberFormat('vi-VN').format(viewingThuChi.soTien)}đ</span></p>
            <p><strong>Ghi chú:</strong> {viewingThuChi.ghiChu || '-'}</p>
            {viewingThuChi.tuDong && <p><strong>Nguồn:</strong> <Tag color="blue">Tự động tạo</Tag></p>}
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
