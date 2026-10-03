import { NextResponse } from 'next/server';
import path from 'path';
import { GitAgentService } from '@/lib/gitagent-service';
import { GitService } from '@/lib/git-service';
import { EvaluationService } from '@/lib/eval-service';
import { GitHubService } from '@/lib/github-service';
import { AuditService } from '@/lib/audit-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function GET() {
  try {
    const gitAgentService = new GitAgentService(PROJECT_DIR);
    const gitService = new GitService(PROJECT_DIR);
    const evalService = new EvaluationService(PROJECT_DIR);
    const ghService = new GitHubService(PROJECT_DIR);
    const auditService = new AuditService(PROJECT_DIR);

    const config = gitAgentService.getAgentConfig();
    const commits = gitService.getCommits();
    const currentCommit = commits.find(c => c.isCurrent) || commits[0] || null;
    const currentBranch = gitService.getCurrentBranch();
    const branches = gitService.getBranches();
    const latestTestRun = currentCommit ? evalService.getTestRunForCommit(currentCommit.hash) : null;
    const scenarios = evalService.getScenarios();
    const uncommittedDiffs = gitService.getUncommittedDiff();
    const pullRequests = ghService.getPullRequests();
    const openPRs = pullRequests.filter(p => p.status === 'open');
    const compliance = auditService.getComplianceStatus();
    const auditLogs = auditService.getAuditLogs(10);

    let latestRegressions: any[] = [];
    if (commits.length >= 2) {
      const comparison = evalService.compareVersions(commits[1].hash, commits[0].hash);
      latestRegressions = comparison.regressions;
    }

    let lifecycleStage: string = 'active_version';
    if (uncommittedDiffs.length > 0) {
      lifecycleStage = 'draft';
    } else if (openPRs.length > 0) {
      lifecycleStage = 'pull_request';
    } else if (currentBranch !== 'main' && currentBranch !== 'master') {
      lifecycleStage = 'test';
    }

    return NextResponse.json({
      agentName: config?.name || 'customer-support-agent',
      version: config?.version || '1.0.0',
      description: config?.description || '',
      currentCommit,
      currentBranch,
      branches,
      totalCommits: commits.length,
      latestTestRun,
      totalScenarios: scenarios.length,
      hasUncommittedChanges: uncommittedDiffs.length > 0,
      uncommittedDiffCount: uncommittedDiffs.length,
      latestRegressions,
      recentCommits: commits.slice(0, 5),
      openPRCount: openPRs.length,
      pullRequests,
      compliance,
      auditLogs,
      lifecycleStage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
