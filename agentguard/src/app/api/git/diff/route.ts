import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { GitService } from '@/lib/git-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function GET(req: NextRequest) {
  try {
    const gitService = new GitService(PROJECT_DIR);
    const { searchParams } = new URL(req.url);
    const commitA = searchParams.get('commitA');
    const commitB = searchParams.get('commitB');

    if (commitA && commitB) {
      const diffs = gitService.getDiffBetweenCommits(commitA, commitB);
      return NextResponse.json({ diffs });
    }

    const diffs = gitService.getUncommittedDiff();
    return NextResponse.json({ diffs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch diff' }, { status: 500 });
  }
}
