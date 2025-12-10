'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/providers/LanguageProvider';

interface ExportButtonProps {
  tenantId: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}

export function ExportButton({ tenantId, departmentId, startDate, endDate }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { t } = useLanguage();

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    setShowMenu(false);

    try {
      const params = new URLSearchParams({ tenantId });
      if (departmentId) params.append('departmentId', departmentId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('format', format);

      const response = await fetch(`/api/sales/export?${params.toString()}`);
      
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t.exportSuccess || 'Export successful!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t.exportError || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={exporting}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {t.export || 'Export'}
      </button>

      {showMenu && !exporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <button
            onClick={() => handleExport('excel')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Export PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
