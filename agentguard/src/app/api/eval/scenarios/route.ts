import { NextRequest, NextResponse } from 'next/server';
import { getProjectDir } from '@/lib/project-config';
import { EvaluationService } from '@/lib/eval-service';

export async function GET() {
  try {
    const projectDir = getProjectDir();
    const evalService = new EvaluationService(projectDir);
    const scenarios = evalService.getScenarios();
    return NextResponse.json({ scenarios, repoDir: projectDir });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch scenarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenario } = body;

    if (!scenario || !scenario.name || !scenario.input) {
      return NextResponse.json({ error: 'Valid scenario object is required' }, { status: 400 });
    }

    const projectDir = getProjectDir();
    const evalService = new EvaluationService(projectDir);

    if (scenario.id) {
      evalService.updateScenario(scenario);
      return NextResponse.json({ success: true, scenario, repoDir: projectDir });
    } else {
      const created = evalService.addScenario(scenario);
      return NextResponse.json({ success: true, scenario: created, repoDir: projectDir });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save scenario' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Scenario ID parameter is required' }, { status: 400 });
    }

    const projectDir = getProjectDir();
    const evalService = new EvaluationService(projectDir);
    evalService.deleteScenario(id);

    return NextResponse.json({ success: true, deletedId: id, repoDir: projectDir });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete scenario' }, { status: 500 });
  }
}
