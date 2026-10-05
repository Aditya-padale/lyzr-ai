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

  useEffect(() => {
    let isMounted = true;
    if (commitAHash && commitBHash) {
      setIsLoading(true);
      onFetchComparison(commitAHash, commitBHash)
        .then(data => {
          if (isMounted) setComparison(data);
        })
        .catch(e => console.error('Comparison error:', e))
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [commitAHash, commitBHash, onFetchComparison]);

  const handleManualRefresh = () => {
    if (!commitAHash || !commitBHash) return;
    setIsLoading(true);
    onFetchComparison(commitAHash, commitBHash)
      .then(data => setComparison(data))
      .catch(e => console.error('Comparison error:', e))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-indigo-600" />
            <span>Version Comparison & Regression Matrix</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Compare two Git versions side-by-side: prompt changes, test matrix deltas, and agent outputs.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Comparison</span>
        </button>
      </div>

      {/* Commit Picker Header */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Version A Selector */}
        <div className="md:col-span-5 space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Base Version (Version A)
          </label>
          <select
            value={commitAHash}
            onChange={e => setCommitAHash(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none font-mono"
          >
            {commits.map(c => (
              <option key={c.hash} value={c.hash}>
                {c.shortHash} - {c.message} ({new Date(c.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {/* Center Comparison Arrow */}
        <div className="md:col-span-1 flex justify-center text-slate-400">
          <ArrowRight className="w-5 h-5" />
        </div>

        {/* Version B Selector */}
        <div className="md:col-span-5 space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Target Version (Version B)
          </label>
          <select
            value={commitBHash}
            onChange={e => setCommitBHash(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none font-mono"
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
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                <span>{comparison.regressions.length} Regression(s) Detected in Target Version</span>
              </div>

              <div className="space-y-3">
                {comparison.regressions.map(reg => (
                  <div key={reg.scenarioId} className="bg-white border border-rose-200 rounded-xl p-4 space-y-2 text-xs shadow-2xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{reg.scenarioName}</span>
                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className="text-emerald-700 font-bold">{reg.statusA}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-rose-600 font-bold">{reg.statusB}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800">
                        <div className="text-emerald-700 font-bold text-[10px] uppercase mb-1">Version A Response:</div>
                        {reg.responseA}
                      </div>
                      <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-200 font-mono text-[11px] text-slate-800">
                        <div className="text-rose-700 font-bold text-[10px] uppercase mb-1">Version B Response (Regressed):</div>
                        {reg.responseB}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Instruction Diffs */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
              <Diff className="w-4 h-4 text-indigo-600" />
              <span>Instruction & Policy File Diffs</span>
            </h2>

            {comparison.fileDiffs.length > 0 ? (
              <div className="space-y-3">
                {comparison.fileDiffs.map(diff => (
                  <div key={diff.path} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-indigo-700 font-bold">{diff.path}</span>
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase text-[10px] font-bold">{diff.status}</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-100 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap">
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
