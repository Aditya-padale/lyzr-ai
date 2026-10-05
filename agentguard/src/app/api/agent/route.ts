import { NextRequest, NextResponse } from 'next/server';
import { getProjectDir } from '@/lib/project-config';
import { GitAgentService } from '@/lib/gitagent-service';
import { GitService } from '@/lib/git-service';

export async function GET() {
  try {
    const projectDir = getProjectDir();
    const gitAgentService = new GitAgentService(projectDir);
    const gitService = new GitService(projectDir);

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
      projectDir,
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

    const projectDir = getProjectDir();
    const gitAgentService = new GitAgentService(projectDir);
    gitAgentService.saveAgentFile(filePath, content);

    const gitService = new GitService(projectDir);
    const uncommittedDiffs = gitService.getUncommittedDiff();

    return NextResponse.json({
      success: true,
      message: `Updated ${filePath}`,
      uncommittedDiffs,
      projectDir,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save file' }, { status: 500 });
  }
}
