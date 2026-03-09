'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select,
  message, Popconfirm, Row, Col, Spin, Statistic,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface SanPham {
  id: number; toChucId: number; danhMucId: number; maSanPham: string; tenSanPham: string;
  moTa: string; giaNhap: number; giaBan: number; donVi: string; tonKho: number; soLuongNhap: number; hoatDong: boolean; danhMuc?: DanhMuc;
}
interface DanhMuc { id: number; maDanhMuc: string; tenDanhMuc: string; mauSac: string; hoatDong: boolean; }
interface UserProfile { id: number; toChucId: number; }

export default function SanPhamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sanPhamList, setSanPhamList] = useState<SanPham[]>([]);
  const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [viewingSanPham, setViewingSanPham] = useState<SanPham | null>(null);
  const [editingSanPham, setEditingSanPham] = useState<SanPham | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchCurrentUser(); }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { router.push('/login'); return; }
      const res = await fetch('http://localhost:3001/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const response = await res.json();
        const userData = response.data || response;
        setCurrentUser(userData);
        fetchData(userData.toChucId);
      } else { router.push('/login'); }
    } catch { setLoading(false); }
  };

  const fetchData = async (toChucId: number) => {
    try {
      setLoading(true);
      const [spRes, dmRes] = await Promise.all([
        fetch(`http://localhost:3001/api/san-pham?toChucId=${toChucId}`),
        fetch(`http://localhost:3001/api/danh-muc?toChucId=${toChucId}`),
      ]);
      const [spData, dmData] = await Promise.all([spRes.json(), dmRes.json()]);
      setSanPhamList(spData.data || spData || []);
      setDanhMucList((dmData.data || dmData || []).filter((dm: DanhMuc) => dm.hoatDong));
    } catch { message.error('Lỗi'); } finally { setLoading(false); }
  };

  const handleView = (sp: SanPham) => {
    setViewingSanPham(sp);
    setDetailVisible(true);
  };

  const handleCreate = () => { setEditingSanPham(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (r: SanPham) => { setEditingSanPham(r); form.setFieldsValue(r); setModalVisible(true); };
  const handleDelete = async (r: SanPham) => {
    const res = await fetch(`http://localhost:3001/api/san-pham/${r.id}`, { method: 'DELETE' });
    if (res.ok) { message.success('Đã xóa'); if (currentUser) fetchData(currentUser.toChucId); }
  };

  const handleSubmit = async (values: any) => {
    if (!currentUser) return;
    const payload = { ...values, toChucId: currentUser.toChucId };
    const url = editingSanPham ? `http://localhost:3001/api/san-pham/${editingSanPham.id}` : 'http://localhost:3001/api/san-pham';
    const res = await fetch(url, { method: editingSanPham ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { message.success(editingSanPham ? 'Đã cập nhật' : 'Đã tạo'); setModalVisible(false); fetchData(currentUser.toChucId); }
    else { const e = await res.json(); message.error(e.message || 'Lỗi'); }
  };

  // Stats
  const tongSP = sanPhamList.length;
  const tongTonKho = sanPhamList.reduce((s, p) => s + p.tonKho, 0);
  const sapHet = sanPhamList.filter(p => p.tonKho > 0 && p.tonKho <= 10).length;
  const hetHang = sanPhamList.filter(p => p.tonKho === 0).length;

  // Chart: Tồn kho theo danh mục
  const tonKhoTheoDM = danhMucList.map(dm => ({
    name: dm.tenDanhMuc,
    value: sanPhamList.filter(sp => sp.danhMucId === dm.id).reduce((s, sp) => s + sp.tonKho, 0),
    color: dm.mauSac
  }));

  const chartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: tonKhoTheoDM.map(d => d.name), axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: tonKhoTheoDM.map(d => ({ value: d.value, itemStyle: { color: d.color } })) }],
    grid: { left: 40, right: 20, top: 20, bottom: 30 }
  };

  const columns = [
    { title: 'Mã', dataIndex: 'maSanPham', render: (t: string) => <Tag>{t}</Tag>, width: 90 },
    { title: 'Tên sản phẩm', dataIndex: 'tenSanPham', ellipsis: true },
    {
      title: 'Danh mục', dataIndex: 'danhMucId', width: 110,
      render: (_: any, r: SanPham) => {
        const dm = r.danhMuc || danhMucList.find(d => d.id === r.danhMucId);
        return dm ? <Tag color={dm.mauSac}>{dm.tenDanhMuc}</Tag> : '-';
      }
    },
    { title: 'Giá nhập', dataIndex: 'giaNhap', width: 100, align: 'right' as const, render: (v: number) => <span style={{ color: '#999' }}>{new Intl.NumberFormat('vi-VN').format(v || 0)}đ</span> },
    { title: 'Giá bán', dataIndex: 'giaBan', width: 100, align: 'right' as const, render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{new Intl.NumberFormat('vi-VN').format(v)}đ</span> },
    { title: 'Đã nhập', dataIndex: 'soLuongNhap', width: 70, align: 'center' as const, render: (v: number) => <span style={{ color: '#1890ff' }}>{v || 0}</span> },
    { title: 'Đã bán', key: 'daBan', width: 70, align: 'center' as const, render: (_: any, r: SanPham) => <span style={{ color: '#722ed1' }}>{(r.soLuongNhap || 0) - r.tonKho}</span> },
    { title: 'Tồn', dataIndex: 'tonKho', width: 60, align: 'center' as const, render: (v: number) => <span style={{ color: v === 0 ? '#f5222d' : v <= 10 ? '#faad14' : '#52c41a', fontWeight: 500 }}>{v}</span> },
    {
      title: '', key: 'action', width: 100,
      render: (_: any, r: SanPham) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)} />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    },
  ];

  if (loading || !currentUser) return <MainLayout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin /></div></MainLayout>;

  return (
    <MainLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 500 }}>Sản phẩm</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Tổng SP" value={tongSP} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Tồn kho" value={tongTonKho} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Sắp hết" value={sapHet} styles={{ content: { color: '#faad14' } }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Hết hàng" value={hetHang} styles={{ content: { color: '#f5222d' } }} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card styles={{ body: { padding: 0 } }}>
            <Table dataSource={sanPhamList} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} size="middle" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Tồn kho theo danh mục" size="small">
            {tonKhoTheoDM.length > 0 ? <ReactECharts option={chartOption} style={{ height: 280 }} /> : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Chưa có dữ liệu</div>}
          </Card>
        </Col>
      </Row>

      {/* Modal thêm/sửa sản phẩm */}
      <Modal title={editingSanPham ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="maSanPham" label="Mã SP" rules={[{ required: true }]}><Input disabled={!!editingSanPham} /></Form.Item></Col>
            <Col span={12}><Form.Item name="danhMucId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}><Select placeholder="Chọn danh mục">{danhMucList.map(dm => <Select.Option key={dm.id} value={dm.id}>{dm.tenDanhMuc}</Select.Option>)}</Select></Form.Item></Col>
          </Row>
          <Form.Item name="tenSanPham" label="Tên sản phẩm" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="giaNhap" label="Giá nhập" rules={[{ required: true, message: 'Nhập giá nhập' }]}><InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v?.replace(/,/g, '') as any} /></Form.Item></Col>
            <Col span={8}><Form.Item name="giaBan" label="Giá bán" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v?.replace(/,/g, '') as any} /></Form.Item></Col>
            <Col span={8}><Form.Item name="donVi" label="Đơn vị" initialValue="cái"><Select><Select.Option value="cái">Cái</Select.Option><Select.Option value="chiếc">Chiếc</Select.Option><Select.Option value="bộ">Bộ</Select.Option><Select.Option value="kg">Kg</Select.Option></Select></Form.Item></Col>
          </Row>
          <Form.Item name="tonKho" label="Tồn kho ban đầu" rules={[{ required: true, message: 'Nhập tồn kho' }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}><Space><Button onClick={() => setModalVisible(false)}>Hủy</Button><Button type="primary" htmlType="submit">{editingSanPham ? 'Lưu' : 'Tạo'}</Button></Space></Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết */}
      <Modal title="Chi tiết sản phẩm" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={<Button onClick={() => setDetailVisible(false)}>Đóng</Button>} width={450}>
        {viewingSanPham && (
          <div style={{ marginTop: 16 }}>
            <p><strong>Mã SP:</strong> {viewingSanPham.maSanPham}</p>
            <p><strong>Tên:</strong> {viewingSanPham.tenSanPham}</p>
            <p><strong>Danh mục:</strong> {viewingSanPham.danhMuc?.tenDanhMuc || danhMucList.find(d => d.id === viewingSanPham.danhMucId)?.tenDanhMuc || '-'}</p>
            <p><strong>Giá nhập:</strong> {new Intl.NumberFormat('vi-VN').format(viewingSanPham.giaNhap || 0)}đ</p>
            <p><strong>Giá bán:</strong> <span style={{ color: '#52c41a', fontWeight: 500 }}>{new Intl.NumberFormat('vi-VN').format(viewingSanPham.giaBan)}đ</span></p>
            <p><strong>Lợi nhuận/SP:</strong> <span style={{ color: '#1890ff', fontWeight: 500 }}>{new Intl.NumberFormat('vi-VN').format(viewingSanPham.giaBan - (viewingSanPham.giaNhap || 0))}đ</span></p>
            <p><strong>Đơn vị:</strong> {viewingSanPham.donVi}</p>
            <p><strong>Đã nhập:</strong> <span style={{ color: '#1890ff' }}>{viewingSanPham.soLuongNhap || 0}</span></p>
            <p><strong>Đã bán:</strong> <span style={{ color: '#722ed1' }}>{(viewingSanPham.soLuongNhap || 0) - viewingSanPham.tonKho}</span></p>
            <p><strong>Tồn kho:</strong> <Tag color={viewingSanPham.tonKho === 0 ? 'red' : viewingSanPham.tonKho <= 10 ? 'orange' : 'green'}>{viewingSanPham.tonKho}</Tag></p>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
