import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { GitService } from '@/lib/git-service';
import { EvaluationService } from '@/lib/eval-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetCommitHash, rerunTests = true } = body;

    if (!targetCommitHash) {
      return NextResponse.json({ error: 'targetCommitHash is required' }, { status: 400 });
    }

    const gitService = new GitService(PROJECT_DIR);
    const restoreResult = gitService.restoreToCommit(targetCommitHash);

    if (!restoreResult.success) {
      return NextResponse.json({ error: restoreResult.error || 'Rollback failed' }, { status: 400 });
    }

    let newTestRun = null;
    if (rerunTests) {
      const evalService = new EvaluationService(PROJECT_DIR);
      newTestRun = await evalService.runTestSuite();
    }

    const commits = gitService.getCommits();

    return NextResponse.json({
      success: true,
      restoredCommitHash: targetCommitHash,
      newCommitHash: restoreResult.newCommitHash,
      commits,
      testRun: newTestRun,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Rollback failed' }, { status: 500 });
  }
}
