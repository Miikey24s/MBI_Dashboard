'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/providers/AuthProvider';
import { useTenant } from '@/providers/TenantProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { Header } from '@/components/Header';
import {
  DashboardContent,
  DashboardSkeleton,
  DashboardHeader,
} from '@/components/dashboard';
import ExcelUpload from '@/components/ExcelUpload';
import {
  fetchOverview,
  fetchSalesByDate,
  fetchSalesBySource,
  fetchSalesByMonth,
  fetchRecentSales,
  fetchEtlJobs,
  OverviewData,
  SalesByDate,
  SalesBySource,
  SalesByMonth,
  SalesRecord,
  EtlJob,
} from '@/lib/api';
import { Loader2, Building2, FileText } from 'lucide-react';

type Department = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

function DashboardDataLoader({
  tenantId,
  departmentId,
  fileId,
  errorTitle,
  refreshKey,
}: {
  tenantId: string;
  departmentId?: string;
  fileId?: string;
  errorTitle: string;
  refreshKey?: number;
}) {
  const [data, setData] = useState<{
    overview: OverviewData;
    salesByDate: SalesByDate[];
    salesBySource: SalesBySource[];
    salesByMonth: SalesByMonth[];
    recentSales: SalesRecord[];
    etlJobs: EtlJob[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overview, salesByDate, salesBySource, salesByMonth, recentSales, etlJobs] =
          await Promise.all([
            fetchOverview(tenantId, departmentId, fileId),
            fetchSalesByDate(tenantId, departmentId, fileId),
            fetchSalesBySource(tenantId, departmentId, fileId),
            fetchSalesByMonth(tenantId, departmentId, fileId),
            fetchRecentSales(tenantId, departmentId, 10),
            fetchEtlJobs(tenantId, departmentId, 5),
          ]);

        setData({ overview, salesByDate, salesBySource, salesByMonth, recentSales, etlJobs });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Cannot load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantId, departmentId, fileId, refreshKey]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{errorTitle}</h3>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <DashboardContent
      overview={data.overview}
      salesByDate={data.salesByDate}
      salesBySource={data.salesBySource}
      salesByMonth={data.salesByMonth}
      recentSales={data.recentSales}
      etlJobs={data.etlJobs}
    />
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const activeTenantId = user?.tenantId || tenantId;
  const isAdmin = user?.roles?.includes('Admin');

  const handleDataRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    loadUploadHistory();
  };

  const loadUploadHistory = async () => {
    try {
      let url = `/api/sales/upload-history?tenantId=${activeTenantId}`;
      if (selectedDepartmentId) url += `&departmentId=${selectedDepartmentId}`;
      const response = await axios.get(url);
      setUploadHistory(response.data);
    } catch (error) {
      console.error('Failed to load upload history:', error);
    }
  };


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load departments
  useEffect(() => {
    if (activeTenantId) {
      axios
        .get(`/api/departments?tenantId=${activeTenantId}`)
        .then((res) => {
          const activeDepts = res.data.filter((d: Department) => d.isActive);
          setDepartments(activeDepts);
        })
        .catch((err) => console.error('Failed to load departments:', err));
    }
  }, [activeTenantId]);

  // Load upload history
  useEffect(() => {
    if (activeTenantId) {
      loadUploadHistory();
    }
  }, [activeTenantId, selectedDepartmentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // User thường: chỉ xem phòng ban của mình
  // Admin: xem tất cả hoặc chọn phòng ban
  const activeDepartmentId = isAdmin ? selectedDepartmentId || undefined : user?.departmentId;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <DashboardHeader />

          <div className="mb-6">
            <ExcelUpload
              selectedDepartmentId={activeDepartmentId}
              departments={departments}
              onDataChange={handleDataRefresh}
            />
          </div>

          {/* Filters */}
          <div className="mb-4 space-y-3">
            {/* Department Filter for Admin */}
            {isAdmin && (
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Building2 className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t.filterByDepartment}:</span>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    setSelectedFileId(''); // Reset file filter
                  }}
                  className="flex-1 max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">{t.allDepartments}</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* File Filter */}
            {uploadHistory.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t.filterByFile}:</span>
                <select
                  value={selectedFileId}
                  onChange={(e) => setSelectedFileId(e.target.value)}
                  className="flex-1 max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">{t.allFiles}</option>
                  {uploadHistory.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.fileName} - {new Date(file.createdAt).toLocaleDateString()} ({file.recordCount} {t.records})
                    </option>
                  ))}
                </select>
                {selectedFileId && (
                  <button
                    onClick={() => setSelectedFileId('')}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    ✕ {t.clear}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Show current department for non-admin */}
          {!isAdmin && user?.departmentName && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-blue-700 dark:text-blue-400">
                {t.department}: <strong>{user.departmentName}</strong>
              </span>
            </div>
          )}

          <DashboardDataLoader
            tenantId={activeTenantId}
            departmentId={activeDepartmentId}
            fileId={selectedFileId}
            errorTitle={t.cannotLoadData}
            refreshKey={refreshKey}
          />
        </main>
      </div>
    </>
  );
}
