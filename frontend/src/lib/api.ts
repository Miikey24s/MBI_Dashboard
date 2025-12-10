const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface OverviewData {
  totalRevenue: number;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  growthRate: number;
  recordCount: number;
  etlJobCount: number;
}

export interface SalesByDate {
  date: string;
  total: number;
  count: number;
}

export interface SalesBySource {
  source: string;
  total: number;
  count: number;
}

export interface SalesByMonth {
  month: number;
  total: number;
  count: number;
}

export interface SalesRecord {
  id: string;
  amount: number;
  date: string;
  source: string;
  tenantId: string;
}

export interface EtlJob {
  id: string;
  workflowId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  fileName: string;
  createdAt: string;
  tenantId: string;
}

// Dashboard APIs
export async function fetchOverview(tenantId: string, departmentId?: string, fileId?: string): Promise<OverviewData> {
  let url = `${API_BASE_URL}/dashboard/overview?tenantId=${tenantId}`;
  if (departmentId) url += `&departmentId=${departmentId}`;
  if (fileId) url += `&fileId=${fileId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch overview');
  return res.json();
}

export async function fetchSalesByDate(tenantId: string, departmentId?: string, fileId?: string, startDate?: string, endDate?: string): Promise<SalesByDate[]> {
  let url = `${API_BASE_URL}/dashboard/sales-by-date?tenantId=${tenantId}`;
  if (departmentId) url += `&departmentId=${departmentId}`;
  if (fileId) url += `&fileId=${fileId}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sales by date');
  return res.json();
}

export async function fetchSalesBySource(tenantId: string, departmentId?: string, fileId?: string): Promise<SalesBySource[]> {
  let url = `${API_BASE_URL}/dashboard/sales-by-source?tenantId=${tenantId}`;
  if (departmentId) url += `&departmentId=${departmentId}`;
  if (fileId) url += `&fileId=${fileId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sales by source');
  return res.json();
}

export async function fetchSalesByMonth(tenantId: string, departmentId?: string, fileId?: string, year?: number): Promise<SalesByMonth[]> {
  let url = `${API_BASE_URL}/dashboard/sales-by-month?tenantId=${tenantId}`;
  if (departmentId) url += `&departmentId=${departmentId}`;
  if (fileId) url += `&fileId=${fileId}`;
  if (year) url += `&year=${year}`;
  
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sales by month');
  return res.json();
}

export async function fetchRecentSales(tenantId: string, departmentId?: string, limit = 10): Promise<SalesRecord[]> {
  let url = `${API_BASE_URL}/dashboard/recent-sales?tenantId=${tenantId}&limit=${limit}`;
  if (departmentId) url += `&departmentId=${departmentId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch recent sales');
  return res.json();
}

export async function fetchTopSales(tenantId: string, departmentId?: string, limit = 10): Promise<SalesRecord[]> {
  let url = `${API_BASE_URL}/dashboard/top-sales?tenantId=${tenantId}&limit=${limit}`;
  if (departmentId) url += `&departmentId=${departmentId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch top sales');
  return res.json();
}

export async function fetchEtlJobs(tenantId: string, departmentId?: string, limit = 10): Promise<EtlJob[]> {
  let url = `${API_BASE_URL}/dashboard/etl-jobs?tenantId=${tenantId}&limit=${limit}`;
  if (departmentId) url += `&departmentId=${departmentId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch ETL jobs');
  return res.json();
}

// Sales APIs (existing)
export async function fetchAllSales(tenantId: string): Promise<SalesRecord[]> {
  const res = await fetch(`${API_BASE_URL}/sales?tenantId=${tenantId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}
