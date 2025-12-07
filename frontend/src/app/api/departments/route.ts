import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, TENANT_ID } from '@/lib/config';

const DEPARTMENTS_URL = `${API_BASE_URL}/departments`;

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? TENANT_ID;
  const authHeader = req.headers.get('authorization');

  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(`${DEPARTMENTS_URL}?tenantId=${tenantId}`, {
      cache: 'no-store',
      headers,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[api/departments] GET failed', error);
    return NextResponse.json({ error: 'Failed to load departments' }, { status: 500 });
  }
}
