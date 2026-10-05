'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { DashboardView } from '@/components/DashboardView';
import { AgentWorkspaceView } from '@/components/AgentWorkspaceView';
import { PolicyEditorView } from '@/components/PolicyEditorView';
import { PullRequestsView } from '@/components/PullRequestsView';
import { TestLabView } from '@/components/TestLabView';
import { VersionHistoryView } from '@/components/VersionHistoryView';
import { VersionComparisonView } from '@/components/VersionComparisonView';
import { AuditComplianceView } from '@/components/AuditComplianceView';
import {
  GitCommit,
  AgentFile,
  TestScenario,
  VersionTestRun,
  FileDiff,
  VersionComparison,
  GitBranch,
  PullRequest,
  AuditEntry,
  ComplianceStatus,
} from '@/lib/types';

export default function AgentGuardApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application State
  const [agentName, setAgentName] = useState<string>('customer-support-agent');
  const [version, setVersion] = useState<string>('1.0.0');
  const [description, setDescription] = useState<string>('Autonomous Customer Support Agent for Acme E-commerce');
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [currentCommit, setCurrentCommit] = useState<GitCommit | null>(null);
  const [uncommittedDiffs, setUncommittedDiffs] = useState<FileDiff[]>([]);
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [githubConfig, setGithubConfig] = useState<{ isConnected: boolean; repo: string; hasToken: boolean }>({
    isConnected: false,
    repo: '',
    hasToken: false,
  });
  const [latestTestRun, setLatestTestRun] = useState<VersionTestRun | null>(null);
  const [latestRegressions, setLatestRegressions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [lifecycleStage, setLifecycleStage] = useState<string>('active_version');
  const [repoDir, setRepoDir] = useState<string>('');

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Fetch complete state from API routes
  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();

      setAgentName(data.agentName);
      setVersion(data.version);
      setDescription(data.description);
      setCurrentCommit(data.currentCommit);
      setCurrentBranch(data.currentBranch || 'main');
      setBranches(data.branches || []);
      setLatestTestRun(data.latestTestRun);
      setUncommittedDiffs(data.uncommittedDiffs || []);
      setRepoDir(data.projectDir || '');
      setLatestRegressions(data.latestRegressions || []);
      setCommits(data.recentCommits || []);
      setPullRequests(data.pullRequests || []);
      setCompliance(data.compliance || null);
      setAuditLogs(data.auditLogs || []);
      setLifecycleStage(data.lifecycleStage || 'active_version');
    } catch (e) {
      console.error('Error fetching dashboard:', e);
    }
  };

  const loadAgentFiles = async () => {
    try {
      const res = await fetch('/api/agent');
      const data = await res.json();
      setFiles(data.files || []);
      setCommits(data.commits || []);
      setCurrentCommit(data.currentCommit || null);
      setUncommittedDiffs(data.uncommittedDiffs || []);
    } catch (e) {
      console.error('Error fetching agent files:', e);
    }
  };

  const loadScenarios = async () => {
    try {
      const res = await fetch('/api/eval/scenarios');
      const data = await res.json();
      setScenarios(data.scenarios || []);
    } catch (e) {
      console.error('Error fetching scenarios:', e);
    }
  };

  const loadCommits = async () => {
    try {
      const res = await fetch('/api/git/commits');
      const data = await res.json();
      setCommits(data.commits || []);
    } catch (e) {
      console.error('Error fetching commits:', e);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/git/branches');
      const data = await res.json();
      setBranches(data.branches || []);
      setCurrentBranch(data.currentBranch || 'main');
    } catch (e) {
      console.error('Error fetching branches:', e);
    }
  };

  const loadPullRequests = async () => {
    try {
      const res = await fetch('/api/pr');
      const data = await res.json();
      setPullRequests(data.pullRequests || []);
      setGithubConfig(data.githubConfig || { isConnected: false, repo: '', hasToken: false });
    } catch (e) {
      console.error('Error fetching PRs:', e);
    }
  };

  const loadAuditData = async () => {
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      setAuditLogs(data.auditLogs || []);
      setCompliance(data.compliance || null);
    } catch (e) {
      console.error('Error fetching audit data:', e);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      loadDashboardData(),
      loadAgentFiles(),
      loadScenarios(),
      loadCommits(),
      loadBranches(),
      loadPullRequests(),
      loadAuditData(),
    ]);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshAll();
      setIsLoading(false);
    };
    init();
  }, []);

  // Action Handlers
  const handleSaveFile = async (filePath: string, content: string) => {
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAll();
      }
    } catch (e) {
      console.error('Error saving file:', e);
    }
  };

  const handleRunAgentPrompt = async (prompt: string) => {
    const res = await fetch('/api/agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    return await res.json();
  };

  const handleCommitChanges = async (message: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/git/commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAll();
        return { success: true };
      }
      return { success: false, error: data.error || 'Commit failed' };
    } catch (e: any) {
      console.error('Error committing:', e);
      return { success: false, error: e.message || 'Failed to commit changes' };
    }
  };

  const handleCreateBranch = async (branchName: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', branchName }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAll();
        return true;
      }
    } catch (e) {
      console.error('Error creating branch:', e);
    }
    return false;
  };

  const handleCheckoutBranch = async (branchName: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', branchName }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAll();
        return true;
      }
    } catch (e) {
      console.error('Error checking out branch:', e);
    }
    return false;
  };

  const handleCreatePR = async (prData: { title: string; description: string; sourceBranch: string; targetBranch: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prData),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAll();
        return true;
      }
    } catch (e) {
      console.error('Error creating PR:', e);
    }
    return false;
  };

  const handleMergePR = async (prId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/pr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prId }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAll();
        return true;
      }
    } catch (e) {
      console.error('Error merging PR:', e);
    }
    return false;
  };

  const handleSaveScenario = async (scenario: TestScenario | Omit<TestScenario, 'id'>) => {
    try {
      const res = await fetch('/api/eval/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshAll();
      }
    } catch (e) {
      console.error('Error saving scenario:', e);
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      const res = await fetch(`/api/eval/scenarios?id=${scenarioId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await refreshAll();
      }
    } catch (e) {
      console.error('Error deleting scenario:', e);
    }
  };

  const handleRunTestSuite = async (): Promise<VersionTestRun> => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/eval/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName: currentBranch }),
      });
      const data = await res.json();
      setLatestTestRun(data.testRun);
      await refreshAll();
      return data.testRun;
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunSingleScenario = async (scenarioId: string) => {
    const res = await fetch('/api/eval/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    const data = await res.json();
    return data.execution;
  };

  const handleRollbackToCommit = async (commitHash: string) => {
    const res = await fetch('/api/git/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetCommitHash: commitHash, rerunTests: true }),
    });
    const data = await res.json();
    if (data.success) {
      await refreshAll();
      if (data.testRun) setLatestTestRun(data.testRun);
    }
    return data;
  };

  const handleFetchComparison = async (commitA: string, commitB: string): Promise<VersionComparison> => {
    const res = await fetch(`/api/eval/compare?commitA=${commitA}&commitB=${commitB}`);
    const data = await res.json();
    return data.comparison;
  };

  const openPRCount = pullRequests.filter(p => p.status === 'open').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center space-x-3">
        <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium font-mono text-slate-500">Initializing GitAgent Workbench...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/20">
      <Navbar
        agentName={agentName}
        version={version}
        currentCommit={currentCommit}
        currentBranch={currentBranch}
        openPRCount={openPRCount}
        hasUncommittedChanges={uncommittedDiffs.length > 0}
        uncommittedDiffCount={uncommittedDiffs.length}
        onRunTestRun={handleRunTestSuite}
        isTesting={isTesting}
        onQuickNavigate={tab => setActiveTab(tab)}
      />

      <div className="flex">
        <Sidebar
          activeTab={activeTab}
          onTabChange={tab => setActiveTab(tab)}
          uncommittedDiffCount={uncommittedDiffs.length}
          regressionCount={latestRegressions.length}
          openPRCount={openPRCount}
          hasComplianceWarnings={!!(compliance && compliance.hasWarnings)}
        />

        <main className="flex-1 p-8 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              agentName={agentName}
              version={version}
              description={description}
              currentCommit={currentCommit}
              currentBranch={currentBranch}
              totalCommits={commits.length}
              latestTestRun={latestTestRun}
              totalScenarios={scenarios.length}
              hasUncommittedChanges={uncommittedDiffs.length > 0}
              uncommittedDiffCount={uncommittedDiffs.length}
              latestRegressions={latestRegressions}
              openPRCount={openPRCount}
              compliance={compliance}
              auditLogs={auditLogs}
              lifecycleStage={lifecycleStage}
              onNavigate={tab => setActiveTab(tab)}
              onRunTestSuite={handleRunTestSuite}
              isTesting={isTesting}
            />
          )}

          {activeTab === 'workspace' && (
            <AgentWorkspaceView
              files={files}
              onSaveFile={handleSaveFile}
              onRunAgent={handleRunAgentPrompt}
            />
          )}

          {activeTab === 'policy' && (
            <PolicyEditorView
              files={files}
              uncommittedDiffs={uncommittedDiffs}
              onSaveFile={handleSaveFile}
              onCommitChanges={handleCommitChanges}
              onRunTestSuite={handleRunTestSuite}
            />
          )}

          {activeTab === 'pull_requests' && (
            <PullRequestsView
              pullRequests={pullRequests}
              branches={branches}
              currentBranch={currentBranch}
              githubConfig={githubConfig}
              latestTestRun={latestTestRun}
              uncommittedDiffs={uncommittedDiffs}
              onCreateBranch={handleCreateBranch}
              onCheckoutBranch={handleCheckoutBranch}
              onCreatePR={handleCreatePR}
              onMergePR={handleMergePR}
            />
          )}

          {activeTab === 'testlab' && (
            <TestLabView
              scenarios={scenarios}
              latestTestRun={latestTestRun}
              onRunSingleScenario={handleRunSingleScenario}
              onRunTestSuite={handleRunTestSuite}
              onSaveScenario={handleSaveScenario}
              onDeleteScenario={handleDeleteScenario}
              isTesting={isTesting}
            />
          )}

          {activeTab === 'history' && (
            <VersionHistoryView
              commits={commits}
              currentCommit={currentCommit}
              uncommittedDiffs={uncommittedDiffs}
              repoDir={repoDir}
              onCommitChanges={handleCommitChanges}
              onRollbackToCommit={handleRollbackToCommit}
            />
          )}

          {activeTab === 'compare' && (
            <VersionComparisonView
              commits={commits}
              onFetchComparison={handleFetchComparison}
            />
          )}

          {activeTab === 'audit' && (
            <AuditComplianceView
              auditLogs={auditLogs}
              compliance={compliance}
            />
          )}
        </main>
      </div>
    </div>
  );
}
