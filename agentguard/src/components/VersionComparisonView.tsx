'use client';

import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  GitCommit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Diff,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { GitCommit as GitCommitType, VersionComparison } from '@/lib/types';

interface VersionComparisonViewProps {
  commits: GitCommitType[];
  onFetchComparison: (commitA: string, commitB: string) => Promise<VersionComparison>;
}

export const VersionComparisonView: React.FC<VersionComparisonViewProps> = ({
  commits,
  onFetchComparison,
}) => {
  const [commitAHash, setCommitAHash] = useState<string>(commits[1]?.hash || commits[0]?.hash || '');
  const [commitBHash, setCommitBHash] = useState<string>(commits[0]?.hash || '');
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadComparison = async () => {
    if (!commitAHash || !commitBHash) return;
    setIsLoading(true);
    try {
      const data = await onFetchComparison(commitAHash, commitBHash);
      setComparison(data);
    } catch (e) {
      console.error('Comparison error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (commitAHash && commitBHash) {
      loadComparison();
    }
  }, [commitAHash, commitBHash]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-indigo-400" />
            <span>Version Comparison & Regression Matrix</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Compare two Git versions side-by-side: prompt changes, test matrix deltas, and agent outputs.
          </p>
        </div>

        <button
          onClick={loadComparison}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Comparison</span>
        </button>
      </div>

      {/* Commit Picker Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Version A Selector */}
        <div className="md:col-span-5 space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Base Version (Version A)
          </label>
          <select
            value={commitAHash}
            onChange={e => setCommitAHash(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none font-mono"
          >
            {commits.map(c => (
              <option key={c.hash} value={c.hash}>
                {c.shortHash} - {c.message} ({new Date(c.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {/* Center Comparison Arrow */}
        <div className="md:col-span-1 flex justify-center text-slate-500">
          <ArrowRight className="w-5 h-5" />
        </div>

        {/* Version B Selector */}
        <div className="md:col-span-5 space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Target Version (Version B)
          </label>
          <select
            value={commitBHash}
            onChange={e => setCommitBHash(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none font-mono"
          >
            {commits.map(c => (
              <option key={c.hash} value={c.hash}>
                {c.shortHash} - {c.message} ({new Date(c.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Regressions Highlight Box if any */}
          {comparison.regressions.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-rose-200 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                <span>{comparison.regressions.length} Regression(s) Detected in Target Version</span>
              </div>

              <div className="space-y-3">
                {comparison.regressions.map(reg => (
                  <div key={reg.scenarioId} className="bg-slate-950/80 border border-rose-900/60 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{reg.scenarioName}</span>
                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className="text-emerald-400">{reg.statusA}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-rose-400">{reg.statusB}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                        <div className="text-emerald-400 font-bold text-[10px] uppercase mb-1">Version A Response:</div>
                        {reg.responseA}
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-rose-950 font-mono text-[11px] text-slate-300">
                        <div className="text-rose-400 font-bold text-[10px] uppercase mb-1">Version B Response (Regressed):</div>
                        {reg.responseB}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Instruction Diffs */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <Diff className="w-4 h-4 text-indigo-400" />
              <span>Instruction & Policy File Diffs</span>
            </h2>

            {comparison.fileDiffs.length > 0 ? (
              <div className="space-y-3">
                {comparison.fileDiffs.map(diff => (
                  <div key={diff.path} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-indigo-300 font-bold">{diff.path}</span>
                      <span className="text-amber-400 uppercase text-[10px]">{diff.status}</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                      {diff.diffText}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No policy file differences between these two commits.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
