import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { EvaluationService } from '@/lib/eval-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function GET() {
  try {
    const evalService = new EvaluationService(PROJECT_DIR);
    const scenarios = evalService.getScenarios();
    return NextResponse.json({ scenarios });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch scenarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenario } = body;

    if (!scenario || !scenario.name || !scenario.input) {
      return NextResponse.json({ error: 'Valid scenario object with name and input is required' }, { status: 400 });
    }

    const evalService = new EvaluationService(PROJECT_DIR);

    if (scenario.id) {
      evalService.updateScenario(scenario);
      return NextResponse.json({ success: true, scenario });
    } else {
      const created = evalService.addScenario(scenario);
      return NextResponse.json({ success: true, scenario: created });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save scenario' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scenarioId = searchParams.get('id');

    if (!scenarioId) {
      return NextResponse.json({ error: 'Scenario id parameter is required' }, { status: 400 });
    }

    const evalService = new EvaluationService(PROJECT_DIR);
    evalService.deleteScenario(scenarioId);

    return NextResponse.json({ success: true, scenarios: evalService.getScenarios() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete scenario' }, { status: 500 });
  }
}
