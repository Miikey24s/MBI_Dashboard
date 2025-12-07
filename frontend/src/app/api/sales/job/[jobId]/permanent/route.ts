import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  try {
    const res = await fetch(`${API_BASE_URL}/sales/job/${jobId}/permanent`, { method: 'DELETE' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[api/sales/job/permanent] DELETE failed', error);
    return NextResponse.json({ error: 'Failed to permanently delete' }, { status: 500 });
  }
}
