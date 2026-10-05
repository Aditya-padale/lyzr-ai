import { NextRequest, NextResponse } from 'next/server';
import { getProjectDir } from '@/lib/project-config';
import { GitService } from '@/lib/git-service';

export async function GET(req: NextRequest) {
  try {
    const projectDir = getProjectDir();
    const gitService = new GitService(projectDir);
    const { searchParams } = new URL(req.url);
    const commitA = searchParams.get('commitA');
    const commitB = searchParams.get('commitB');

    if (commitA && commitB) {
      const diffs = gitService.getDiffBetweenCommits(commitA, commitB);
      return NextResponse.json({ diffs, repoDir: projectDir });
    }

    const diffs = gitService.getUncommittedDiff();
    return NextResponse.json({ diffs, repoDir: projectDir });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch diff' }, { status: 500 });
  }
}
