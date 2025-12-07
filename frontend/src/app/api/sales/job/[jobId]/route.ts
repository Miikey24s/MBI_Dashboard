import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const userId = req.nextUrl.searchParams.get('userId');
  const userName = req.nextUrl.searchParams.get('userName');

  try {
    let url = `${API_BASE_URL}/sales/job/${jobId}`;
    const queryParams = [];
    if (userId) queryParams.push(`userId=${userId}`);
    if (userName) queryParams.push(`userName=${encodeURIComponent(userName)}`);
    if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

    const res = await fetch(url, { method: 'DELETE' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[api/sales/job] DELETE failed', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
