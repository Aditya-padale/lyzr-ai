'use client';

import React, { useState } from 'react';
import {
  History,
  GitCommit,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Clock,
  User,
  PlusCircle,
} from 'lucide-react';
import { GitCommit as GitCommitType, FileDiff } from '@/lib/types';

interface VersionHistoryViewProps {
  commits: GitCommitType[];
  currentCommit: GitCommitType | null;
  uncommittedDiffs?: FileDiff[];
  repoDir?: string;
  onCommitChanges?: (message: string) => Promise<boolean | { success: boolean; error?: string }>;
  onRollbackToCommit: (commitHash: string) => Promise<any>;
}

export const VersionHistoryView: React.FC<VersionHistoryViewProps> = ({
  commits,
  currentCommit,
  uncommittedDiffs = [],
  repoDir,
  onCommitChanges,
  onRollbackToCommit,
}) => {
  const [selectedCommit, setSelectedCommit] = useState<GitCommitType | null>(null);
  const [showRollbackModal, setShowRollbackModal] = useState<boolean>(false);
  const [targetCommit, setTargetCommit] = useState<GitCommitType | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const [commitMessage, setCommitMessage] = useState<string>('policy: update agent configuration');
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const hasUncommittedChanges = uncommittedDiffs && uncommittedDiffs.length > 0;
  const isCommitButtonDisabled = isCommitting || !commitMessage.trim() || !hasUncommittedChanges;

  const handleOpenRollbackModal = (commit: GitCommitType) => {
    setTargetCommit(commit);
    setShowRollbackModal(true);
  };

  const handleExecuteRollback = async () => {
    if (!targetCommit) return;
    setIsRestoring(true);
    try {
      await onRollbackToCommit(targetCommit.hash);
      setShowRollbackModal(false);
    } catch (e) {
      console.error('Rollback error:', e);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCommit = async () => {
    if (isCommitButtonDisabled || !onCommitChanges) return;

    setIsCommitting(true);
    setCommitError(null);

    try {
      const res = await onCommitChanges(commitMessage.trim());
      const ok = typeof res === 'boolean' ? res : res.success;
      const errorMsg = typeof res === 'object' && res.error ? res.error : 'Commit failed. Please check working tree changes.';

      if (ok) {
        setCommitMessage('');
      } else {
        setCommitError(errorMsg);
      }
    } catch (e: any) {
      console.error('Commit error:', e);
      setCommitError(e.message || 'Failed to commit changes');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Git Version History & Safe Rollback</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Audit commit history, inspect version diffs, commit working tree changes, and restore earlier configurations safely.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Commit Timeline Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <GitCommit className="w-4 h-4 text-indigo-600" />
                <span>Git Commit History Timeline</span>
              </h2>
              <span className="text-xs font-mono text-slate-500 font-medium">
                {commits.length} commit{commits.length !== 1 ? 's' : ''} logged
              </span>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {commits.map((commit) => {
                const isCurrent = commit.hash === currentCommit?.hash;

                return (
                  <div
                    key={commit.hash}
                    className={`relative pl-8 p-4 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute left-2 top-5 w-3.5 h-3.5 rounded-full border-2 ${
                        isCurrent
                          ? 'bg-indigo-600 border-indigo-200 ring-4 ring-indigo-500/10'
                          : 'bg-white border-slate-400'
                      }`}
                    />

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 font-mono text-xs">
                          <span className="text-indigo-700 font-bold">{commit.shortHash}</span>
                          {isCurrent && (
                            <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] px-2 py-0.5 rounded font-sans font-semibold">
                              ACTIVE HEAD
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(commit.date).toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-900">{commit.message}</p>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                          <User className="w-3 h-3" />
                          <span>{commit.author}</span>
                        </div>

                        {!isCurrent && (
                          <button
                            onClick={() => handleOpenRollbackModal(commit)}
                            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-lg text-xs font-medium transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            <span>Restore This Version</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Commit Changes & Safe Rollback Architecture */}
        <div className="lg:col-span-5 space-y-6">
          {/* Commit Changes Card */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>Commit Changes</span>
              </h2>
              {hasUncommittedChanges ? (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] px-2.5 py-0.5 rounded-full font-mono font-semibold flex items-center space-x-1">
                  <FileCode className="w-3 h-3 inline mr-1 text-amber-600" />
                  <span>{uncommittedDiffs.length} pending change{uncommittedDiffs.length > 1 ? 's' : ''}</span>
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] px-2.5 py-0.5 rounded-full font-mono font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-600" />
                  <span>Working tree clean</span>
                </span>
              )}
            </div>

            {/* Changed Files Display */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">Changed Files in Working Tree</label>
              {hasUncommittedChanges ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                  {uncommittedDiffs.map((diff) => (
                    <div key={diff.path} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="text-slate-900 truncate">{diff.path}</span>
                      </div>
                      <span
                        className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                          diff.status === 'added'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : diff.status === 'deleted'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {diff.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 space-y-1">
                  <p className="text-slate-700 font-medium">No uncommitted changes in repository</p>
                  {repoDir && (
                    <p className="text-[11px] font-mono text-indigo-600/80 truncate px-2" title={repoDir}>
                      {repoDir}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">Modify policy rules or agent files to commit updates to Git.</p>
                </div>
              )}
            </div>

            {/* Commit Message Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">Commit Message</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => {
                  setCommitMessage(e.target.value);
                  if (commitError) setCommitError(null);
                }}
                placeholder="Enter commit message (e.g. policy: adjust refund limit)..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none font-mono transition"
              />
            </div>

            {/* Commit Error Banner */}
            {commitError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2 text-rose-700 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{commitError}</span>
              </div>
            )}

            {/* Commit Button & Description */}
            <div className="pt-1 space-y-2">
              <button
                onClick={handleCommit}
                disabled={isCommitButtonDisabled}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xs transition active:scale-98"
              >
                <GitCommit className="w-4 h-4" />
                <span>{isCommitting ? 'Committing Changes...' : 'Commit Changes'}</span>
              </button>

              {!hasUncommittedChanges && (
                <p className="text-[11px] text-slate-500 text-center font-mono">
                  Button disabled: No changes to commit in repository.
                </p>
              )}
            </div>
          </div>

          {/* Safety Rollback Protocol Card */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Safe Rollback Architecture</span>
            </h2>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                AgentGuard uses non-destructive Git restoration operations. When restoring an earlier configuration:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans">
                <li>Selected commit files are extracted cleanly into working tree.</li>
                <li>Existing history is fully preserved (no destructive reset --hard).</li>
                <li>A new restoration commit is logged for full auditability.</li>
                <li>Evaluation test suite is automatically executed against restored policies.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Rollback Confirmation Modal */}
      {showRollbackModal && targetCommit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Policy Restoration</h3>
                <p className="text-xs text-slate-500">Target Version: {targetCommit.shortHash}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
              <div className="text-slate-900 font-semibold">{targetCommit.message}</div>
              <div className="text-slate-500 text-[11px]">Author: {targetCommit.author} • {new Date(targetCommit.date).toLocaleDateString()}</div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Restoring version <strong className="font-mono text-indigo-700">{targetCommit.shortHash}</strong> will revert agent rules and policies to match that commit. A new restoration commit will be added and test suite will be evaluated.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRollback}
                disabled={isRestoring}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isRestoring ? 'Restoring & Retesting...' : 'Confirm Safe Rollback'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
