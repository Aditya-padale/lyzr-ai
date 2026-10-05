import { NextRequest, NextResponse } from 'next/server';
import { getProjectDir } from '@/lib/project-config';
import { EvaluationService } from '@/lib/eval-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commitA = searchParams.get('commitA');
    const commitB = searchParams.get('commitB');

    if (!commitA || !commitB) {
      return NextResponse.json({ error: 'commitA and commitB parameters are required' }, { status: 400 });
    }

    const projectDir = getProjectDir();
    const evalService = new EvaluationService(projectDir);
    const comparison = evalService.compareVersions(commitA, commitB);

    return NextResponse.json({ comparison, repoDir: projectDir });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to compare versions' }, { status: 500 });
  }
}
