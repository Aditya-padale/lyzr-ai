export interface AgentFile {
  path: string;
  name: string;
  content: string;
  isModified?: boolean;
  category?: 'core' | 'instruction' | 'memory' | 'skill' | 'workflow' | 'config' | 'test';
}

export interface McpServerConfig {
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  disabled?: boolean;
}

export interface AgentConfig {
  spec_version: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  model: {
    preferred: string;
    fallback: string[];
    constraints?: Record<string, any>;
  };
  tools: string[];
  skills?: string[];
  runtime: {
    max_turns: number;
    timeout?: number;
  };
  extends?: string;
  compliance?: Record<string, any>;
  mcp_servers?: Record<string, McpServerConfig>;
  plugins?: Record<string, any>;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  isCurrent?: boolean;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  commitHash: string;
  shortHash: string;
  isDefault?: boolean;
}

export interface FileDiff {
  path: string;
  status: 'modified' | 'added' | 'deleted';
  diffText: string;
}

export interface TestScenario {
  id: string;
  name: string;
  category: 'normal' | 'policy_violation' | 'missing_info' | 'conflicting_rules' | 'prompt_injection';
  description: string;
  input: string;
  expectedBehavior: string;
  evaluationCriteria: string[];
}

export interface EvaluationResult {
  status: 'passed' | 'failed' | 'inconclusive';
  score: number; // 0 to 100
  reasoning: string;
  criteriaResults: {
    criterion: string;
    passed: boolean;
    explanation: string;
  }[];
  isModelJudge?: boolean;
}

export interface TestExecution {
  id: string;
  scenarioId: string;
  scenarioName: string;
  commitHash: string;
  timestamp: string;
  input: string;
  agentResponse: string;
  executionTimeMs: number;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  evaluation: EvaluationResult;
  toolCalls?: {
    name: string;
    args: any;
    result?: any;
  }[];
  error?: string;
}

export interface VersionTestRun {
  id: string;
  commitHash: string;
  branchName?: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  inconclusive: number;
  passRate: number;
  executions: TestExecution[];
}

export interface VersionComparison {
  commitA: GitCommit;
  commitB: GitCommit;
  branchA?: string;
  branchB?: string;
  fileDiffs: FileDiff[];
  runA?: VersionTestRun;
  runB?: VersionTestRun;
  regressions: {
    scenarioId: string;
    scenarioName: string;
    statusA: 'passed' | 'failed' | 'inconclusive';
    statusB: 'passed' | 'failed' | 'inconclusive';
    responseA: string;
    responseB: string;
    reasoning: string;
  }[];
  improvements: {
    scenarioId: string;
    scenarioName: string;
    statusA: 'passed' | 'failed' | 'inconclusive';
    statusB: 'passed' | 'failed' | 'inconclusive';
  }[];
}

export type VersionLifecycleStage = 
  | 'draft'
  | 'test'
  | 'review'
  | 'pull_request'
  | 'approved_merge'
  | 'active_version';

export interface PullRequest {
  id: string;
  number?: number;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'open' | 'merged' | 'closed';
  url?: string;
  createdAt: string;
  author: string;
  changedFiles: string[];
  commitsCount: number;
  testRun?: VersionTestRun;
  isGitHubPR: boolean;
  canMerge: boolean;
  mergedAt?: string;
  mergedBy?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'file_edit' | 'commit' | 'branch_create' | 'eval_run' | 'pr_create' | 'pr_merge' | 'rollback';
  author: string;
  details: string;
  commitHash?: string;
  branch?: string;
}

export interface ComplianceStatus {
  hasWarnings: boolean;
  warnings: {
    ruleId: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }[];
}
