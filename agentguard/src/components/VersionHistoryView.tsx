'use client';

import React, { useState } from 'react';
import {
  History,
  GitCommit,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Diff,
  FileCode,
  ArrowRight,
  Clock,
  User,
} from 'lucide-react';
import { GitCommit as GitCommitType, FileDiff } from '@/lib/types';

interface VersionHistoryViewProps {
  commits: GitCommitType[];
  currentCommit: GitCommitType | null;
  onRollbackToCommit: (commitHash: string) => Promise<any>;
}

export const VersionHistoryView: React.FC<VersionHistoryViewProps> = ({
  commits,
  currentCommit,
  onRollbackToCommit,
}) => {
  const [selectedCommit, setSelectedCommit] = useState<GitCommitType | null>(null);
  const [showRollbackModal, setShowRollbackModal] = useState<boolean>(false);
  const [targetCommit, setTargetCommit] = useState<GitCommitType | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Git Version History & Safe Rollback</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Audit commit history, inspect version diffs, and restore earlier configurations safely.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Commit Timeline Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-indigo-400" />
              <span>Git Commit History Timeline</span>
            </h2>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
              {commits.map((commit, idx) => {
                const isCurrent = commit.hash === currentCommit?.hash;

                return (
                  <div
                    key={commit.hash}
                    className={`relative pl-8 p-4 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute left-2 top-5 w-3.5 h-3.5 rounded-full border-2 ${
                        isCurrent
                          ? 'bg-indigo-500 border-indigo-300 ring-4 ring-indigo-500/20'
                          : 'bg-slate-900 border-slate-600'
                      }`}
                    />

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 font-mono text-xs">
                          <span className="text-indigo-400 font-bold">{commit.shortHash}</span>
                          {isCurrent && (
                            <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[10px] px-2 py-0.5 rounded font-sans font-semibold">
                              ACTIVE HEAD
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(commit.date).toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-200">{commit.message}</p>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                          <User className="w-3 h-3" />
                          <span>{commit.author}</span>
                        </div>

                        {!isCurrent && (
                          <button
                            onClick={() => handleOpenRollbackModal(commit)}
                            className="flex items-center space-x-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 px-3 py-1 rounded-lg text-xs font-medium transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
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

        {/* Safety Rollback Protocol Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Safe Rollback Architecture</span>
            </h2>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                AgentGuard uses non-destructive Git restoration operations. When restoring an earlier configuration:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-slate-400 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-2.5 bg-amber-950 rounded-xl border border-amber-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Confirm Policy Restoration</h3>
                <p className="text-xs text-slate-400">Target Version: {targetCommit.shortHash}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
              <div className="text-slate-300 font-semibold">{targetCommit.message}</div>
              <div className="text-slate-500 text-[11px]">Author: {targetCommit.author} • {new Date(targetCommit.date).toLocaleDateString()}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Restoring version <strong className="font-mono text-indigo-300">{targetCommit.shortHash}</strong> will revert agent rules and policies to match that commit. A new restoration commit will be added and test suite will be evaluated.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRollback}
                disabled={isRestoring}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition"
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
