import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, TENANT_ID } from '@/lib/config';

const UPLOAD_HISTORY_URL = `${API_BASE_URL}/sales/upload-history`;

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? TENANT_ID;
  const departmentId = req.nextUrl.searchParams.get('departmentId');

  try {
    let url = `${UPLOAD_HISTORY_URL}?tenantId=${tenantId}`;
    if (departmentId) {
      url += `&departmentId=${departmentId}`;
    }
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[api/sales/upload-history] GET failed', error);
    return NextResponse.json({ error: 'Failed to load upload history' }, { status: 500 });
  }
}
