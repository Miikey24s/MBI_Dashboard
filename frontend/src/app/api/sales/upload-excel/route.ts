import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, TENANT_ID } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const tenantId = (formData.get('tenantId') as string) || TENANT_ID;
    formData.set('tenantId', tenantId);

    const res = await fetch(`${API_BASE_URL}/sales/upload-excel`, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'content-type': contentType || 'text/plain' },
    });
  } catch (error) {
    console.error('[api/sales/upload-excel] POST failed', error);
    return NextResponse.json({ error: 'Failed to upload Excel file' }, { status: 500 });
  }
}
