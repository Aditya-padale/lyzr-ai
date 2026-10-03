import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { GitAgentService } from '@/lib/gitagent-service';
import { GitService } from '@/lib/git-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function GET() {
  try {
    const gitAgentService = new GitAgentService(PROJECT_DIR);
    const gitService = new GitService(PROJECT_DIR);

    const config = gitAgentService.getAgentConfig();
    const files = gitAgentService.getAgentFiles();
    const currentCommitHash = gitService.getCurrentCommitHash();
    const commits = gitService.getCommits();
    const uncommittedDiffs = gitService.getUncommittedDiff();

    return NextResponse.json({
      config,
      files,
      currentCommitHash,
      currentCommit: commits.find(c => c.isCurrent) || commits[0] || null,
      hasUncommittedChanges: uncommittedDiffs.length > 0,
      uncommittedDiffs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch agent details' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath, content } = body;

    if (!filePath || content === undefined) {
      return NextResponse.json({ error: 'filePath and content are required' }, { status: 400 });
    }

    const gitAgentService = new GitAgentService(PROJECT_DIR);
    gitAgentService.saveAgentFile(filePath, content);

    const gitService = new GitService(PROJECT_DIR);
    const uncommittedDiffs = gitService.getUncommittedDiff();

    return NextResponse.json({
      success: true,
      message: `Updated ${filePath}`,
      uncommittedDiffs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save file' }, { status: 500 });
  }
}
