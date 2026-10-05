import path from 'path';
import fs from 'fs';

/**
 * Resolves the absolute path to the agent Git repository.
 * Handles running from both the `agentguard` directory and workspace root.
 */
export function getProjectDir(subPath = 'customer-support'): string {
  if (process.env.AGENT_PROJECT_DIR) {
    return path.resolve(process.env.AGENT_PROJECT_DIR);
  }

  // Path candidate 1: inside process.cwd()/projects (when running from agentguard/)
  const cand1 = path.resolve(process.cwd(), 'projects', subPath);
  if (fs.existsSync(cand1)) {
    return cand1;
  }

  // Path candidate 2: inside process.cwd()/agentguard/projects (when running from workspace root)
  const cand2 = path.resolve(process.cwd(), 'agentguard', 'projects', subPath);
  if (fs.existsSync(cand2)) {
    return cand2;
  }

  // Fallback candidate 1
  return cand1;
}
