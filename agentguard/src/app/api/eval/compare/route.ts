import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { EvaluationService } from '@/lib/eval-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commitA = searchParams.get('commitA');
    const commitB = searchParams.get('commitB');

    if (!commitA || !commitB) {
      return NextResponse.json({ error: 'Both commitA and commitB parameters are required' }, { status: 400 });
    }

    const evalService = new EvaluationService(PROJECT_DIR);
    const comparison = evalService.compareVersions(commitA, commitB);

    return NextResponse.json({ comparison });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to compare versions' }, { status: 500 });
  }
}
