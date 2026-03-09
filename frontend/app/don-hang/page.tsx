'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, DatePicker,
  message, Popconfirm, Row, Col, Spin, Statistic,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';
import dayjs from 'dayjs';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface DonHang {
  id: number; toChucId: number; ngay: string; maDonHang: string; maSanPham: string; tenSanPham: string;
  danhMuc: string; soLuong: number; donGia: number; thanhTien: number; vung: string; maKhachHang: string;
}
interface DanhMuc { id: number; maDanhMuc: string; tenDanhMuc: string; mauSac: string; hoatDong: boolean; }
interface SanPham { id: number; maSanPham: string; tenSanPham: string; giaBan: number; danhMucId: number; danhMuc?: DanhMuc; tonKho: number; hoatDong: boolean; }
interface UserProfile { id: number; toChucId: number; }

const VUNG = [{ value: 'mien_bac', label: 'Miền Bắc' }, { value: 'mien_trung', label: 'Miền Trung' }, { value: 'mien_nam', label: 'Miền Nam' }];

export default function DonHangPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [donHangList, setDonHangList] = useState<DonHang[]>([]);
  const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);
  const [sanPhamList, setSanPhamList] = useState<SanPham[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDonHang, setEditingDonHang] = useState<DonHang | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [viewingDonHang, setViewingDonHang] = useState<DonHang | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
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
      const [dhRes, dmRes, spRes] = await Promise.all([
        fetch(`http://localhost:3001/api/don-hang?toChucId=${toChucId}`),
        fetch(`http://localhost:3001/api/danh-muc?toChucId=${toChucId}`),
        fetch(`http://localhost:3001/api/san-pham?toChucId=${toChucId}`),
      ]);
      const [dhData, dmData, spData] = await Promise.all([dhRes.json(), dmRes.json(), spRes.json()]);
      setDonHangList(dhData.data || dhData || []);
      setDanhMucList((dmData.data || dmData || []).filter((d: DanhMuc) => d.hoatDong));
      setSanPhamList((spData.data || spData || []).filter((s: SanPham) => s.hoatDong));
    } catch { message.error('Lỗi'); } finally { setLoading(false); }
  };

  const handleCreate = () => { setEditingDonHang(null); form.resetFields(); form.setFieldValue('ngay', dayjs()); setModalVisible(true); };
  const handleView = (r: DonHang) => { setViewingDonHang(r); setDetailVisible(true); };
  const handleEdit = (r: DonHang) => { setEditingDonHang(r); form.setFieldsValue({ ...r, ngay: dayjs(r.ngay) }); setModalVisible(true); };
  const handleDelete = async (r: DonHang) => {
    const res = await fetch(`http://localhost:3001/api/don-hang/${r.id}`, { method: 'DELETE' });
    if (res.ok) { message.success('Đã xóa'); if (currentUser) fetchData(currentUser.toChucId); }
  };

  const handleSubmit = async (values: any) => {
    if (!currentUser) return;
    const payload = {
      toChucId: currentUser.toChucId, ngay: values.ngay.format('YYYY-MM-DD'),
      maDonHang: values.maDonHang || undefined, sanPhamId: values.sanPhamId,
      maSanPham: values.maSanPham, tenSanPham: values.tenSanPham, danhMuc: values.danhMuc, soLuong: values.soLuong,
      donGia: values.donGia, thanhTien: values.soLuong * values.donGia, vung: values.vung, maKhachHang: values.maKhachHang,
    };
    const url = editingDonHang ? `http://localhost:3001/api/don-hang/${editingDonHang.id}` : 'http://localhost:3001/api/don-hang';
    const res = await fetch(url, { method: editingDonHang ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { message.success(editingDonHang ? 'Đã cập nhật' : 'Đã tạo'); setModalVisible(false); fetchData(currentUser.toChucId); }
    else { const e = await res.json(); message.error(e.message || 'Lỗi'); }
  };

  const handleValuesChange = (changed: any, all: any) => {
    if (changed.sanPhamId !== undefined) {
      const sp = sanPhamList.find(s => s.id === changed.sanPhamId);
      if (sp) {
        const dm = sp.danhMuc || danhMucList.find(d => d.id === sp.danhMucId);
        const donGia = Number(sp.giaBan);
        const soLuong = all.soLuong || 1;
        setTimeout(() => {
          form.setFieldsValue({ maSanPham: sp.maSanPham, tenSanPham: sp.tenSanPham, donGia, danhMuc: dm?.maDanhMuc || '', thanhTien: soLuong * donGia });
        }, 0);
      }
    } else if (changed.soLuong !== undefined) {
      const thanhTien = (changed.soLuong || 0) * (all.donGia || 0);
      setTimeout(() => form.setFieldValue('thanhTien', thanhTien), 0);
    }
  };

  // Stats
  const tongDoanhThu = donHangList.reduce((s, d) => s + Number(d.thanhTien || 0), 0);
  const tongDH = donHangList.length;
  const tongSP = donHangList.reduce((s, d) => s + (d.soLuong || 0), 0);

  // Chart: Doanh thu theo ngày (7 ngày gần nhất)
  const dtTheoNgay = donHangList.reduce((acc, d) => {
    const ngay = d.ngay?.split('T')[0] || '';
    const ex = acc.find(i => i.ngay === ngay);
    if (ex) ex.value += Number(d.thanhTien || 0);
    else acc.push({ ngay, value: Number(d.thanhTien || 0) });
    return acc;
  }, [] as { ngay: string; value: number }[]).sort((a, b) => a.ngay.localeCompare(b.ngay)).slice(-7);

  const chartOption = {
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: ${p[0].value.toLocaleString('vi-VN')}đ` },
    xAxis: { type: 'category', data: dtTheoNgay.map(d => { const dt = new Date(d.ngay); return `${dt.getDate()}/${dt.getMonth() + 1}`; }) },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}K` : v } },
    series: [{ type: 'line', data: dtTheoNgay.map(d => d.value), smooth: true, areaStyle: { color: 'rgba(24,144,255,0.1)' }, itemStyle: { color: '#1890ff' } }],
    grid: { left: 50, right: 20, top: 20, bottom: 30 }
  };

  const columns = [
    { title: 'Mã ĐH', dataIndex: 'maDonHang', width: 100, render: (t: string) => <Tag color="blue">{t || 'N/A'}</Tag> },
    { title: 'Ngày', dataIndex: 'ngay', width: 90, render: (d: string) => new Date(d).toLocaleDateString('vi-VN') },
    { title: 'Mã SP', dataIndex: 'maSanPham', width: 80, render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Sản phẩm', dataIndex: 'tenSanPham', ellipsis: true },
    { title: 'SL', dataIndex: 'soLuong', width: 50, align: 'center' as const },
    { title: 'Thành tiền', dataIndex: 'thanhTien', width: 110, align: 'right' as const, render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{new Intl.NumberFormat('vi-VN').format(v)}đ</span> },
    { title: 'Vùng', dataIndex: 'vung', width: 90, render: (v: string) => VUNG.find(r => r.value === v)?.label || v },
    {
      title: '', key: 'action', width: 100,
      render: (_: any, r: DonHang) => (
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
        <h2 style={{ margin: 0, fontWeight: 500 }}>Đơn hàng</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="Doanh thu" value={tongDoanhThu} suffix="đ" styles={{ content: { color: '#52c41a' } }} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="Đơn hàng" value={tongDH} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="Sản phẩm bán" value={tongSP} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card styles={{ body: { padding: 0 } }}>
            <Table dataSource={donHangList} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} size="middle" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Doanh thu 7 ngày" size="small">
            {dtTheoNgay.length > 0 ? <ReactECharts option={chartOption} style={{ height: 280 }} /> : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Chưa có dữ liệu</div>}
          </Card>
        </Col>
      </Row>

      <Modal title={editingDonHang ? 'Sửa đơn hàng' : 'Thêm đơn hàng'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={handleValuesChange} style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="maDonHang" label="Mã ĐH"><Input placeholder="Tự động nếu để trống" /></Form.Item></Col>
            <Col span={12}><Form.Item name="ngay" label="Ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sanPhamId" label="Sản phẩm" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label">
                  {sanPhamList.map(sp => (
                    <Select.Option key={sp.id} value={sp.id} label={`${sp.maSanPham} - ${sp.tenSanPham}`} disabled={sp.tonKho <= 0}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{sp.maSanPham} - {sp.tenSanPham}</span>
                        <Tag color={sp.tonKho <= 0 ? 'red' : sp.tonKho <= 10 ? 'orange' : 'green'}>{sp.tonKho}</Tag>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="tenSanPham" hidden><Input /></Form.Item>
              <Form.Item name="maSanPham" hidden><Input /></Form.Item>
            </Col>
            <Col span={12}><Form.Item name="danhMuc" label="Danh mục"><Select disabled>{danhMucList.map(dm => <Select.Option key={dm.maDanhMuc} value={dm.maDanhMuc}>{dm.tenDanhMuc}</Select.Option>)}</Select></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="soLuong" label="Số lượng" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="donGia" label="Đơn giá"><InputNumber disabled style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
            <Col span={8}><Form.Item name="thanhTien" label="Thành tiền"><InputNumber disabled style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="vung" label="Vùng" rules={[{ required: true }]}><Select>{VUNG.map(v => <Select.Option key={v.value} value={v.value}>{v.label}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="maKhachHang" label="Mã KH"><Input /></Form.Item></Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}><Space><Button onClick={() => setModalVisible(false)}>Hủy</Button><Button type="primary" htmlType="submit">{editingDonHang ? 'Lưu' : 'Tạo'}</Button></Space></Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết */}
      <Modal title="Chi tiết đơn hàng" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={<Button onClick={() => setDetailVisible(false)}>Đóng</Button>} width={450}>
        {viewingDonHang && (
          <div style={{ marginTop: 16 }}>
            <p><strong>Mã đơn hàng:</strong> <Tag color="blue">{viewingDonHang.maDonHang || 'N/A'}</Tag></p>
            <p><strong>Ngày:</strong> {new Date(viewingDonHang.ngay).toLocaleDateString('vi-VN')}</p>
            <p><strong>Mã sản phẩm:</strong> <Tag>{viewingDonHang.maSanPham}</Tag></p>
            <p><strong>Tên sản phẩm:</strong> {viewingDonHang.tenSanPham}</p>
            <p><strong>Danh mục:</strong> {viewingDonHang.danhMuc}</p>
            <p><strong>Số lượng:</strong> {viewingDonHang.soLuong}</p>
            <p><strong>Đơn giá:</strong> {new Intl.NumberFormat('vi-VN').format(viewingDonHang.donGia)}đ</p>
            <p><strong>Thành tiền:</strong> <span style={{ color: '#52c41a', fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN').format(viewingDonHang.thanhTien)}đ</span></p>
            <p><strong>Vùng:</strong> {VUNG.find(v => v.value === viewingDonHang.vung)?.label || viewingDonHang.vung}</p>
            <p><strong>Mã khách hàng:</strong> {viewingDonHang.maKhachHang || '-'}</p>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
