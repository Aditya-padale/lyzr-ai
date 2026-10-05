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
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-50/70 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-3 py-1 rounded-full font-mono font-semibold">
                GitAgent Workbench Active
              </span>
              <span className="text-xs text-slate-500 font-mono">Branch: {currentBranch}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {agentName} <span className="text-indigo-600">v{version}</span>
            </h1>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRunTestSuite}
              disabled={isTesting}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm hover:shadow transition active:scale-98"
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
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition"
            >
              <GitPullRequest className="w-4 h-4 text-emerald-600" />
              <span>Pull Request Hub ({openPRCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Agent Version Lifecycle Flow */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Agent Version Lifecycle State
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {lifecycleSteps.map(step => (
            <div
              key={step.key}
              className={`p-3 rounded-xl border text-center transition font-mono text-xs ${
                step.active
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
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
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>TestSuite Pass Rate</span>
            <TestTube2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {latestTestRun ? `${latestTestRun.passRate}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-500">({totalScenarios} Scenarios)</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
          className="bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md rounded-2xl p-5 space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Detected Regressions</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-extrabold ${latestRegressions.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {latestRegressions.length}
            </span>
            <span className="text-xs text-slate-500">Policy Breaks</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {latestRegressions.length > 0 ? 'Attention: Behavioral regression found!' : 'No regressions against baseline.'}
          </p>
        </div>

        {/* Git Active Branch & Commit Card */}
        <div
          onClick={() => onNavigate('history')}
          className="bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md rounded-2xl p-5 space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Git Version History</span>
            <GitCommit className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold font-mono text-indigo-700">
              {currentCommit?.shortHash || 'HEAD'}
            </span>
            <span className="text-xs text-slate-500">({totalCommits} Commits)</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">{currentCommit?.message || 'Initial commit'}</p>
        </div>

        {/* Uncommitted Draft Changes Card */}
        <div
          onClick={() => onNavigate('policy')}
          className="bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md rounded-2xl p-5 space-y-2 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Working Tree Status</span>
            <FileCode className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">{uncommittedDiffCount}</span>
            <span className="text-xs text-slate-500">Unsaved Files</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {hasUncommittedChanges ? 'Draft policy edits pending commit.' : 'Working tree clean.'}
          </p>
        </div>
      </div>

      {/* Main Content Split: Compliance & Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Compliance Status */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Policy Compliance Guard</span>
              </h2>
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium font-mono"
              >
                View Full Audit →
              </button>
            </div>

            {compliance && compliance.hasWarnings ? (
              <div className="space-y-2">
                {compliance.warnings.map(w => (
                  <div key={w.ruleId} className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs font-mono">
                    <span className="text-amber-800 font-bold mr-2">{w.ruleId}:</span>
                    <span className="text-slate-800 font-sans">{w.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>All compliance guardrails active. Rules file checked cleanly.</span>
              </div>
            )}
          </div>
        </div>

        {/* Audit Stream */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Recent Audit Activity</span>
              </h2>
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium font-mono"
              >
                Logs →
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {auditLogs.slice(0, 4).map(log => (
                <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="truncate">
                    <span className="text-indigo-600 font-bold mr-2">[{log.action}]</span>
                    <span className="text-slate-800 font-sans text-xs">{log.details}</span>
                  </div>
                  <span className="text-slate-400 text-[10px] shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
