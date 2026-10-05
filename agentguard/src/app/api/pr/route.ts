import { NextRequest, NextResponse } from 'next/server';
import { getProjectDir } from '@/lib/project-config';
import { GitHubService } from '@/lib/github-service';
import { GitService } from '@/lib/git-service';
import { EvaluationService } from '@/lib/eval-service';
import { AuditService } from '@/lib/audit-service';

export async function GET() {
  try {
    const projectDir = getProjectDir();
    const ghService = new GitHubService(projectDir);
    const prs = ghService.getPullRequests();
    const ghConfig = ghService.getGitHubConfig();
    return NextResponse.json({ pullRequests: prs, githubConfig: ghConfig, repoDir: projectDir });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch pull requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, sourceBranch, targetBranch = 'main', runTestSuite = true } = body;

    if (!title || !sourceBranch) {
      return NextResponse.json({ error: 'title and sourceBranch are required' }, { status: 400 });
    }

    const projectDir = getProjectDir();
    const gitService = new GitService(projectDir);
    const evalService = new EvaluationService(projectDir);
    const ghService = new GitHubService(projectDir);
    const auditService = new AuditService(projectDir);

    let testRun = undefined;
    if (runTestSuite) {
      testRun = await evalService.runTestSuite(sourceBranch);
    }

    const fileDiffs = gitService.getDiffBetweenBranches(targetBranch, sourceBranch);
    const changedFiles = fileDiffs.map(d => d.path);
    const commits = gitService.getCommits();

    const result = await ghService.createPullRequest({
      title,
      description: description || `Proposed behavioral policy changes from branch ${sourceBranch}. Pass Rate: ${testRun?.passRate || 100}%.`,
      sourceBranch,
      targetBranch,
      changedFiles,
      commitsCount: commits.length,
      testRun,
    });

    if (!result.success || !result.pullRequest) {
      return NextResponse.json({ error: result.error || 'Failed to create pull request' }, { status: 400 });
    }

    auditService.logEvent(
      'pr_create',
      `Opened PR #${result.pullRequest.number}: '${title}' (${sourceBranch} -> ${targetBranch})`,
      gitService.getCurrentCommitHash(),
      sourceBranch
    );

    return NextResponse.json({
      success: true,
      pullRequest: result.pullRequest,
      fileDiffs,
      repoDir: projectDir,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'PR creation failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { prId, author = 'Lead Developer' } = body;

    if (!prId) {
      return NextResponse.json({ error: 'prId is required' }, { status: 400 });
    }

    const projectDir = getProjectDir();
    const gitService = new GitService(projectDir);
    const ghService = new GitHubService(projectDir);
    const auditService = new AuditService(projectDir);

    const prs = ghService.getPullRequests();
    const targetPr = prs.find(p => p.id === prId || p.number === Number(prId));

    if (!targetPr) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    const mergeRes = gitService.mergeBranch(targetPr.sourceBranch, targetPr.targetBranch);
    if (!mergeRes.success) {
      return NextResponse.json({ error: mergeRes.error || 'Git merge failed' }, { status: 400 });
    }

    await ghService.mergePullRequest(targetPr.id, author);

    auditService.logEvent(
      'pr_merge',
      `Approved & Merged PR #${targetPr.number}: '${targetPr.title}' into ${targetPr.targetBranch}`,
      gitService.getCurrentCommitHash(),
      targetPr.targetBranch,
      author
    );

    return NextResponse.json({
      success: true,
      mergedPr: targetPr,
      currentBranch: gitService.getCurrentBranch(),
      commits: gitService.getCommits(),
      repoDir: projectDir,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'PR merge failed' }, { status: 500 });
  }
}
