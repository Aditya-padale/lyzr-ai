import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { GitService } from '@/lib/git-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function GET() {
  try {
    const gitService = new GitService(PROJECT_DIR);
    const commits = gitService.getCommits();
    return NextResponse.json({ commits });
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

    const gitService = new GitService(PROJECT_DIR);
    const result = gitService.commit(message);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Commit failed' }, { status: 400 });
    }

    const commits = gitService.getCommits();
    return NextResponse.json({
      success: true,
      hash: result.hash,
      commits,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Commit failed' }, { status: 500 });
  }
}
