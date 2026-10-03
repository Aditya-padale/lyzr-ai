'use client';

import React from 'react';
import { Shield, GitBranch, GitCommit, Play, GitPullRequest, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GitCommit as GitCommitType } from '@/lib/types';

interface NavbarProps {
  agentName: string;
  version: string;
  currentCommit: GitCommitType | null;
  currentBranch: string;
  openPRCount: number;
  hasUncommittedChanges: boolean;
  uncommittedDiffCount: number;
  onRunTestRun: () => void;
  isTesting: boolean;
  onQuickNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  agentName,
  version,
  currentCommit,
  currentBranch,
  openPRCount,
  hasUncommittedChanges,
  uncommittedDiffCount,
  onRunTestRun,
  isTesting,
  onQuickNavigate,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Active Agent */}
      <div className="flex items-center space-x-4">
        <div
          onClick={() => onQuickNavigate('dashboard')}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-blue-500/20 font-bold text-sm tracking-wide cursor-pointer hover:opacity-90 transition"
        >
          <Shield className="w-5 h-5" />
          <span>AgentGuard</span>
        </div>

        <div className="h-5 w-px bg-slate-800" />

        <div className="flex items-center space-x-2">
          <span className="text-slate-200 font-semibold text-sm">{agentName}</span>
          <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded font-mono border border-slate-700">
            v{version}
          </span>
        </div>
      </div>

      {/* Commit status, Branch badge, & PR Indicator */}
      <div className="flex items-center space-x-3">
        {/* Branch badge */}
        <button
          onClick={() => onQuickNavigate('pull_requests')}
          className="flex items-center space-x-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/80 px-3 py-1.5 rounded-lg text-xs font-mono transition"
          title="Active Git Branch"
        >
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold">{currentBranch}</span>
        </button>

        {/* Open PR Badge */}
        {openPRCount > 0 && (
          <button
            onClick={() => onQuickNavigate('pull_requests')}
            className="flex items-center space-x-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
            <span>{openPRCount} Open PR</span>
          </button>
        )}

        {currentCommit && (
          <button
            onClick={() => onQuickNavigate('history')}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs transition font-mono hidden md:flex"
            title="Active Git Commit"
          >
            <GitCommit className="w-4 h-4 text-indigo-400" />
            <span>{currentCommit.shortHash}</span>
          </button>
        )}

        {hasUncommittedChanges ? (
          <button
            onClick={() => onQuickNavigate('policy')}
            className="flex items-center space-x-1.5 bg-amber-950/50 text-amber-300 border border-amber-800/60 px-2.5 py-1.5 rounded-lg text-xs font-medium animate-pulse hover:bg-amber-900/40 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{uncommittedDiffCount} Edits</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1 rounded-lg text-xs font-medium hidden sm:flex">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clean Repo</span>
          </div>
        )}

        <div className="h-5 w-px bg-slate-800" />

        {/* Quick Test Suite Trigger */}
        <button
          onClick={onRunTestRun}
          disabled={isTesting}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95"
        >
          {isTesting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Evaluating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Tests</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
