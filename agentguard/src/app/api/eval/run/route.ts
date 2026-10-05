import { NextRequest, NextResponse } from 'next/server';
import { getProjectDir } from '@/lib/project-config';
import { EvaluationService } from '@/lib/eval-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branchName, scenarioId } = body;

    const projectDir = getProjectDir();
    const evalService = new EvaluationService(projectDir);

    if (scenarioId) {
      const scenarios = evalService.getScenarios();
      const targetScenario = scenarios.find(s => s.id === scenarioId);
      if (!targetScenario) {
        return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
      }
      const execution = await evalService.runSingleScenario(targetScenario);
      return NextResponse.json({ success: true, execution, repoDir: projectDir });
    }

    const testRun = await evalService.runTestSuite(branchName);
    return NextResponse.json({ success: true, testRun, repoDir: projectDir });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Evaluation run failed' }, { status: 500 });
  }
}
