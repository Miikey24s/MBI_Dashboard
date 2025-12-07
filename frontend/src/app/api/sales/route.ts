import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, TENANT_ID } from '@/lib/config';

const SALES_URL = `${API_BASE_URL}/sales`;

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? TENANT_ID;

  try {
    const res = await fetch(`${SALES_URL}?tenantId=${tenantId}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[api/sales] GET failed', error);
    return NextResponse.json({ error: 'Failed to load sales data' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? TENANT_ID;
  const departmentId = req.nextUrl.searchParams.get('departmentId');
  const jobId = req.nextUrl.searchParams.get('jobId');
  const userId = req.nextUrl.searchParams.get('userId');

  try {
    let url: string;
    if (jobId) {
      // Xóa theo job ID
      url = `${SALES_URL}/job/${jobId}`;
      if (userId) url += `?userId=${userId}`;
    } else {
      // Xóa theo tenant/department
      url = `${SALES_URL}?tenantId=${tenantId}`;
      if (departmentId) url += `&departmentId=${departmentId}`;
    }

    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[api/sales] DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete sales data' }, { status: 500 });
  }
}
