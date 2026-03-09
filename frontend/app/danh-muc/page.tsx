'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  ColorPicker,
  message,
  Popconfirm,
  Row,
  Col,
  Spin,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/MainLayout';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface DanhMuc {
  id: number;
  toChucId: number;
  tenDanhMuc: string;
  maDanhMuc: string;
  moTa: string;
  mauSac: string;
  hoatDong: boolean;
  ngayTao: string;
}

interface UserProfile {
  id: number;
  toChucId: number;
}

export default function DanhMucPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);
  const [sanPhamCount, setSanPhamCount] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [viewingDanhMuc, setViewingDanhMuc] = useState<DanhMuc | null>(null);
  const [editingDanhMuc, setEditingDanhMuc] = useState<DanhMuc | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { router.push('/login'); return; }

      const res = await fetch('http://localhost:3001/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const response = await res.json();
        const userData = response.data || response;
        setCurrentUser(userData);
        fetchData(userData.toChucId);
      } else {
        localStorage.removeItem('accessToken');
        router.push('/login');
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchData = async (toChucId: number) => {
    try {
      setLoading(true);
      const [dmRes, spRes] = await Promise.all([
        fetch(`http://localhost:3001/api/danh-muc?toChucId=${toChucId}`),
        fetch(`http://localhost:3001/api/san-pham?toChucId=${toChucId}`),
      ]);
      const [dmData, spData] = await Promise.all([dmRes.json(), spRes.json()]);
      const dmList = dmData.data || dmData || [];
      const spList = spData.data || spData || [];
      
      setDanhMucList(dmList);
      
      // Đếm số sản phẩm theo danh mục
      const count: Record<string, number> = {};
      spList.forEach((sp: any) => {
        if (sp.danhMucId) {
          count[sp.danhMucId] = (count[sp.danhMucId] || 0) + 1;
        }
      });
      setSanPhamCount(count);
    } catch {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record: DanhMuc) => {
    setViewingDanhMuc(record);
    setDetailVisible(true);
  };

  const handleCreate = () => {
    setEditingDanhMuc(null);
    form.resetFields();
    form.setFieldValue('mauSac', '#1890ff');
    setModalVisible(true);
  };

  const handleEdit = (record: DanhMuc) => {
    setEditingDanhMuc(record);
    form.setFieldsValue({ ...record, mauSac: record.mauSac || '#1890ff' });
    setModalVisible(true);
  };

  const handleDelete = async (record: DanhMuc) => {
    try {
      const res = await fetch(`http://localhost:3001/api/danh-muc/${record.id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Đã xóa');
        if (currentUser) fetchData(currentUser.toChucId);
      }
    } catch {
      message.error('Lỗi');
    }
  };

  const handleSubmit = async (values: any) => {
    if (!currentUser) return;
    try {
      const mauSac = typeof values.mauSac === 'string' ? values.mauSac : values.mauSac?.toHexString?.() || '#1890ff';
      const payload = { ...values, toChucId: currentUser.toChucId, mauSac };
      const url = editingDanhMuc ? `http://localhost:3001/api/danh-muc/${editingDanhMuc.id}` : 'http://localhost:3001/api/danh-muc';
      const method = editingDanhMuc ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        message.success(editingDanhMuc ? 'Đã cập nhật' : 'Đã tạo');
        setModalVisible(false);
        fetchData(currentUser.toChucId);
      } else {
        const error = await res.json();
        message.error(error.message || 'Lỗi');
      }
    } catch {
      message.error('Lỗi');
    }
  };

  // Chart: Số sản phẩm theo danh mục
  const chartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} sản phẩm' },
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      data: danhMucList.map(dm => ({
        name: dm.tenDanhMuc,
        value: sanPhamCount[dm.id] || 0,
        itemStyle: { color: dm.mauSac }
      })),
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } }
    }]
  };

  const columns = [
    {
      title: 'Danh mục',
      dataIndex: 'tenDanhMuc',
      render: (text: string, record: DanhMuc) => (
        <Space>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: record.mauSac }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    { title: 'Mã', dataIndex: 'maDanhMuc', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Sản phẩm', key: 'sp', render: (_: any, r: DanhMuc) => sanPhamCount[r.id] || 0, align: 'center' as const },
    {
      title: '',
      key: 'action',
      width: 100,
      render: (_: any, r: DanhMuc) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)} />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(r)} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading || !currentUser) {
    return <MainLayout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 500 }}>Danh mục</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm</Button>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card styles={{ body: { padding: 0 } }}>
            <Table dataSource={danhMucList} columns={columns} rowKey="id" pagination={false} size="middle" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bố sản phẩm" size="small">
            {danhMucList.length > 0 ? (
              <ReactECharts option={chartOption} style={{ height: 250 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Chưa có dữ liệu</div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal title={editingDanhMuc ? 'Sửa danh mục' : 'Thêm danh mục'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={400}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="maDanhMuc" label="Mã" rules={[{ required: true }]}>
            <Input disabled={!!editingDanhMuc} />
          </Form.Item>
          <Form.Item name="tenDanhMuc" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="moTa" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="mauSac" label="Màu">
            <ColorPicker showText />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">{editingDanhMuc ? 'Lưu' : 'Tạo'}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết */}
      <Modal title="Chi tiết danh mục" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={<Button onClick={() => setDetailVisible(false)}>Đóng</Button>} width={400}>
        {viewingDanhMuc && (
          <div style={{ marginTop: 16 }}>
            <p><strong>Mã:</strong> {viewingDanhMuc.maDanhMuc}</p>
            <p><strong>Tên:</strong> {viewingDanhMuc.tenDanhMuc}</p>
            <p><strong>Mô tả:</strong> {viewingDanhMuc.moTa || '-'}</p>
            <p><strong>Màu:</strong> <span style={{ display: 'inline-block', width: 16, height: 16, background: viewingDanhMuc.mauSac, borderRadius: 2, verticalAlign: 'middle' }} /></p>
            <p><strong>Số sản phẩm:</strong> {sanPhamCount[viewingDanhMuc.id] || 0}</p>
            <p><strong>Trạng thái:</strong> <Tag color={viewingDanhMuc.hoatDong ? 'green' : 'red'}>{viewingDanhMuc.hoatDong ? 'Hoạt động' : 'Ngừng'}</Tag></p>
            <p><strong>Ngày tạo:</strong> {new Date(viewingDanhMuc.ngayTao).toLocaleDateString('vi-VN')}</p>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
