import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GitCommit, GitBranch, FileDiff } from './types';

interface ServerlessCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  branch: string;
  files: Record<string, string>;
}

interface ServerlessBranch {
  name: string;
  commitHash: string;
  isDefault: boolean;
}

interface ServerlessGitState {
  currentBranch: string;
  branches: ServerlessBranch[];
  commits: ServerlessCommit[];
  stashedFiles?: Record<string, string>;
}

export class GitService {
  private projectDir: string;
  private gitAvailable: boolean = false;
  private stateFile: string;

  constructor(projectDir: string) {
    this.projectDir = path.resolve(projectDir);
    this.stateFile = path.join(this.projectDir, '.gitagent', 'git_state.json');
    this.gitAvailable = this.checkGitAvailable();
    this.ensureRepoInitialized();
  }

  public getRepoDir(): string {
    return this.projectDir;
  }

  private checkGitAvailable(): boolean {
    if (process.env.VERCEL) return false;
    try {
      execSync('git --version', { cwd: this.projectDir, stdio: ['pipe', 'pipe', 'pipe'] });
      return true;
    } catch {
      return false;
    }
  }

  private ensureRepoInitialized(): void {
    if (!fs.existsSync(this.projectDir)) {
      fs.mkdirSync(this.projectDir, { recursive: true });
    }

    if (this.gitAvailable) {
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
    } else {
      // Serverless Git Engine Initialization
      const gitagentDir = path.join(this.projectDir, '.gitagent');
      if (!fs.existsSync(gitagentDir)) {
        fs.mkdirSync(gitagentDir, { recursive: true });
      }

      if (!fs.existsSync(this.stateFile)) {
        const currentFiles = this.readProjectFiles(this.projectDir);
        const initialHash = crypto.createHash('sha1').update('initial-commit-' + Date.now()).digest('hex');
        
        const initialCommit: ServerlessCommit = {
          hash: initialHash,
          shortHash: initialHash.slice(0, 7),
          author: 'AgentGuard Bot',
          date: new Date().toISOString(),
          message: 'initial: bootstrap agent policies',
          branch: 'main',
          files: currentFiles,
        };

        const initialState: ServerlessGitState = {
          currentBranch: 'main',
          branches: [
            { name: 'main', commitHash: initialHash, isDefault: true }
          ],
          commits: [initialCommit],
        };

        this.saveServerlessState(initialState);
      }
    }
  }

  private loadServerlessState(): ServerlessGitState {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
      }
    } catch (e) {
      console.warn('Failed to load serverless git state:', e);
    }
    const fallbackHash = crypto.createHash('sha1').update('fallback-' + Date.now()).digest('hex');
    return {
      currentBranch: 'main',
      branches: [{ name: 'main', commitHash: fallbackHash, isDefault: true }],
      commits: [{
        hash: fallbackHash,
        shortHash: fallbackHash.slice(0, 7),
        author: 'AgentGuard Bot',
        date: new Date().toISOString(),
        message: 'initial: bootstrap agent policies',
        branch: 'main',
        files: this.readProjectFiles(this.projectDir),
      }],
    };
  }

  private saveServerlessState(state: ServerlessGitState): void {
    const dir = path.dirname(this.stateFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
  }

  private readProjectFiles(dir: string, baseDir: string = dir): Record<string, string> {
    const result: Record<string, string> = {};
    if (!fs.existsSync(dir)) return result;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'workspace') continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        Object.assign(result, this.readProjectFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        try {
          result[relPath] = fs.readFileSync(fullPath, 'utf-8');
        } catch {}
      }
    }
    return result;
  }

  private writeProjectFiles(files: Record<string, string>): void {
    // Write target files
    for (const [relPath, content] of Object.entries(files)) {
      const fullPath = path.join(this.projectDir, relPath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
  }

  private generateDiffText(filePath: string, oldText: string | undefined, newText: string | undefined): string {
    if (oldText === undefined && newText !== undefined) {
      return `--- /dev/null\n+++ b/${filePath}\n@@ -0,0 +1,${newText.split('\n').length} @@\n` + newText.split('\n').map(l => `+${l}`).join('\n');
    }
    if (oldText !== undefined && newText === undefined) {
      return `--- a/${filePath}\n+++ /dev/null\n@@ -1,${oldText.split('\n').length} +0,0 @@\n` + oldText.split('\n').map(l => `-${l}`).join('\n');
    }
    if (oldText === newText) return '';

    const oldLines = (oldText || '').split('\n');
    const newLines = (newText || '').split('\n');
    const diffLines: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`, `@@ -1,${oldLines.length} +1,${newLines.length} @@`];

    for (const line of oldLines) {
      if (!newLines.includes(line)) {
        diffLines.push(`-${line}`);
      }
    }
    for (const line of newLines) {
      if (!oldLines.includes(line)) {
        diffLines.push(`+${line}`);
      }
    }
    return diffLines.join('\n');
  }

  private exec(command: string): string {
    try {
      return execSync(command, { cwd: this.projectDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (err: any) {
      const stderr = err.stderr ? err.stderr.toString().trim() : '';
      const stdout = err.stdout ? err.stdout.toString().trim() : '';
      const msg = stderr || stdout || err.message || `Git command failed: ${command}`;
      console.error(`Git command failed in [${this.projectDir}]: ${command}`, msg);
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
    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const currentBranchObj = state.branches.find(b => b.name === state.currentBranch);
      const currentHash = currentBranchObj ? currentBranchObj.commitHash : (state.commits[0]?.hash || '');

      return state.commits.map(c => ({
        hash: c.hash,
        shortHash: c.shortHash,
        author: c.author,
        date: c.date,
        message: c.message,
        isCurrent: c.hash === currentHash,
      }));
    }

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
    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const currentBranchObj = state.branches.find(b => b.name === state.currentBranch);
      return currentBranchObj ? currentBranchObj.commitHash : (state.commits[0]?.hash || '');
    }
    return this.safeExec('git rev-parse HEAD');
  }

  public getCurrentCommitShortHash(): string {
    const hash = this.getCurrentCommitHash();
    return hash ? hash.slice(0, 7) : '';
  }

  public getCurrentBranch(): string {
    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      return state.currentBranch || 'main';
    }
    const branch = this.safeExec('git rev-parse --abbrev-ref HEAD');
    return branch || 'main';
  }

  public getBranches(): GitBranch[] {
    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      return state.branches.map(b => ({
        name: b.name,
        isCurrent: b.name === state.currentBranch,
        commitHash: b.commitHash,
        shortHash: b.commitHash.slice(0, 7),
        isDefault: b.isDefault,
      }));
    }

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

    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const headHash = this.getCurrentCommitHash();
      const existing = state.branches.find(b => b.name === safeName);
      if (!existing) {
        state.branches.push({ name: safeName, commitHash: headHash, isDefault: false });
      }
      state.currentBranch = safeName;
      this.saveServerlessState(state);
      return { success: true, branchName: safeName };
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

    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const targetBranch = state.branches.find(b => b.name === safeName);
      if (!targetBranch) return { success: false, error: `Branch ${safeName} does not exist` };

      state.currentBranch = safeName;
      this.saveServerlessState(state);

      // Restore target commit files onto working tree
      const commitObj = state.commits.find(c => c.hash === targetBranch.commitHash);
      if (commitObj && commitObj.files) {
        this.writeProjectFiles(commitObj.files);
      }
      return { success: true };
    }

    try {
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

  public commit(message: string): { success: boolean; hash?: string; error?: string; repoDir?: string } {
    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const currentFiles = this.readProjectFiles(this.projectDir);

      const headHash = this.getCurrentCommitHash();
      const headCommit = state.commits.find(c => c.hash === headHash);
      const headFiles = headCommit ? headCommit.files : {};

      // Check if working tree has any changes relative to HEAD
      const currentKeys = Object.keys(currentFiles);
      const headKeys = Object.keys(headFiles);
      const isChanged = currentKeys.length !== headKeys.length || currentKeys.some(k => currentFiles[k] !== headFiles[k]);

      if (!isChanged) {
        return {
          success: false,
          error: `No changes to commit in repository: ${this.projectDir}`,
          repoDir: this.projectDir,
        };
      }

      const newHash = crypto.createHash('sha1').update(`commit-${Date.now()}-${message}`).digest('hex');
      const newCommit: ServerlessCommit = {
        hash: newHash,
        shortHash: newHash.slice(0, 7),
        author: 'AgentGuard Bot',
        date: new Date().toISOString(),
        message,
        branch: state.currentBranch,
        files: currentFiles,
      };

      state.commits.unshift(newCommit);

      const activeBranch = state.branches.find(b => b.name === state.currentBranch);
      if (activeBranch) {
        activeBranch.commitHash = newHash;
      } else {
        state.branches.push({ name: state.currentBranch, commitHash: newHash, isDefault: false });
      }

      this.saveServerlessState(state);
      return { success: true, hash: newHash, repoDir: this.projectDir };
    }

    try {
      const statusBefore = this.safeExec('git status --porcelain');
      if (!statusBefore.trim()) {
        return {
          success: false,
          error: `No changes to commit in repository: ${this.projectDir}`,
          repoDir: this.projectDir,
        };
      }

      // Stage working tree changes in agent repo
      this.safeExec('git add .');

      const statusAfterAdd = this.safeExec('git status --porcelain');
      if (!statusAfterAdd.trim()) {
        return {
          success: false,
          error: `No changes to commit in repository: ${this.projectDir}`,
          repoDir: this.projectDir,
        };
      }

      const sanitizedMsg = message.replace(/"/g, '\\"');
      this.exec(`git commit -m "${sanitizedMsg}"`);
      const newHash = this.getCurrentCommitHash();
      return { success: true, hash: newHash, repoDir: this.projectDir };
    } catch (err: any) {
      return { success: false, error: err.message || 'Commit failed', repoDir: this.projectDir };
    }
  }

  public getUncommittedDiff(): FileDiff[] {
    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const currentFiles = this.readProjectFiles(this.projectDir);
      const headHash = this.getCurrentCommitHash();
      const headCommit = state.commits.find(c => c.hash === headHash);
      const headFiles = headCommit ? headCommit.files : {};

      const diffs: FileDiff[] = [];
      const allPaths = Array.from(new Set([...Object.keys(currentFiles), ...Object.keys(headFiles)]));

      for (const filePath of allPaths) {
        if (filePath.startsWith('node_modules') || filePath.startsWith('.next') || filePath.startsWith('workspace/')) continue;

        const curr = currentFiles[filePath];
        const head = headFiles[filePath];

        if (curr !== head) {
          let status: 'modified' | 'added' | 'deleted' = 'modified';
          if (head === undefined) status = 'added';
          else if (curr === undefined) status = 'deleted';

          diffs.push({
            path: filePath,
            status,
            diffText: this.generateDiffText(filePath, head, curr),
          });
        }
      }

      return diffs;
    }

    const statusOutput = this.safeExec('git status --porcelain');
    if (!statusOutput) return [];

    const diffs: FileDiff[] = [];
    const statusLines = statusOutput.split('\n').filter(Boolean);

    for (const line of statusLines) {
      const statusCode = line.substring(0, 2);
      const filePath = line.substring(2).trim().replace(/^"(.*)"$/, '$1');

      if (!filePath || filePath.startsWith('node_modules') || filePath.startsWith('.next') || filePath.startsWith('workspace/')) {
        continue;
      }

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
    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const cA = state.commits.find(c => c.hash === commitA || c.shortHash === commitA || c.branch === commitA);
      const cB = state.commits.find(c => c.hash === commitB || c.shortHash === commitB || c.branch === commitB);

      const filesA = cA ? cA.files : {};
      const filesB = cB ? cB.files : {};

      const diffs: FileDiff[] = [];
      const allPaths = Array.from(new Set([...Object.keys(filesA), ...Object.keys(filesB)]));

      for (const filePath of allPaths) {
        if (filePath.startsWith('node_modules') || filePath.startsWith('.next') || filePath.startsWith('workspace/')) continue;

        const valA = filesA[filePath];
        const valB = filesB[filePath];

        if (valA !== valB) {
          let status: 'modified' | 'added' | 'deleted' = 'modified';
          if (valA === undefined) status = 'added';
          else if (valB === undefined) status = 'deleted';

          diffs.push({
            path: filePath,
            status,
            diffText: this.generateDiffText(filePath, valA, valB),
          });
        }
      }

      return diffs;
    }

    const diffStat = this.exec(`git diff --name-status "${commitA}" "${commitB}"`);
    if (!diffStat) return [];

    const diffs: FileDiff[] = [];
    const lines = diffStat.split('\n').filter(Boolean);

    for (const line of lines) {
      const parts = line.split('\t');
      const statusCode = parts[0];
      const filePath = parts[1];

      if (!filePath || filePath.startsWith('node_modules') || filePath.startsWith('.next') || filePath.startsWith('workspace/')) {
        continue;
      }

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

    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const srcBranchObj = state.branches.find(b => b.name === safeSource);
      const tgtBranchObj = state.branches.find(b => b.name === safeTarget);

      if (!srcBranchObj || !tgtBranchObj) {
        return { success: false, error: `Branch merge failed: branch not found` };
      }

      const srcCommit = state.commits.find(c => c.hash === srcBranchObj.commitHash);
      if (!srcCommit) return { success: false, error: 'Source commit not found' };

      // Apply source branch commit files to target branch working tree
      this.writeProjectFiles(srcCommit.files);

      state.currentBranch = safeTarget;
      this.saveServerlessState(state);

      const commitRes = this.commit(`Merge branch '${safeSource}' into ${safeTarget}`);
      return { success: commitRes.success, error: commitRes.error };
    }

    try {
      this.checkoutBranch(safeTarget);
      this.exec(`git merge "${safeSource}" --no-ff -m "Merge branch '${safeSource}' into ${safeTarget}"`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || `Failed to merge ${safeSource} into ${safeTarget}` };
    }
  }

  public getFileAtCommit(filePath: string, commitHash: string): string {
    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const commitObj = state.commits.find(c => c.hash === commitHash || c.shortHash === commitHash);
      if (commitObj && commitObj.files && commitObj.files[filePath] !== undefined) {
        return commitObj.files[filePath];
      }
      return '';
    }
    return this.exec(`git show "${commitHash}:${filePath}"`);
  }

  public restoreToCommit(targetCommitHash: string): { success: boolean; newCommitHash?: string; error?: string } {
    if (!this.gitAvailable) {
      const state = this.loadServerlessState();
      const commitObj = state.commits.find(c => c.hash === targetCommitHash || c.shortHash === targetCommitHash);
      if (!commitObj) return { success: false, error: 'Target commit not found' };

      this.writeProjectFiles(commitObj.files);
      const shortHash = targetCommitHash.slice(0, 7);
      const commitRes = this.commit(`revert: restore agent policies to version ${shortHash}`);
      if (!commitRes.success) {
        return { success: true, newCommitHash: this.getCurrentCommitHash() };
      }
      return { success: true, newCommitHash: commitRes.hash };
    }

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

