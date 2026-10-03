'use client';

import React from 'react';
import {
  ShieldAlert,
  GitCommit,
  GitBranch,
  GitPullRequest,
  TestTube2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Activity,
  FileCode,
} from 'lucide-react';
import { GitCommit as GitCommitType, VersionTestRun, PullRequest, ComplianceStatus, AuditEntry } from '@/lib/types';

interface DashboardViewProps {
  agentName: string;
  version: string;
  description: string;
  currentCommit: GitCommitType | null;
  currentBranch: string;
  totalCommits: number;
  latestTestRun: VersionTestRun | null;
  totalScenarios: number;
  hasUncommittedChanges: boolean;
  uncommittedDiffCount: number;
  latestRegressions: any[];
  openPRCount: number;
  compliance: ComplianceStatus | null;
  auditLogs: AuditEntry[];
  lifecycleStage: string;
  onNavigate: (tab: string) => void;
  onRunTestSuite: () => Promise<any>;
  isTesting: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agentName,
  version,
  description,
  currentCommit,
  currentBranch,
  totalCommits,
  latestTestRun,
  totalScenarios,
  hasUncommittedChanges,
  uncommittedDiffCount,
  latestRegressions,
  openPRCount,
  compliance,
  auditLogs,
  lifecycleStage,
  onNavigate,
  onRunTestSuite,
  isTesting,
}) => {
  const lifecycleSteps = [
    { key: 'draft', label: '1. Draft Edits', active: hasUncommittedChanges },
    { key: 'test', label: '2. Test & Eval', active: !hasUncommittedChanges && currentBranch !== 'main' },
    { key: 'review', label: '3. Review Diffs', active: currentBranch !== 'main' },
    { key: 'pull_request', label: '4. Pull Request', active: openPRCount > 0 },
    { key: 'approved_merge', label: '5. Approved Merge', active: false },
    { key: 'active_version', label: '6. Active Version', active: currentBranch === 'main' && !hasUncommittedChanges },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 text-xs px-3 py-1 rounded-full font-mono font-semibold">
                GitAgent Workbench Active
              </span>
              <span className="text-xs text-slate-400 font-mono">Branch: {currentBranch}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              {agentName} <span className="text-indigo-400">v{version}</span>
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRunTestSuite}
              disabled={isTesting}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95"
            >
              {isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Suite Evaluation</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigate('pull_requests')}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition"
            >
              <GitPullRequest className="w-4 h-4 text-emerald-400" />
              <span>Pull Request Hub ({openPRCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Agent Version Lifecycle Flow */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Agent Version Lifecycle State
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {lifecycleSteps.map(step => (
            <div
              key={step.key}
              className={`p-3 rounded-xl border text-center transition font-mono text-xs ${
                step.active
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/60 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 border-slate-800/80'
              }`}
            >
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate Metric */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>TestSuite Pass Rate</span>
            <TestTube2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-100">
              {latestTestRun ? `${latestTestRun.passRate}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">({totalScenarios} Scenarios)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                (latestTestRun?.passRate || 0) >= 80
                  ? 'bg-emerald-500'
                  : (latestTestRun?.passRate || 0) >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${latestTestRun?.passRate || 0}%` }}
            />
          </div>
        </div>

        {/* Regressions Alert Card */}
        <div
          onClick={() => onNavigate('compare')}
          className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Detected Regressions</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-extrabold ${latestRegressions.length > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
              {latestRegressions.length}
            </span>
            <span className="text-xs text-slate-400">Policy Breaks</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {latestRegressions.length > 0 ? 'Attention: Behavioral regression found!' : 'No regressions against baseline.'}
          </p>
        </div>

        {/* Git Active Branch & Commit Card */}
        <div
          onClick={() => onNavigate('history')}
          className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Git Version History</span>
            <GitCommit className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-indigo-300">
              {currentCommit?.shortHash || 'HEAD'}
            </span>
            <span className="text-xs text-slate-400">({totalCommits} Commits)</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">{currentCommit?.message || 'Initial commit'}</p>
        </div>

        {/* Uncommitted Draft Changes Card */}
        <div
          onClick={() => onNavigate('policy')}
          className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Working Tree Status</span>
            <FileCode className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-100">{uncommittedDiffCount}</span>
            <span className="text-xs text-slate-400">Unsaved Files</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {hasUncommittedChanges ? 'Draft policy edits pending commit.' : 'Working tree clean.'}
          </p>
        </div>
      </div>

      {/* Main Content Split: Compliance & Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Compliance Status */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Policy Compliance Guard</span>
              </h2>
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs text-indigo-400 hover:underline font-mono"
              >
                View Full Audit →
              </button>
            </div>

            {compliance && compliance.hasWarnings ? (
              <div className="space-y-2">
                {compliance.warnings.map(w => (
                  <div key={w.ruleId} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                    <span className="text-amber-400 font-bold mr-2">{w.ruleId}:</span>
                    <span className="text-slate-300 font-sans">{w.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>All compliance guardrails active. Rules file checked cleanly.</span>
              </div>
            )}
          </div>
        </div>

        {/* Audit Stream */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Recent Audit Activity</span>
              </h2>
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs text-indigo-400 hover:underline font-mono"
              >
                Logs →
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {auditLogs.slice(0, 4).map(log => (
                <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="truncate">
                    <span className="text-indigo-400 font-bold mr-2">[{log.action}]</span>
                    <span className="text-slate-300 font-sans text-xs">{log.details}</span>
                  </div>
                  <span className="text-slate-500 text-[10px] shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
