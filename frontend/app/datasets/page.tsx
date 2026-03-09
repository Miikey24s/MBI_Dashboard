'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Button, Space, Modal, Upload, Input, message, Spin, Tag, Select, Popconfirm, Alert,
} from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import MainLayout from '@/components/MainLayout';

interface ColumnDef {
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  role: 'dimension' | 'measure' | 'date';
  mixedData?: boolean;
}

interface SheetInfo {
  name: string;
  rowCount: number;
  colCount: number;
}

interface Dataset {
  id: number;
  ten: string;
  tenFile: string;
  columns: ColumnDef[];
  rowCount: number;
  nguoiTaoId: number;
  nguoiTao?: { id: number; hoTen: string };
  ngayTao: string;
}

interface UserProfile { id: number; toChucId: number; hoTen?: string; }

export default function DatasetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Upload modal
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [datasetName, setDatasetName] = useState('');
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [previewData, setPreviewData] = useState<{ columns: ColumnDef[]; preview: any[]; totalRows?: number; warnings?: string[]; allRows?: any[] } | null>(null);
  const [editingColumns, setEditingColumns] = useState<ColumnDef[]>([]);

  // Preview modal
  const [previewModal, setPreviewModal] = useState(false);
  const [previewDataset, setPreviewDataset] = useState<{ data: any[]; total: number } | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => { fetchCurrentUser(); }, []);
  useEffect(() => { if (currentUser) fetchDatasets(); }, [currentUser]);

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

  const fetchDatasets = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/dataset?toChucId=${currentUser.toChucId}`);
      if (res.ok) setDatasets(await res.json());
    } catch { message.error('Lỗi tải dữ liệu'); } finally { setLoading(false); }
  };

  const handlePreviewFile = async (file: File, sheetName?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (sheetName) formData.append('sheetName', sheetName);
    
    // Set tên dataset từ tên file ngay lập tức
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setDatasetName(fileName);
    
    try {
      const res = await fetch('http://localhost:3001/api/dataset/preview', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setEditingColumns(data.columns);
        setSheets(data.sheets || []);
        if (!sheetName && data.sheets?.length > 0) {
          setSelectedSheet(data.sheets[0].name);
        }
      } else { 
        const err = await res.json().catch(() => ({}));
        message.error(err.message || 'Lỗi đọc file'); 
      }
    } catch (e) { 
      console.error(e);
      message.error('Lỗi kết nối server'); 
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (fileList[0]?.originFileObj) {
      handlePreviewFile(fileList[0].originFileObj as File, sheetName);
    }
  };

  const handleUpload = async () => {
    if (!currentUser || !fileList[0] || !datasetName) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as File);
      formData.append('toChucId', String(currentUser.toChucId));
      formData.append('nguoiTaoId', String(currentUser.id));
      formData.append('ten', datasetName);
      if (selectedSheet) formData.append('sheetName', selectedSheet);
      
      const res = await fetch('http://localhost:3001/api/dataset/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const dataset = await res.json();
        if (editingColumns.length > 0) {
          await fetch(`http://localhost:3001/api/dataset/${dataset.id}/columns`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ columns: editingColumns }),
          });
        }
        message.success('Upload thành công');
        setUploadModal(false);
        resetUploadForm();
        fetchDatasets();
      } else { message.error('Lỗi upload'); }
    } catch { message.error('Lỗi'); } finally { setUploading(false); }
  };

  const resetUploadForm = () => {
    setFileList([]);
    setDatasetName('');
    setPreviewData(null);
    setEditingColumns([]);
    setSheets([]);
    setSelectedSheet('');
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://localhost:3001/api/dataset/${id}`, { method: 'DELETE' });
      message.success('Đã xóa');
      fetchDatasets();
    } catch { message.error('Lỗi'); }
  };

  const handleViewData = async (dataset: Dataset, page = 1) => {
    setSelectedDataset(dataset);
    setPreviewPage(page);
    setPreviewLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/dataset/${dataset.id}/data?page=${page}&limit=100`);
      if (res.ok) {
        setPreviewDataset(await res.json());
        setPreviewModal(true);
      }
    } catch { message.error('Lỗi'); } finally { setPreviewLoading(false); }
  };

  const handlePreviewPageChange = (page: number) => {
    if (selectedDataset) {
      handleViewData(selectedDataset, page);
    }
  };

  const mixedDataColumns = editingColumns.filter((c) => c.mixedData);

  const columns = [
    { title: 'Tên', dataIndex: 'ten', key: 'ten' },
    { title: 'File', dataIndex: 'tenFile', key: 'tenFile', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Cột', dataIndex: 'columns', key: 'columns', render: (cols: ColumnDef[]) => cols?.length || 0 },
    { title: 'Dòng', dataIndex: 'rowCount', key: 'rowCount', render: (v: number) => v?.toLocaleString() },
    { title: 'Người tạo', dataIndex: 'nguoiTao', key: 'nguoiTao', render: (v: any) => v?.hoTen || '-' },
    { title: 'Ngày tạo', dataIndex: 'ngayTao', key: 'ngayTao', render: (v: string) => new Date(v).toLocaleDateString('vi-VN') },
    {
      title: '', key: 'actions', width: 100,
      render: (_: any, record: Dataset) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewData(record)} />
          <Popconfirm title="Xóa dataset này?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
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
        <h2 style={{ margin: 0, fontWeight: 500 }}>Dữ liệu</h2>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModal(true)}>Upload dữ liệu</Button>
      </div>

      <Card>
        <Table dataSource={datasets} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload dữ liệu"
        open={uploadModal}
        onCancel={() => { setUploadModal(false); resetUploadForm(); }}
        onOk={handleUpload}
        okText="Upload"
        confirmLoading={uploading}
        width={850}
        okButtonProps={{ disabled: !fileList.length || !datasetName }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          <Upload
            accept=".xlsx,.xls,.csv"
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([{ ...file, originFileObj: file } as UploadFile]);
              handlePreviewFile(file);
              return false;
            }}
            onRemove={() => { setFileList([]); setPreviewData(null); setSheets([]); }}
          >
            <Button icon={<UploadOutlined />}>Chọn file Excel hoặc CSV</Button>
          </Upload>

          {sheets.length > 0 && (
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                Chọn Sheet {sheets.length > 1 ? `(${sheets.length} sheets)` : ''}
              </div>
              <Select
                style={{ width: '100%' }}
                value={selectedSheet}
                onChange={handleSheetChange}
                options={sheets.map((s) => ({ 
                  value: s.name, 
                  label: `${s.name} (${s.rowCount.toLocaleString()} dòng, ${s.colCount} cột)` 
                }))}
              />
            </div>
          )}

          {previewData?.totalRows && (
            <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 4 }}>
              <strong>Thông tin file:</strong> {previewData.totalRows.toLocaleString()} dòng, {editingColumns.length} cột
            </div>
          )}

          {previewData?.warnings && previewData.warnings.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="Cảnh báo"
              description={previewData.warnings.map((w, i) => <div key={i}>{w}</div>)}
            />
          )}

          <Input
            placeholder="Tên dataset"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
          />

          {mixedDataColumns.length > 0 && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message="Dữ liệu không đồng nhất"
              description={
                <div>
                  Các cột sau có dữ liệu lẫn lộn (ví dụ: cột số có cả chữ):
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                    {mixedDataColumns.map((c) => (
                      <li key={c.name}><strong>{c.displayName}</strong> (kiểu: {c.type})</li>
                    ))}
                  </ul>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    Giá trị không hợp lệ sẽ được chuyển thành null và bỏ qua khi tính toán.
                  </div>
                </div>
              }
            />
          )}

          {previewData && (
            <>
              <div style={{ fontWeight: 500 }}>Cấu hình cột ({editingColumns.length} cột)</div>
              <Table
                size="small"
                dataSource={editingColumns}
                rowKey="name"
                pagination={false}
                scroll={{ y: 200 }}
                columns={[
                  { 
                    title: 'Tên cột', dataIndex: 'name', width: 150,
                    render: (v: string, record: ColumnDef) => (
                      <span>
                        {v}
                        {record.mixedData && <WarningOutlined style={{ color: '#faad14', marginLeft: 4 }} />}
                      </span>
                    ),
                  },
                  {
                    title: 'Tên hiển thị', dataIndex: 'displayName', width: 150,
                    render: (v, _, idx) => (
                      <Input size="small" value={v} onChange={(e) => {
                        const newCols = [...editingColumns];
                        newCols[idx].displayName = e.target.value;
                        setEditingColumns(newCols);
                      }} />
                    ),
                  },
                  {
                    title: 'Kiểu dữ liệu', dataIndex: 'type', width: 120,
                    render: (v, _, idx) => (
                      <Select size="small" value={v} style={{ width: 100 }} onChange={(val) => {
                        const newCols = [...editingColumns];
                        newCols[idx].type = val;
                        setEditingColumns(newCols);
                      }}>
                        <Select.Option value="text">Text</Select.Option>
                        <Select.Option value="number">Number</Select.Option>
                        <Select.Option value="date">Date</Select.Option>
                      </Select>
                    ),
                  },
                ]}
              />
              <div style={{ fontWeight: 500, marginTop: 8 }}>Preview dữ liệu ({previewData.totalRows?.toLocaleString() || previewData.preview.length} dòng)</div>
              <div style={{ overflow: 'auto', maxHeight: 300 }}>
                <Table
                  size="small"
                  dataSource={previewData.preview}
                  rowKey={(record) => JSON.stringify(record).slice(0, 50)}
                  pagination={{ pageSize: 10, size: 'small', showSizeChanger: false }}
                  scroll={{ x: 'max-content' }}
                  columns={editingColumns.map((c) => ({ 
                    title: c.displayName, 
                    dataIndex: c.name, 
                    key: c.name, 
                    ellipsis: true,
                    width: 120,
                    render: (v: any) => {
                      if (v === null || v === undefined) return <span style={{ color: '#ccc' }}>-</span>;
                      if (c.type === 'number') return Number(v).toLocaleString('vi-VN');
                      if (c.type === 'date') return new Date(v).toLocaleDateString('vi-VN');
                      return String(v);
                    },
                  }))}
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Preview Data Modal */}
      <Modal
        title={`Dữ liệu: ${selectedDataset?.ten}`}
        open={previewModal}
        onCancel={() => { setPreviewModal(false); setPreviewPage(1); }}
        footer={null}
        width={1000}
      >
        {previewDataset && selectedDataset && (
          <>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#666' }}>
                Tổng: <strong>{previewDataset.total.toLocaleString()}</strong> dòng, {selectedDataset.columns.length} cột
              </span>
            </div>
            <Table
              size="small"
              dataSource={previewDataset.data}
              rowKey={(record) => JSON.stringify(record).slice(0, 50)}
              loading={previewLoading}
              pagination={{
                current: previewPage,
                pageSize: 100,
                total: previewDataset.total,
                showSizeChanger: false,
                showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
                onChange: handlePreviewPageChange,
              }}
              scroll={{ x: 'max-content', y: 500 }}
              columns={selectedDataset.columns.map((c) => ({
                title: c.displayName,
                dataIndex: c.name,
                key: c.name,
                width: 130,
                ellipsis: true,
                render: (v: any) => {
                  if (v === null || v === undefined) return <span style={{ color: '#ccc' }}>-</span>;
                  if (c.type === 'number') return Number(v).toLocaleString('vi-VN');
                  if (c.type === 'date') return new Date(v).toLocaleDateString('vi-VN');
                  return String(v);
                },
              }))}
            />
          </>
        )}
      </Modal>
    </MainLayout>
  );
}
