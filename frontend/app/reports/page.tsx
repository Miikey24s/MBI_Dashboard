'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Modal, Input, message, Spin, Empty, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, FileTextOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { REPORT_TEMPLATES, ReportTemplate } from './templates';
import { renderPreviewWidget } from './PreviewWidget';

interface Report {
  id: number;
  ten: string;
  moTa: string;
  templateId?: string;
  ngayTao: string;
  ngayCapNhat: string;
}

interface UserProfile { id: number; toChucId: number; }

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [creating, setCreating] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ReportTemplate | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { if (currentUser) fetchReports(); }, [currentUser]);

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

  const fetchReports = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/report?toChucId=${currentUser.toChucId}`);
      if (res.ok) setReports(await res.json());
    } catch { message.error('Lỗi'); } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!currentUser || !newName) return;
    setCreating(true);
    try {
      const template = REPORT_TEMPLATES.find(t => t.id === selectedTemplate);
      const res = await fetch('http://localhost:3001/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          toChucId: currentUser.toChucId, 
          ten: newName, 
          moTa: newDesc,
          templateId: selectedTemplate !== 'blank' ? selectedTemplate : null,
        }),
      });
      if (res.ok) {
        const report = await res.json();
        if (template && template.widgets.length > 0) {
          for (const widget of template.widgets) {
            await fetch(`http://localhost:3001/api/report/${report.id}/widget`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ten: widget.ten, chartType: widget.chartType, position: widget.position, config: {}, datasetId: null }),
            });
          }
        }
        message.success('Đã tạo báo cáo');
        setCreateModal(false);
        setNewName(''); setNewDesc(''); setSelectedTemplate('blank');
        if (template && template.widgets.length > 0) {
          router.push(`/reports/${report.id}`);
        } else { fetchReports(); }
      }
    } catch { message.error('Lỗi'); } finally { setCreating(false); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:3001/api/report/${id}`, { method: 'DELETE' });
      message.success('Đã xóa');
      fetchReports();
    } catch { message.error('Lỗi'); }
  };

  const openEditModal = (report: Report, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReport(report); setEditName(report.ten); setEditDesc(report.moTa || ''); setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingReport || !editName) return;
    try {
      const res = await fetch(`http://localhost:3001/api/report/${editingReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten: editName, moTa: editDesc }),
      });
      if (res.ok) { message.success('Đã cập nhật'); setEditModal(false); setEditingReport(null); fetchReports(); }
    } catch { message.error('Lỗi'); }
  };

  if (loading || !currentUser) {
    return <MainLayout><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 500 }}>Báo cáo</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>Tạo báo cáo</Button>
      </div>

      {reports.length === 0 ? (
        <Card><Empty description="Chưa có báo cáo nào"><Button type="primary" onClick={() => setCreateModal(true)}>Tạo báo cáo đầu tiên</Button></Empty></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {reports.map((report) => (
            <Col key={report.id} xs={24} sm={12} md={8} lg={6}>
              <Card hoverable onClick={() => router.push(`/reports/${report.id}`)} style={{ height: '100%' }} styles={{ body: { padding: 16 } }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#1890ff15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                      <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.ten}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{new Date(report.ngayCapNhat).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                  {report.moTa && <div style={{ fontSize: 13, color: '#666', marginBottom: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{report.moTa}</div>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <Button size="small" icon={<EditOutlined />} onClick={(e) => openEditModal(report, e)} />
                    <Popconfirm title="Xóa báo cáo này?" onConfirm={(e) => handleDelete(report.id, e as any)} onCancel={(e) => e?.stopPropagation()}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create Modal */}
      <Modal title="Tạo báo cáo mới" open={createModal} onCancel={() => { setCreateModal(false); setSelectedTemplate('blank'); }} onOk={handleCreate} okText="Tạo" okButtonProps={{ disabled: !newName, loading: creating }} width={600}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input placeholder="Tên báo cáo" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input.TextArea placeholder="Mô tả (tùy chọn)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} />
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Chọn mẫu</div>
            <Row gutter={[12, 12]}>
              {REPORT_TEMPLATES.map((template) => (
                <Col key={template.id} span={12}>
                  <div onClick={() => setSelectedTemplate(template.id)} style={{ border: selectedTemplate === template.id ? '2px solid #1890ff' : '1px solid #d9d9d9', borderRadius: 8, padding: 12, cursor: 'pointer', background: selectedTemplate === template.id ? '#e6f7ff' : '#fff', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{template.name}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{template.description}</div>
                      </div>
                      {template.widgets.length > 0 && (
                        <Button size="small" type="text" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template); setPreviewModal(true); }} />
                      )}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal title="Sửa báo cáo" open={editModal} onCancel={() => { setEditModal(false); setEditingReport(null); }} onOk={handleUpdate} okText="Lưu" okButtonProps={{ disabled: !editName }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="Tên báo cáo" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input.TextArea placeholder="Mô tả (tùy chọn)" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
        </div>
      </Modal>

      {/* Preview Template Modal */}
      <Modal title={previewTemplate ? `Xem trước: ${previewTemplate.name}` : 'Xem trước'} open={previewModal} onCancel={() => { setPreviewModal(false); setPreviewTemplate(null); }}
        footer={[
          <Button key="close" onClick={() => { setPreviewModal(false); setPreviewTemplate(null); }}>Đóng</Button>,
          <Button key="select" type="primary" onClick={() => { if (previewTemplate) setSelectedTemplate(previewTemplate.id); setPreviewModal(false); setPreviewTemplate(null); }}>Chọn mẫu này</Button>,
        ]} width={1100} centered>
        {previewTemplate && previewTemplate.widgets.length > 0 && (
          <div style={{ background: '#f0f2f5', borderRadius: 8, padding: 8, height: 550, position: 'relative', overflow: 'hidden' }}>
            {(() => {
              const maxY = Math.max(...previewTemplate.widgets.map(w => w.position.y + w.position.h));
              const cellHeight = 550 / Math.max(maxY, 6);
              const cellWidth = 1084 / 12;
              return previewTemplate.widgets.map((widget, idx) => {
                const widgetHeight = widget.position.h * cellHeight - 8;
                return (
                  <div key={idx} style={{ position: 'absolute', left: widget.position.x * cellWidth + 4, top: widget.position.y * cellHeight + 4, width: widget.position.w * cellWidth - 8, height: widgetHeight, background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '6px 10px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{widget.ten}</div>
                    <div style={{ padding: 6, height: 'calc(100% - 30px)' }}>{renderPreviewWidget(widget, idx, widgetHeight)}</div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
