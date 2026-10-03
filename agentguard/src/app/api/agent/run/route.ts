import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { GitAgentService } from '@/lib/gitagent-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const gitAgentService = new GitAgentService(PROJECT_DIR);
    const result = await gitAgentService.runAgent(prompt);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Execution failed' }, { status: 500 });
  }
}
