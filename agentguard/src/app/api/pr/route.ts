import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { GitHubService } from '@/lib/github-service';
import { GitService } from '@/lib/git-service';
import { EvaluationService } from '@/lib/eval-service';
import { AuditService } from '@/lib/audit-service';

const PROJECT_DIR = path.join(process.cwd(), 'projects', 'customer-support');

export async function GET() {
  try {
    const ghService = new GitHubService(PROJECT_DIR);
    const prs = ghService.getPullRequests();
    const ghConfig = ghService.getGitHubConfig();
    return NextResponse.json({ pullRequests: prs, githubConfig: ghConfig });
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

    const gitService = new GitService(PROJECT_DIR);
    const evalService = new EvaluationService(PROJECT_DIR);
    const ghService = new GitHubService(PROJECT_DIR);
    const auditService = new AuditService(PROJECT_DIR);

    // 1. Run evaluation suite on source branch if requested
    let testRun = undefined;
    if (runTestSuite) {
      testRun = await evalService.runTestSuite(sourceBranch);
    }

    // 2. Fetch diffs & commit count
    const fileDiffs = gitService.getDiffBetweenBranches(targetBranch, sourceBranch);
    const changedFiles = fileDiffs.map(d => d.path);
    const commits = gitService.getCommits();

    // 3. Create PR
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

    const gitService = new GitService(PROJECT_DIR);
    const ghService = new GitHubService(PROJECT_DIR);
    const auditService = new AuditService(PROJECT_DIR);

    const prs = ghService.getPullRequests();
    const targetPr = prs.find(p => p.id === prId || p.number === Number(prId));

    if (!targetPr) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 });
    }

    // Merge git branch into target branch (e.g. main)
    const mergeRes = gitService.mergeBranch(targetPr.sourceBranch, targetPr.targetBranch);
    if (!mergeRes.success) {
      return NextResponse.json({ error: mergeRes.error || 'Git merge failed' }, { status: 400 });
    }

    // Update PR status in storage / GitHub
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
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'PR merge failed' }, { status: 500 });
  }
}
