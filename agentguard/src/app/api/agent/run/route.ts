import { NextRequest, NextResponse } from 'next/server';
import { getProjectDir } from '@/lib/project-config';
import { GitAgentService } from '@/lib/gitagent-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const projectDir = getProjectDir();
    const gitAgentService = new GitAgentService(projectDir);
    const result = await gitAgentService.runAgent(prompt);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Execution failed' }, { status: 500 });
  }
}
