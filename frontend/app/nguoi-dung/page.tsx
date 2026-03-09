'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm, Switch, Row, Col, Spin, Statistic,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CrownOutlined, UserOutlined, EyeOutlined, TeamOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface NguoiDung {
  id: number; toChucId: number; email: string; hoTen: string;
  vaiTro: 'admin' | 'quan_ly' | 'nhan_vien' | 'nguoi_xem'; hoatDong: boolean; ngayTao: string;
}
interface UserProfile { id: number; toChucId: number; }

const VAI_TRO = [
  { value: 'admin', label: 'Admin', icon: <CrownOutlined />, color: 'red' },
  { value: 'quan_ly', label: 'Quản lý', icon: <TeamOutlined />, color: 'blue' },
  { value: 'nhan_vien', label: 'Nhân viên', icon: <UserOutlined />, color: 'purple' },
  { value: 'nguoi_xem', label: 'Người xem', icon: <EyeOutlined />, color: 'green' },
];

export default function NguoiDungPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nguoiDungList, setNguoiDungList] = useState<NguoiDung[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<NguoiDung | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchCurrentUser(); }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { router.push('/login'); return; }
      const res = await fetch('http://localhost:3001/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const userData = (await res.json()).data;
        setCurrentUser(userData);
        fetchNguoiDung(userData.toChucId);
      } else { router.push('/login'); }
    } catch { setLoading(false); }
  };

  const fetchNguoiDung = async (toChucId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/nguoi-dung?toChucId=${toChucId}`);
      const data = await res.json();
      setNguoiDungList(data.data || data || []);
    } catch { message.error('Lỗi'); } finally { setLoading(false); }
  };

  const handleCreate = () => { setEditingUser(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (r: NguoiDung) => {
    if (r.vaiTro === 'admin') { message.warning('Không thể sửa Admin'); return; }
    setEditingUser(r); form.setFieldsValue({ hoTen: r.hoTen, email: r.email, vaiTro: r.vaiTro }); setModalVisible(true);
  };
  const handleDelete = async (r: NguoiDung) => {
    if (r.vaiTro === 'admin') { message.warning('Không thể xóa Admin'); return; }
    const res = await fetch(`http://localhost:3001/api/nguoi-dung/${r.id}`, { method: 'DELETE' });
    if (res.ok) { message.success('Đã xóa'); if (currentUser) fetchNguoiDung(currentUser.toChucId); }
  };
  const handleToggleActive = async (r: NguoiDung) => {
    if (r.vaiTro === 'admin') return;
    await fetch(`http://localhost:3001/api/nguoi-dung/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hoatDong: !r.hoatDong })
    });
    if (currentUser) fetchNguoiDung(currentUser.toChucId);
  };

  const handleSubmit = async (values: any) => {
    if (!currentUser) return;
    const payload = { ...values, toChucId: currentUser.toChucId };
    const url = editingUser ? `http://localhost:3001/api/nguoi-dung/${editingUser.id}` : 'http://localhost:3001/api/nguoi-dung';
    const res = await fetch(url, { method: editingUser ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { message.success(editingUser ? 'Đã cập nhật' : 'Đã tạo'); setModalVisible(false); fetchNguoiDung(currentUser.toChucId); }
    else { const e = await res.json(); message.error(e.message || 'Lỗi'); }
  };

  // Stats
  const tong = nguoiDungList.length;
  const hoatDong = nguoiDungList.filter(u => u.hoatDong).length;

  // Chart: Phân bố vai trò
  const roleData = VAI_TRO.map(r => ({
    name: r.label,
    value: nguoiDungList.filter(u => u.vaiTro === r.value).length,
    itemStyle: { color: r.color === 'red' ? '#f5222d' : r.color === 'blue' ? '#1890ff' : r.color === 'purple' ? '#722ed1' : '#52c41a' }
  })).filter(d => d.value > 0);

  const chartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{ type: 'pie', radius: ['45%', '70%'], data: roleData, label: { show: false }, emphasis: { label: { show: true, fontSize: 14 } } }]
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'hoTen', render: (t: string, r: NguoiDung) => <Space><span style={{ fontWeight: 500 }}>{t}</span>{r.vaiTro === 'admin' && <CrownOutlined style={{ color: '#faad14' }} />}</Space> },
    { title: 'Email', dataIndex: 'email', ellipsis: true },
    { title: 'Vai trò', dataIndex: 'vaiTro', width: 120, render: (v: string) => { const r = VAI_TRO.find(x => x.value === v); return <Tag color={r?.color}>{r?.label || v}</Tag>; } },
    { title: '', dataIndex: 'hoatDong', width: 60, render: (v: boolean, r: NguoiDung) => <Switch size="small" checked={v} onChange={() => handleToggleActive(r)} disabled={r.vaiTro === 'admin'} /> },
    {
      title: '', key: 'action', width: 70,
      render: (_: any, r: NguoiDung) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} disabled={r.vaiTro === 'admin'} />
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r)} disabled={r.vaiTro === 'admin'}><Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={r.vaiTro === 'admin'} /></Popconfirm>
        </Space>
      )
    },
  ];

  if (loading || !currentUser) return <MainLayout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin /></div></MainLayout>;

  return (
    <MainLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 500 }}>Người dùng</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Tổng" value={tong} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Hoạt động" value={hoatDong} styles={{ content: { color: '#52c41a' } }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Ngưng" value={tong - hoatDong} styles={{ content: { color: '#999' } }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Admin" value={nguoiDungList.filter(u => u.vaiTro === 'admin').length} styles={{ content: { color: '#f5222d' } }} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card styles={{ body: { padding: 0 } }}>
            <Table dataSource={nguoiDungList} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} size="middle" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bố vai trò" size="small">
            {roleData.length > 0 ? <ReactECharts option={chartOption} style={{ height: 250 }} /> : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Chưa có dữ liệu</div>}
          </Card>
        </Col>
      </Row>

      <Modal title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={400}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}><Input disabled={!!editingUser} /></Form.Item>
          {!editingUser && <Form.Item name="matKhau" label="Mật khẩu" rules={[{ required: true }, { min: 6 }]}><Input.Password /></Form.Item>}
          <Form.Item name="vaiTro" label="Vai trò" initialValue="nguoi_xem" rules={[{ required: true }]}>
            <Select>{VAI_TRO.map(r => <Select.Option key={r.value} value={r.value}><Space>{r.icon}{r.label}</Space></Select.Option>)}</Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}><Space><Button onClick={() => setModalVisible(false)}>Hủy</Button><Button type="primary" htmlType="submit">{editingUser ? 'Lưu' : 'Tạo'}</Button></Space></Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
