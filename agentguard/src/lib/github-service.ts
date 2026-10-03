import fs from 'fs';
import path from 'path';
import { PullRequest, VersionTestRun, FileDiff } from './types';

export class GitHubService {
  private projectDir: string;
  private storageFile: string;
  private githubToken: string;
  private githubRepo: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    const gitagentDir = path.join(projectDir, '.gitagent');
    if (!fs.existsSync(gitagentDir)) {
      fs.mkdirSync(gitagentDir, { recursive: true });
    }
    this.storageFile = path.join(gitagentDir, 'pull_requests.json');
    this.githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
    this.githubRepo = process.env.GITHUB_REPO || process.env.GIT_REPOSITORY || '';
  }

  public isGitHubConnected(): boolean {
    return !!(this.githubToken && this.githubRepo);
  }

  public getGitHubConfig(): { isConnected: boolean; repo: string; hasToken: boolean } {
    return {
      isConnected: this.isGitHubConnected(),
      repo: this.githubRepo || 'Local Repository Mode',
      hasToken: !!this.githubToken,
    };
  }

  public getPullRequests(): PullRequest[] {
    if (!fs.existsSync(this.storageFile)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(this.storageFile, 'utf-8'));
    } catch {
      return [];
    }
  }

  public savePullRequests(prs: PullRequest[]): void {
    fs.writeFileSync(this.storageFile, JSON.stringify(prs, null, 2), 'utf-8');
  }

  public async createPullRequest(params: {
    title: string;
    description: string;
    sourceBranch: string;
    targetBranch: string;
    author?: string;
    changedFiles: string[];
    commitsCount: number;
    testRun?: VersionTestRun;
  }): Promise<{ success: boolean; pullRequest?: PullRequest; error?: string }> {
    const prs = this.getPullRequests();
    const nextNumber = prs.length > 0 ? Math.max(...prs.map(p => p.number || 0)) + 1 : 1;
    let url: string | undefined = undefined;
    let isGitHubPR = false;

    if (this.isGitHubConnected()) {
      try {
        const [owner, repo] = this.githubRepo.split('/');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: params.title,
            body: params.description,
            head: params.sourceBranch,
            base: params.targetBranch,
          }),
        });

        if (res.ok) {
          const ghPr = await res.json();
          url = ghPr.html_url;
          isGitHubPR = true;
        } else {
          const errData = await res.json();
          console.warn('GitHub API PR Creation Warning:', errData.message || res.statusText);
        }
      } catch (err: any) {
        console.warn('GitHub API Network Warning:', err.message);
      }
    }

    const newPr: PullRequest = {
      id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      number: nextNumber,
      title: params.title,
      description: params.description,
      sourceBranch: params.sourceBranch,
      targetBranch: params.targetBranch,
      status: 'open',
      url: url || `#local-pr-${nextNumber}`,
      createdAt: new Date().toISOString(),
      author: params.author || 'AgentGuard Developer',
      changedFiles: params.changedFiles,
      commitsCount: params.commitsCount,
      testRun: params.testRun,
      isGitHubPR,
      canMerge: true,
    };

    prs.unshift(newPr);
    this.savePullRequests(prs);

    return { success: true, pullRequest: newPr };
  }

  public async mergePullRequest(prId: string, author = 'Admin Developer'): Promise<{ success: boolean; error?: string }> {
    const prs = this.getPullRequests();
    const prIndex = prs.findIndex(p => p.id === prId || p.number === Number(prId));

    if (prIndex === -1) {
      return { success: false, error: 'Pull request not found' };
    }

    const pr = prs[prIndex];
    if (pr.status === 'merged') {
      return { success: false, error: 'Pull request is already merged' };
    }

    if (pr.isGitHubPR && this.isGitHubConnected() && pr.number) {
      try {
        const [owner, repo] = this.githubRepo.split('/');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/merge`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            commit_title: `Merge PR #${pr.number}: ${pr.title}`,
            merge_method: 'merge',
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          console.warn('GitHub Remote Merge Failed:', errData.message);
        }
      } catch (err: any) {
        console.warn('GitHub API Merge error:', err.message);
      }
    }

    pr.status = 'merged';
    pr.mergedAt = new Date().toISOString();
    pr.mergedBy = author;
    prs[prIndex] = pr;
    this.savePullRequests(prs);

    return { success: true };
  }
}
