import { NextRequest, NextResponse } from 'next/server';
import { getProjectDir } from '@/lib/project-config';
import { GitService } from '@/lib/git-service';

export async function GET() {
  try {
    const projectDir = getProjectDir();
    const gitService = new GitService(projectDir);
    const commits = gitService.getCommits();
    return NextResponse.json({ commits, repoDir: projectDir });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch commits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Commit message is required' }, { status: 400 });
    }

    const projectDir = getProjectDir();
    const gitService = new GitService(projectDir);
    const result = gitService.commit(message.trim());

    if (!result.success) {
      return NextResponse.json({
        error: result.error || `No changes to commit in repository: ${projectDir}`,
        repoDir: projectDir,
      }, { status: 400 });
    }

    const commits = gitService.getCommits();
    return NextResponse.json({
      success: true,
      hash: result.hash,
      commits,
      repoDir: projectDir,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Commit failed' }, { status: 500 });
  }
}
