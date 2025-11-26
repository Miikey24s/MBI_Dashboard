'use client';

import { ChangeEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { useLanguage } from '@/providers/LanguageProvider';
import { API_BASE_URL, TENANT_ID } from '@/lib/config';

const ExcelUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const responseMessage =
        typeof error.response?.data === 'object' && error.response?.data !== null
          ? (error.response.data as { message?: string }).message
          : undefined;
      return responseMessage || error.message || fallback;
    }
    if (error instanceof Error) {
      return error.message || fallback;
    }
    return fallback;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus(null);
      toast.info(`${t.uploadTitle}: ${e.target.files[0].name}`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: t.selectFile });
      toast.error(t.selectFile);
      return;
    }

    setUploading(true);
    setStatus({ type: 'info', message: t.uploading });
    toast.info(t.uploading);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenantId', TENANT_ID);

    try {
      const response = await axios.post(`${API_BASE_URL}/sales/upload-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { recordCount, workflowId } = response.data;

      if (recordCount === 0) {
        setStatus({ 
          type: 'error', 
          message: t.noRecords 
        });
        toast.error(t.noRecords);
      } else {
        const successMsg = `${t.success} (ID: ${workflowId}). Processing ${recordCount} records...`;
        setStatus({ 
          type: 'success', 
          message: successMsg
        });
        toast.success(successMsg);

        setFile(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Wait a bit before refreshing to let the user see the message
        setTimeout(() => {
          router.refresh();
        }, 2000);
      }
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      const errorMsg = getErrorMessage(error, t.checkConsole);
      setStatus({ 
        type: 'error', 
        message: errorMsg
      });
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t.deleteConfirm)) return;

    setDeleting(true);
    setStatus({ type: 'info', message: t.deleting });
    toast.info(t.deleting);
    try {
      console.log('Deleting data...');
      await axios.delete(`${API_BASE_URL}/sales?tenantId=${TENANT_ID}`);
      toast.success(t.deleteSuccess);
      setStatus({ type: 'success', message: t.deleteSuccess });
      
      // Refresh the page to update the chart
      router.refresh();
    } catch (error: unknown) {
      console.error('Delete failed:', error);
      const errorMsg = getErrorMessage(error, t.deleteError);
      toast.error(errorMsg);
      setStatus({ type: 'error', message: errorMsg });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t.uploadTitle}</h2>
        <button
          onClick={handleDelete}
          disabled={deleting || uploading}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            deleting || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              : 'text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800'
          }`}
        >
          {deleting ? t.deleting : t.delete}
        </button>
      </div>
      
      {/* Status Message */}
      {status && (
        <div className={`mb-4 p-4 rounded-md ${
          status.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' :
          status.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100' :
          'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
        }`}>
          {status.message}
        </div>
      )}

      <div className="flex items-center gap-4">
        <input
          id="file-upload"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            dark:file:bg-blue-900 dark:file:text-blue-100
            hover:file:bg-blue-100 dark:hover:file:bg-blue-800
          "
        />
        <button
          onClick={handleUpload}
          disabled={uploading || !file || deleting}
          className={`px-6 py-2 rounded-full font-semibold text-white transition-colors ${
            uploading || !file || deleting
              ? 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          {uploading ? t.uploading : t.upload}
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {t.supportedFormats}
      </p>
    </div>
  );
};

export default ExcelUpload;
