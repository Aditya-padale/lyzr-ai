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
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50 shadow-xs">
      {/* Brand & Active Agent */}
      <div className="flex items-center space-x-4">
        <div
          onClick={() => onQuickNavigate('dashboard')}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-indigo-500/20 font-bold text-sm tracking-tight cursor-pointer hover:opacity-95 transition"
        >
          <Shield className="w-4.5 h-4.5" />
          <span>AgentGuard</span>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex items-center space-x-2">
          <span className="text-slate-900 font-semibold text-sm">{agentName}</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-mono border border-slate-200 font-medium">
            v{version}
          </span>
        </div>
      </div>

      {/* Commit status, Branch badge, & PR Indicator */}
      <div className="flex items-center space-x-3">
        {/* Branch badge */}
        <button
          onClick={() => onQuickNavigate('pull_requests')}
          className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 px-3 py-1.5 rounded-lg text-xs font-mono transition"
          title="Active Git Branch"
        >
          <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-semibold">{currentBranch}</span>
        </button>

        {/* Open PR Badge */}
        {openPRCount > 0 && (
          <button
            onClick={() => onQuickNavigate('pull_requests')}
            className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-emerald-600" />
            <span>{openPRCount} Open PR</span>
          </button>
        )}

        {currentCommit && (
          <button
            onClick={() => onQuickNavigate('history')}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs transition font-mono hidden md:flex"
            title="Active Git Commit"
          >
            <GitCommit className="w-4 h-4 text-indigo-600" />
            <span>{currentCommit.shortHash}</span>
          </button>
        )}

        {hasUncommittedChanges ? (
          <button
            onClick={() => onQuickNavigate('policy')}
            className="flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1.5 rounded-lg text-xs font-medium animate-pulse hover:bg-amber-100 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{uncommittedDiffCount} Edits</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-medium hidden sm:flex">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Clean Repo</span>
          </div>
        )}

        <div className="h-5 w-px bg-slate-200" />

        {/* Quick Test Suite Trigger */}
        <button
          onClick={onRunTestRun}
          disabled={isTesting}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active:scale-98"
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
