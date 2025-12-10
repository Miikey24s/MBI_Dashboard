'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Upload, Download, Trash2, Loader2, CheckCircle, XCircle, History, RotateCcw, Trash, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTenant } from '@/providers/TenantProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';

type Department = {
  id: string;
  name: string;
  code: string;
  isActive?: boolean;
};

type ExcelUploadProps = {
  selectedDepartmentId?: string;
  departments?: Department[];
  onDataChange?: () => void;
};

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

type UploadHistoryItem = {
  id: string;
  fileName: string;
  status: string;
  recordCount: number;
  departmentId: string | null;
  departmentName: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  createdAt: string;
};

type TrashItem = UploadHistoryItem & {
  deletedAt: string;
  deletedByName: string | null;
  daysLeft: number;
};

const API_ROUTES = {
  upload: '/api/sales/upload-excel',
  sales: '/api/sales',
  downloadTemplate: '/api/sales/download-template',
  uploadHistory: '/api/sales/upload-history',
  trash: '/api/sales/trash',
  departments: '/api/departments',
} as const;

const ExcelUpload = ({ selectedDepartmentId, departments = [], onDataChange }: ExcelUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ recordCount: number; duration: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const router = useRouter();
  const { t } = useLanguage();
  const { tenantId } = useTenant();
  const { user } = useAuth();

  const activeTenantId = user?.tenantId || tenantId;
  const isAdmin = user?.roles?.includes('Admin');
  const isSuperAdmin = user?.roles?.includes('Super Admin');

  // Lấy departmentId: Admin dùng từ props, user thường dùng từ account
  const activeDepartmentId = isAdmin ? selectedDepartmentId : user?.departmentId;

  useEffect(() => {
    setIsReady(true);
    loadUploadHistory();
    if (isAdmin) loadTrash();
  }, [activeTenantId, activeDepartmentId, isAdmin]);

  const loadUploadHistory = async () => {
    try {
      // Lọc theo phòng ban đang chọn (hoặc phòng ban của user)
      let url = `${API_ROUTES.uploadHistory}?tenantId=${activeTenantId}`;
      if (activeDepartmentId) {
        url += `&departmentId=${activeDepartmentId}`;
      }
      const response = await axios.get(url);
      setUploadHistory(response.data);
    } catch (error) {
      console.error('Failed to load upload history:', error);
    }
  };

  const loadTrash = async () => {
    try {
      const response = await axios.get(`${API_ROUTES.trash}?tenantId=${activeTenantId}`);
      setTrashItems(response.data);
    } catch (error) {
      console.error('Failed to load trash:', error);
    }
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_NETWORK') return t.backendError;
      const responseMessage = error.response?.data?.message || error.response?.data?.error;
      return responseMessage || error.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error(t.selectFile);
      return;
    }

    // Department is required for upload
    if (!activeDepartmentId) {
      toast.error(t.selectDepartmentRequired || 'Vui lòng chọn phòng ban');
      return;
    }

    setUploadStatus('uploading');
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenantId', activeTenantId);
    formData.append('departmentId', activeDepartmentId);
    if (user?.id) formData.append('uploadedById', user.id);
    if (user?.fullName) formData.append('uploadedByName', user.fullName);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 80));
      }, 200);

      const response = await axios.post(API_ROUTES.upload, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });

      clearInterval(progressInterval);
      setProgress(90);

      const { recordCount, duration, error } = response.data;

      if (error) {
        setUploadStatus('error');
        toast.error(error);
        return;
      }

      if (recordCount === 0) {
        setUploadStatus('error');
        toast.error(t.noRecords);
        return;
      }

      setProgress(100);
      setUploadStatus('success');
      setUploadResult({ recordCount, duration });
      toast.success(`Import thành công ${recordCount} records trong ${duration}`);

      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload history
      loadUploadHistory();

      // Trigger parent to refresh data
      if (onDataChange) {
        setTimeout(() => {
          onDataChange();
        }, 1000);
      }
    } catch (error) {
      setUploadStatus('error');
      toast.error(getErrorMessage(error, t.checkConsole));
    }
  };

  // Soft delete - chuyển vào thùng rác
  const handleDeleteJob = async (jobId: string) => {
    const confirmMsg = t.confirmMoveToTrash || 'Chuyển file này vào thùng rác?';
    if (!confirm(confirmMsg)) return;

    try {
      let url = `/api/sales/job/${jobId}`;
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id);
      if (user?.fullName) params.append('userName', user.fullName);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.delete(url);
      
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }
      
      toast.success(t.movedToTrash || 'Đã chuyển vào thùng rác');
      loadUploadHistory();
      if (isAdmin) loadTrash();
      // Refresh dashboard để ẩn dữ liệu đã xóa
      if (onDataChange) {
        setTimeout(() => {
          onDataChange();
        }, 500);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t.deleteError));
    }
  };

  // Soft delete hàng loạt - chuyển vào thùng rác
  const handleDeleteBulk = async (scope: 'department' | 'tenant' | 'all') => {
    let confirmMsg = '';
    if (scope === 'department') {
      confirmMsg = t.confirmDeleteDepartment || 'Chuyển tất cả dữ liệu phòng ban này vào thùng rác?';
    } else if (scope === 'tenant') {
      confirmMsg = t.confirmDeleteTenant || 'Chuyển tất cả dữ liệu công ty vào thùng rác?';
    } else {
      confirmMsg = t.deleteAllConfirm || 'Chuyển TẤT CẢ dữ liệu vào thùng rác?';
    }
    
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    try {
      let url = `${API_ROUTES.sales}?tenantId=${scope === 'all' ? 'all' : activeTenantId}`;
      if (scope === 'department' && activeDepartmentId) {
        url += `&departmentId=${activeDepartmentId}`;
      }
      if (user?.id) url += `&userId=${user.id}`;
      if (user?.fullName) url += `&userName=${encodeURIComponent(user.fullName)}`;
      // Gửi flag Super Admin khi xóa tất cả
      if (scope === 'all' && isSuperAdmin) {
        url += '&isSuperAdmin=true';
      }
      
      const response = await axios.delete(url);
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }
      toast.success(t.movedToTrash || 'Đã chuyển vào thùng rác');
      loadUploadHistory();
      if (isAdmin) loadTrash();
      // Refresh dashboard
      if (onDataChange) {
        setTimeout(() => {
          onDataChange();
        }, 500);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t.deleteError));
    } finally {
      setDeleting(false);
    }
  };

  // Khôi phục từ thùng rác
  const handleRestore = async (jobId: string) => {
    try {
      const response = await axios.post(`/api/sales/job/${jobId}/restore`);
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }
      toast.success(t.restored || 'Đã khôi phục');
      loadUploadHistory();
      loadTrash();
      // Refresh dashboard để hiển thị lại dữ liệu
      if (onDataChange) {
        setTimeout(() => {
          onDataChange();
        }, 500);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t.deleteError));
    }
  };

  // Xóa vĩnh viễn
  const handlePermanentDelete = async (jobId: string) => {
    const confirmMsg = t.confirmPermanentDelete || 'Xóa vĩnh viễn? Hành động này không thể hoàn tác!';
    if (!confirm(confirmMsg)) return;

    try {
      const response = await axios.delete(`/api/sales/job/${jobId}/permanent`);
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }
      toast.success(t.permanentlyDeleted || 'Đã xóa vĩnh viễn');
      loadTrash();
    } catch (error) {
      toast.error(getErrorMessage(error, t.deleteError));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(API_ROUTES.downloadTemplate, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template đã tải xuống!');
    } catch {
      toast.error('Không thể tải template');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUploading = uploadStatus === 'uploading' || uploadStatus === 'processing';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* File Input Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full">
              <label
                htmlFor="file-upload"
                className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploading
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                }`}
              >
                <Upload className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {file ? file.name : 'Chọn file Excel (.xlsx, .xls)'}
                </span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleUpload}
                disabled={isUploading || !file || !isReady}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? 'Đang xử lý...' : 'Upload'}
              </button>

              <button
                onClick={handleDownloadTemplate}
                disabled={!isReady || isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 dark:bg-green-900/50 dark:text-green-400 dark:hover:bg-green-900 disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Template
              </button>

              <button
                onClick={() => { setShowHistory(!showHistory); setShowTrash(false); }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showHistory
                    ? 'text-blue-700 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <History className="w-4 h-4" />
                {t.uploadHistory || 'Lịch sử'}
              </button>

              {/* Trash button - Admin only */}
              {isAdmin && (
                <button
                  onClick={() => { setShowTrash(!showTrash); setShowHistory(false); }}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    showTrash
                      ? 'text-orange-700 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400'
                      : 'text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Trash className="w-4 h-4" />
                  {t.trash || 'Thùng rác'}
                  {trashItems.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                      {trashItems.length}
                    </span>
                  )}
                </button>
              )}

              {/* Delete buttons - Admin only */}
              {isAdmin && (
                <div className="relative group">
                  <button
                    disabled={deleting || !isReady || isUploading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {t.delete || 'Xóa'}
                  </button>
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 hidden group-hover:block">
                    {activeDepartmentId && (
                      <button
                        onClick={() => handleDeleteBulk('department')}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {t.deleteByDepartment || 'Xóa phòng ban này'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteBulk('tenant')}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {t.deleteByTenant || 'Xóa toàn bộ công ty'}
                    </button>
                    {/* Chỉ Super Admin mới được xóa tất cả tenant */}
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteBulk('all')}
                        className="w-full px-4 py-2 text-left text-sm text-red-700 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-200 dark:border-gray-700"
                      >
                        {t.deleteAll || 'Xóa TẤT CẢ (nguy hiểm)'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadStatus === 'uploading' ? 'Đang upload...' : 'Đang xử lý...'}
                </span>
                <span className="text-sm font-medium text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === 'success' && uploadResult && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Import thành công {uploadResult.recordCount} records trong {uploadResult.duration}
              </span>
            </div>
          )}

          {/* Error Message */}
          {uploadStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-400">
                Upload thất bại. Vui lòng thử lại.
              </span>
            </div>
          )}


          {/* Upload History */}
          {showHistory && (
            <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t.uploadHistory || 'Lịch sử upload'}
              </h4>
              {uploadHistory.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.noUploadHistory || 'Chưa có lịch sử upload'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 font-medium">{t.fileName || 'Tên file'}</th>
                        <th className="pb-2 font-medium">{t.department || 'Phòng ban'}</th>
                        <th className="pb-2 font-medium">{t.uploadedBy || 'Người upload'}</th>
                        <th className="pb-2 font-medium">{t.records || 'Số bản ghi'}</th>
                        <th className="pb-2 font-medium">{t.status || 'Trạng thái'}</th>
                        <th className="pb-2 font-medium">{t.time || 'Thời gian'}</th>
                        <th className="pb-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadHistory.map((item) => {
                        // Kiểm tra quyền xóa: Admin hoặc người upload
                        const canDelete = isAdmin || item.uploadedById === user?.id;
                        
                        return (
                          <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 text-gray-900 dark:text-white">{item.fileName}</td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">
                              {item.departmentName || '-'}
                            </td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">
                              {item.uploadedByName || '-'}
                            </td>
                            <td className="py-2 text-gray-600 dark:text-gray-400">
                              {item.recordCount.toLocaleString()}
                            </td>
                            <td className="py-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  item.status === 'SUCCESS'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                                    : item.status === 'FAILED'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
                                }`}
                              >
                                {item.status === 'SUCCESS' ? (t.success || 'Thành công') : 
                                 item.status === 'FAILED' ? (t.failed || 'Thất bại') : 
                                 (t.processing || 'Đang xử lý')}
                              </span>
                            </td>
                            <td className="py-2 text-gray-500 dark:text-gray-400">
                              {formatDate(item.createdAt)}
                            </td>
                            <td className="py-2">
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteJob(item.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  title={t.delete || 'Xóa'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Trash Section - Admin only */}
          {showTrash && isAdmin && (
            <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Trash className="w-4 h-4 text-orange-500" />
                  {t.trash || 'Thùng rác'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {t.autoDeleteNote || 'Các mục sẽ tự động xóa sau 30 ngày'}
                </p>
              </div>
              
              {trashItems.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.noTrashItems || 'Thùng rác trống'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 font-medium">{t.fileName || 'Tên file'}</th>
                        <th className="pb-2 font-medium">{t.department || 'Phòng ban'}</th>
                        <th className="pb-2 font-medium">{t.uploadedBy || 'Người upload'}</th>
                        <th className="pb-2 font-medium">{t.records || 'Số bản ghi'}</th>
                        <th className="pb-2 font-medium">{t.time || 'Thời gian xóa'}</th>
                        <th className="pb-2 font-medium">{t.daysLeft || 'Còn lại'}</th>
                        <th className="pb-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {trashItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 text-gray-900 dark:text-white">{item.fileName}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">
                            {item.departmentName || '-'}
                          </td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">
                            {item.uploadedByName || '-'}
                          </td>
                          <td className="py-2 text-gray-600 dark:text-gray-400">
                            {item.recordCount.toLocaleString()}
                          </td>
                          <td className="py-2 text-gray-500 dark:text-gray-400">
                            {formatDate(item.deletedAt)}
                          </td>
                          <td className="py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.daysLeft <= 7
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                                : item.daysLeft <= 14
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {item.daysLeft} {t.daysLeft || 'ngày'}
                            </span>
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRestore(item.id)}
                                className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title={t.restore || 'Khôi phục'}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(item.id)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title={t.deletePermanently || 'Xóa vĩnh viễn'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelUpload;
