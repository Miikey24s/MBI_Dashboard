import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  try {
    const res = await fetch(`${API_BASE_URL}/sales/job/${jobId}/restore`, { method: 'POST' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[api/sales/job/restore] POST failed', error);
    return NextResponse.json({ error: 'Failed to restore' }, { status: 500 });
  }
}
