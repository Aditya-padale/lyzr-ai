import { execSync, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { GitCommit, GitBranch, FileDiff } from './types';

export class GitService {
  private projectDir: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    this.ensureRepoInitialized();
  }

  private ensureRepoInitialized(): void {
    if (!fs.existsSync(this.projectDir)) {
      fs.mkdirSync(this.projectDir, { recursive: true });
    }
    const gitDir = path.join(this.projectDir, '.git');
    if (!fs.existsSync(gitDir)) {
      try {
        execSync('git init -b main', { cwd: this.projectDir, encoding: 'utf-8' });
        execSync('git config user.name "AgentGuard Bot"', { cwd: this.projectDir });
        execSync('git config user.email "bot@agentguard.internal"', { cwd: this.projectDir });
      } catch {
        execSync('git init', { cwd: this.projectDir, encoding: 'utf-8' });
      }
    }
  }

  private exec(command: string): string {
    try {
      return execSync(command, { cwd: this.projectDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (err: any) {
      const stderr = err.stderr ? err.stderr.toString().trim() : '';
      const stdout = err.stdout ? err.stdout.toString().trim() : '';
      const msg = stderr || stdout || err.message || `Git command failed: ${command}`;
      console.error(`Git command failed: ${command}`, msg);
      throw new Error(msg);
    }
  }

  private safeExec(command: string, fallback: string = ''): string {
    try {
      return this.exec(command);
    } catch {
      return fallback;
    }
  }

  private sanitizeBranchName(branchName: string): string {
    return branchName.replace(/[^a-zA-Z0-9_\-\/]/g, '').slice(0, 80);
  }

  public getCommits(): GitCommit[] {
    const output = this.safeExec('git log --pretty=format:"%H|%h|%an|%ad|%s" --date=iso');
    if (!output) return [];

    const currentHash = this.getCurrentCommitHash();

    return output.split('\n').filter(Boolean).map(line => {
      const [hash, shortHash, author, date, message] = line.split('|');
      return {
        hash,
        shortHash,
        author,
        date,
        message,
        isCurrent: hash === currentHash,
      };
    });
  }

  public getCurrentCommitHash(): string {
    return this.safeExec('git rev-parse HEAD');
  }

  public getCurrentCommitShortHash(): string {
    return this.safeExec('git rev-parse --short HEAD');
  }

  public getCurrentBranch(): string {
    const branch = this.safeExec('git rev-parse --abbrev-ref HEAD');
    return branch || 'main';
  }

  public getBranches(): GitBranch[] {
    const output = this.safeExec('git branch --format="%(refname:short)|%(objectname)|%(objectname:short)|%(HEAD)"');
    if (!output) {
      const current = this.getCurrentBranch();
      const currentHash = this.getCurrentCommitHash();
      return [{
        name: current || 'main',
        isCurrent: true,
        commitHash: currentHash,
        shortHash: currentHash.slice(0, 7),
        isDefault: true,
      }];
    }

    const branches: GitBranch[] = [];
    const lines = output.split('\n').filter(Boolean);

    for (const line of lines) {
      const [name, commitHash, shortHash, headMarker] = line.split('|');
      const isCurrent = headMarker === '*';
      branches.push({
        name,
        isCurrent,
        commitHash,
        shortHash,
        isDefault: name === 'main' || name === 'master',
      });
    }

    return branches;
  }

  public createBranch(rawBranchName: string): { success: boolean; branchName?: string; error?: string } {
    const safeName = this.sanitizeBranchName(rawBranchName);
    if (!safeName) {
      return { success: false, error: 'Invalid branch name' };
    }

    try {
      this.exec(`git checkout -b "${safeName}"`);
      return { success: true, branchName: safeName };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create branch' };
    }
  }

  public checkoutBranch(rawBranchName: string): { success: boolean; error?: string } {
    const safeName = this.sanitizeBranchName(rawBranchName);
    if (!safeName) return { success: false, error: 'Invalid branch name' };

    try {
      // Check if uncommitted changes exist, stash them if needed
      const status = this.safeExec('git status --porcelain');
      if (status) {
        this.safeExec('git stash push -m "AgentGuard auto-stash before checkout"');
      }

      this.exec(`git checkout "${safeName}"`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to checkout branch' };
    }
  }

  public commit(message: string): { success: boolean; hash?: string; error?: string } {
    try {
      this.safeExec('git add .');
      const status = this.safeExec('git status --porcelain');
      if (!status) {
        return { success: false, error: 'No changes to commit' };
      }

      const sanitizedMsg = message.replace(/"/g, '\\"');
      this.exec(`git commit -m "${sanitizedMsg}"`);
      const newHash = this.getCurrentCommitHash();
      return { success: true, hash: newHash };
    } catch (err: any) {
      return { success: false, error: err.message || 'Commit failed' };
    }
  }

  public getUncommittedDiff(): FileDiff[] {
    const statusOutput = this.safeExec('git status --porcelain');
    if (!statusOutput) return [];

    const diffs: FileDiff[] = [];
    const statusLines = statusOutput.split('\n').filter(Boolean);

    for (const line of statusLines) {
      const statusCode = line.substring(0, 2).trim();
      const filePath = line.substring(2).trim().replace(/^"(.*)"$/, '$1');

      if (!filePath || filePath.startsWith('.gitagent') || filePath.startsWith('workspace') || filePath.startsWith('node_modules')) continue;

      let status: 'modified' | 'added' | 'deleted' = 'modified';
      if (statusCode.includes('A') || statusCode.includes('?')) status = 'added';
      if (statusCode.includes('D')) status = 'deleted';

      const fileDiffOutput = this.safeExec(`git diff HEAD -- "${filePath}"`);
      diffs.push({
        path: filePath,
        status,
        diffText: fileDiffOutput || (status === 'added' ? `+ Added file: ${filePath}` : `Modified file: ${filePath}`),
      });
    }

    return diffs;
  }

  public getDiffBetweenCommits(commitA: string, commitB: string): FileDiff[] {
    const diffStat = this.exec(`git diff --name-status "${commitA}" "${commitB}"`);
    if (!diffStat) return [];

    const diffs: FileDiff[] = [];
    const lines = diffStat.split('\n').filter(Boolean);

    for (const line of lines) {
      const parts = line.split('\t');
      const statusCode = parts[0];
      const filePath = parts[1];

      if (!filePath || filePath.startsWith('.gitagent') || filePath.startsWith('workspace') || filePath.startsWith('node_modules')) continue;

      let status: 'modified' | 'added' | 'deleted' = 'modified';
      if (statusCode.startsWith('A')) status = 'added';
      if (statusCode.startsWith('D')) status = 'deleted';

      const diffText = this.exec(`git diff "${commitA}..${commitB}" -- "${filePath}"`);
      diffs.push({
        path: filePath,
        status,
        diffText: diffText || `Modified file: ${filePath}`,
      });
    }

    return diffs;
  }

  public getDiffBetweenBranches(branchA: string, branchB: string): FileDiff[] {
    const safeA = this.sanitizeBranchName(branchA);
    const safeB = this.sanitizeBranchName(branchB);
    return this.getDiffBetweenCommits(safeA, safeB);
  }

  public mergeBranch(sourceBranch: string, targetBranch: string): { success: boolean; error?: string } {
    const safeSource = this.sanitizeBranchName(sourceBranch);
    const safeTarget = this.sanitizeBranchName(targetBranch);

    try {
      // Checkout target branch
      this.checkoutBranch(safeTarget);
      // Execute git merge
      const output = this.exec(`git merge "${safeSource}" --no-ff -m "Merge branch '${safeSource}' into ${safeTarget}"`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || `Failed to merge ${safeSource} into ${safeTarget}` };
    }
  }

  public getFileAtCommit(filePath: string, commitHash: string): string {
    return this.exec(`git show "${commitHash}:${filePath}"`);
  }

  public restoreToCommit(targetCommitHash: string): { success: boolean; newCommitHash?: string; error?: string } {
    try {
      const shortHash = targetCommitHash.slice(0, 7);
      this.exec(`git checkout "${targetCommitHash}" -- .`);

      const commitRes = this.commit(`revert: restore agent policies to version ${shortHash}`);
      if (!commitRes.success) {
        return { success: true, newCommitHash: this.getCurrentCommitHash() };
      }
      return { success: true, newCommitHash: commitRes.hash };
    } catch (err: any) {
      return { success: false, error: err.message || 'Restoration failed' };
    }
  }
}
