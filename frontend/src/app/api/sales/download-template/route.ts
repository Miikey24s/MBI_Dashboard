import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

const DOWNLOAD_TEMPLATE_URL = `${API_BASE_URL}/sales/download-template`;

export async function GET() {
  try {
    const res = await fetch(DOWNLOAD_TEMPLATE_URL, { cache: 'no-store' });
    
    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const blob = await res.blob();
    
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=sales-import-template.xlsx',
      },
    });
  } catch (error) {
    console.error('[api/sales/download-template] GET failed', error);
    return NextResponse.json({ error: 'Failed to download template' }, { status: 500 });
  }
}
