'use client';

import { FileSpreadsheet, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  title?: string;
  description?: string;
  showUploadHint?: boolean;
}

export function EmptyState({
  title = 'Chưa có dữ liệu',
  description = 'Hãy upload file Excel để bắt đầu phân tích doanh thu',
  showUploadHint = true,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <FileSpreadsheet className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {description}
          </p>
          {showUploadHint && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Upload className="w-4 h-4" />
              <span>Sử dụng form upload ở trên để thêm dữ liệu</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
