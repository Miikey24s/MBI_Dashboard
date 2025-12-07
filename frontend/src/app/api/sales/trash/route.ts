import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, TENANT_ID } from '@/lib/config';

const TRASH_URL = `${API_BASE_URL}/sales/trash`;

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? TENANT_ID;

  try {
    const res = await fetch(`${TRASH_URL}?tenantId=${tenantId}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[api/sales/trash] GET failed', error);
    return NextResponse.json({ error: 'Failed to load trash' }, { status: 500 });
  }
}
