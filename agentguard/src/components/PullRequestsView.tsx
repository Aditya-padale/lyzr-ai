'use client';

import React, { useState } from 'react';
import {
  GitPullRequest,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  GitMerge,
  ExternalLink,
  Diff,
  TestTube2,
  ShieldCheck,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';
import { PullRequest, GitBranch as GitBranchType, FileDiff, VersionTestRun } from '@/lib/types';

interface PullRequestsViewProps {
  pullRequests: PullRequest[];
  branches: GitBranchType[];
  currentBranch: string;
  githubConfig: { isConnected: boolean; repo: string; hasToken: boolean };
  latestTestRun: VersionTestRun | null;
  uncommittedDiffs: FileDiff[];
  onCreateBranch: (branchName: string) => Promise<boolean>;
  onCheckoutBranch: (branchName: string) => Promise<boolean>;
  onCreatePR: (data: { title: string; description: string; sourceBranch: string; targetBranch: string }) => Promise<boolean>;
  onMergePR: (prId: string) => Promise<boolean>;
}

export const PullRequestsView: React.FC<PullRequestsViewProps> = ({
  pullRequests,
  branches,
  currentBranch,
  githubConfig,
  latestTestRun,
  uncommittedDiffs,
  onCreateBranch,
  onCheckoutBranch,
  onCreatePR,
  onMergePR,
}) => {
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [showCreatePRModal, setShowCreatePRModal] = useState(false);

  // PR Form State
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [prSourceBranch, setPrSourceBranch] = useState(currentBranch);
  const [prTargetBranch, setPrTargetBranch] = useState('main');

  const [expandedPRId, setExpandedPRId] = useState<string | null>(pullRequests[0]?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMerging, setIsMerging] = useState<string | null>(null);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    setIsSubmitting(true);
    try {
      const ok = await onCreateBranch(newBranchName.trim());
      if (ok) {
        setNewBranchName('');
        setShowCreateBranchModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPRModal = () => {
    setPrSourceBranch(currentBranch);
    setPrTargetBranch('main');
    setPrTitle(`Update behavioral policies on branch '${currentBranch}'`);
    setPrDescription(
      `Proposed agent configuration & policy rule updates.\n\nEvaluation Evidence:\n- Pass Rate: ${
        latestTestRun ? `${latestTestRun.passRate}%` : 'Not run yet'
      }\n- Executed Tests: ${latestTestRun ? latestTestRun.totalTests : 0}\n- Commit: ${
        latestTestRun ? latestTestRun.commitHash.slice(0, 7) : 'HEAD'
      }`
    );
    setShowCreatePRModal(true);
  };

  const handleExecuteCreatePR = async () => {
    if (!prTitle.trim() || !prSourceBranch) return;
    setIsSubmitting(true);
    try {
      const ok = await onCreatePR({
        title: prTitle,
        description: prDescription,
        sourceBranch: prSourceBranch,
        targetBranch: prTargetBranch,
      });
      if (ok) {
        setShowCreatePRModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteMergePR = async (prId: string) => {
    setIsMerging(prId);
    try {
      await onMergePR(prId);
    } finally {
      setIsMerging(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <GitPullRequest className="w-5 h-5 text-indigo-400" />
            <span>Pull Requests & Branch Review Workflows</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Isolate policy experiments on feature branches, run evaluations, open PRs, and merge with explicit approval.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateBranchModal(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
          >
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <span>New Feature Branch</span>
          </button>

          <button
            onClick={handleOpenPRModal}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Open Pull Request</span>
          </button>
        </div>
      </div>

      {/* GitHub Integration Status Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-300 font-semibold">Active Git Branch:</span>
          <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-lg font-bold">
            {currentBranch}
          </span>
          {uncommittedDiffs.length > 0 && (
            <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[11px] font-sans">
              {uncommittedDiffs.length} Uncommitted Edits
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500">GitHub Remote:</span>
            {githubConfig.isConnected ? (
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected ({githubConfig.repo})</span>
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center space-x-1" title="Configure GITHUB_TOKEN in env for live GitHub sync">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Local Git Mode</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Branch Switcher Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-indigo-400" />
          <span>Active Repository Branches</span>
        </h2>

        <div className="flex flex-wrap gap-3">
          {branches.map(b => (
            <button
              key={b.name}
              onClick={() => onCheckoutBranch(b.name)}
              className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-mono transition ${
                b.name === currentBranch
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <GitBranch className={`w-3.5 h-3.5 ${b.name === currentBranch ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{b.name}</span>
              {b.isDefault && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-sans">main</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Pull Requests List */}
      <div className="space-y-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Open & Historic Pull Requests ({pullRequests.length})
        </div>

        {pullRequests.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <GitPullRequest className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-200">No Pull Requests Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Create an experimental feature branch, modify agent rules, run evaluation tests, and open your first pull request for human review.
            </p>
            <button
              onClick={handleOpenPRModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition"
            >
              Open Proposed PR
            </button>
          </div>
        ) : (
          pullRequests.map(pr => {
            const isExpanded = expandedPRId === pr.id;
            const isOpen = pr.status === 'open';

            return (
              <div
                key={pr.id}
                className={`bg-slate-900/60 border rounded-2xl transition duration-150 overflow-hidden ${
                  isOpen ? 'border-indigo-500/40 shadow-xl' : 'border-slate-800/80 opacity-90'
                }`}
              >
                {/* PR Header */}
                <div
                  onClick={() => setExpandedPRId(isExpanded ? null : pr.id)}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs text-indigo-400 font-bold">#{pr.number || 1}</span>
                      <span className="text-sm font-semibold text-slate-100">{pr.title}</span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border uppercase ${
                          pr.status === 'merged'
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : pr.status === 'open'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {pr.status}
                      </span>

                      {pr.isGitHubPR && (
                        <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-mono flex items-center space-x-1">
                          <ExternalLink className="w-3 h-3 text-indigo-400" />
                          <span>GitHub PR</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                      <span>
                        {pr.sourceBranch} → {pr.targetBranch}
                      </span>
                      <span>• Author: {pr.author}</span>
                      <span>• {new Date(pr.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {isOpen && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleExecuteMergePR(pr.id);
                        }}
                        disabled={isMerging === pr.id}
                        className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition"
                      >
                        {isMerging === pr.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <GitMerge className="w-4 h-4" />
                        )}
                        <span>Approve & Merge PR</span>
                      </button>
                    )}

                    {pr.url && pr.isGitHubPR && (
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center space-x-1 text-xs text-indigo-400 hover:underline font-mono"
                      >
                        <span>View on GitHub</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* PR Detail Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/80 p-6 space-y-5">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Pull Request Description & Rationale
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {pr.description}
                      </div>
                    </div>

                    {/* Test Evidence Banner */}
                    {pr.testRun && (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 flex items-center space-x-2">
                            <TestTube2 className="w-4 h-4 text-indigo-400" />
                            <span>Automated Test Suite Evidence</span>
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {pr.testRun.passRate}% Pass Rate ({pr.testRun.passed}/{pr.testRun.totalTests} Passed)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Executed against commit <code className="text-indigo-300 font-mono">{pr.testRun.commitHash.slice(0, 7)}</code> on branch <code className="text-slate-300 font-mono">{pr.sourceBranch}</code>.
                        </p>
                      </div>
                    )}

                    {/* Changed Files */}
                    {pr.changedFiles && pr.changedFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Files Modified in this PR ({pr.changedFiles.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pr.changedFiles.map((file, idx) => (
                            <span key={idx} className="bg-slate-900 border border-slate-800 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-mono">
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Feature Branch Modal */}
      {showCreateBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-indigo-400">
              <div className="p-2.5 bg-indigo-950 rounded-xl border border-indigo-800">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Create Experimental Branch</h3>
                <p className="text-xs text-slate-400">Isolate policy edits from main production branch.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Branch Name
              </label>
              <input
                type="text"
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
                placeholder="e.g. feature/stricter-refund-limit"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowCreateBranchModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBranch}
                disabled={isSubmitting || !newBranchName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition"
              >
                {isSubmitting ? 'Creating...' : 'Create & Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open PR Modal */}
      {showCreatePRModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-indigo-400">
              <div className="p-2.5 bg-indigo-950 rounded-xl border border-indigo-800">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Prepare Pull Request</h3>
                <p className="text-xs text-slate-400">Submit proposed agent updates for review & merge.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Source Branch
                  </label>
                  <select
                    value={prSourceBranch}
                    onChange={e => setPrSourceBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Target Branch
                  </label>
                  <input
                    type="text"
                    value={prTargetBranch}
                    onChange={e => setPrTargetBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  PR Title
                </label>
                <input
                  type="text"
                  value={prTitle}
                  onChange={e => setPrTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Change Description & Evaluation Summary
                </label>
                <textarea
                  value={prDescription}
                  onChange={e => setPrDescription(e.target.value)}
                  className="w-full h-32 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowCreatePRModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteCreatePR}
                disabled={isSubmitting || !prTitle.trim()}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition"
              >
                {isSubmitting ? 'Submitting PR...' : 'Submit Pull Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
