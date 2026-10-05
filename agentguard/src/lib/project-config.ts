import path from 'path';
import fs from 'fs';

/**
 * Resolves the absolute path to the agent Git repository.
 * Handles running from both the `agentguard` directory and workspace root.
 */
function copyDirSync(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Resolves the absolute path to the agent Git repository.
 * Handles running from both local environment and Vercel serverless environment.
 */
export function getProjectDir(subPath = 'customer-support'): string {
  if (process.env.AGENT_PROJECT_DIR) {
    return path.resolve(process.env.AGENT_PROJECT_DIR);
  }

  // Path candidate 1: inside process.cwd()/projects (when running from agentguard/)
  const cand1 = path.resolve(process.cwd(), 'projects', subPath);
  // Path candidate 2: inside process.cwd()/agentguard/projects (when running from workspace root)
  const cand2 = path.resolve(process.cwd(), 'agentguard', 'projects', subPath);

  const templateSource = fs.existsSync(cand1) ? cand1 : (fs.existsSync(cand2) ? cand2 : cand1);

  // In Vercel serverless runtime or read-only filesystem, use /tmp
  if (process.env.VERCEL || process.env.NODE_ENV === 'production' || process.cwd().startsWith('/var/task')) {
    const tmpDir = path.join('/tmp', 'agentguard', 'projects', subPath);
    if (!fs.existsSync(tmpDir) && fs.existsSync(templateSource)) {
      try {
        copyDirSync(templateSource, tmpDir);
      } catch (err) {
        console.warn('Failed to copy project files to /tmp:', err);
      }
    }
    return tmpDir;
  }

  if (fs.existsSync(cand1)) {
    return cand1;
  }

  if (fs.existsSync(cand2)) {
    return cand2;
  }

  return cand1;
}
