import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { EvaluationService } from '@/lib/eval-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId } = body;

    const evalService = new EvaluationService(PROJECT_DIR);

    if (scenarioId) {
      const scenarios = evalService.getScenarios();
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (!scenario) {
        return NextResponse.json({ error: `Scenario ${scenarioId} not found` }, { status: 404 });
      }

      const execution = await evalService.runSingleScenario(scenario);
      return NextResponse.json({ execution });
    }

    // Run full test suite
    const testRun = await evalService.runTestSuite();
    return NextResponse.json({ testRun });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Evaluation failed' }, { status: 500 });
  }
}
