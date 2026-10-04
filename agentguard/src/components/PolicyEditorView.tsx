'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Save,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Diff,
  FileCode,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { AgentFile, FileDiff } from '@/lib/types';

interface PolicyEditorViewProps {
  files: AgentFile[];
  uncommittedDiffs: FileDiff[];
  onSaveFile: (filePath: string, content: string) => Promise<void>;
  onCommitChanges: (message: string) => Promise<boolean | { success: boolean; error?: string }>;
  onRunTestSuite: () => void;
}

export const PolicyEditorView: React.FC<PolicyEditorViewProps> = ({
  files,
  uncommittedDiffs,
  onSaveFile,
  onCommitChanges,
  onRunTestSuite,
}) => {
  const rulesFile = files.find(f => f.path === 'RULES.md');
  const soulFile = files.find(f => f.path === 'SOUL.md');

  const [activeTab, setActiveTab] = useState<'RULES.md' | 'SOUL.md'>('RULES.md');
  const [rulesContent, setRulesContent] = useState<string>(rulesFile?.content || '');
  const [soulContent, setSoulContent] = useState<string>(soulFile?.content || '');

  const [commitMessage, setCommitMessage] = useState<string>('policy: update refund limits & safety guardrails');
  const [isCommitting, setIsCommitting] = useState(false);
  const [showDiff, setShowDiff] = useState(true);

  const currentContent = activeTab === 'RULES.md' ? rulesContent : soulContent;
  const originalContent = (activeTab === 'RULES.md' ? rulesFile?.content : soulFile?.content) || '';
  const isDirty = currentContent !== originalContent;

  const handleSavePolicyDraft = async () => {
    await onSaveFile(activeTab, currentContent);
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    setIsCommitting(true);
    try {
      // First save active content if edited
      if (isDirty) {
        await onSaveFile(activeTab, currentContent);
      }
      const res = await onCommitChanges(commitMessage);
      const ok = typeof res === 'boolean' ? res : res.success;
      if (ok) {
        setCommitMessage('');
      }
    } catch (e) {
      console.error('Commit error:', e);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <span>Behavioral Policy Editor</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Modify agent instructions, safety policies, and constraint rules with pre-commit validation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showDiff
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showDiff ? 'Hide Diff Preview' : 'Show Diff Preview'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Policy Editor Column */}
        <div className={showDiff ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            {/* File Switcher Header */}
            <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('RULES.md')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                    activeTab === 'RULES.md'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  RULES.md (Policies)
                </button>
                <button
                  onClick={() => setActiveTab('SOUL.md')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                    activeTab === 'SOUL.md'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SOUL.md (Persona)
                </button>
              </div>

              {isDirty && (
                <button
                  onClick={handleSavePolicyDraft}
                  className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 transition"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Draft</span>
                </button>
              )}
            </div>

            {/* Policy Editor Area */}
            <div className="p-4 bg-slate-950/90 font-mono text-xs text-slate-200 min-h-[380px]">
              <textarea
                value={currentContent}
                onChange={e => {
                  if (activeTab === 'RULES.md') setRulesContent(e.target.value);
                  else setSoulContent(e.target.value);
                }}
                className="w-full h-full min-h-[360px] bg-transparent resize-none outline-none font-mono leading-relaxed text-slate-200"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Git Commit Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <GitCommit className="w-4 h-4 text-indigo-400" />
                <span>Save Version with Git Commit</span>
              </h2>
              {uncommittedDiffs.length > 0 && (
                <span className="text-xs text-amber-400 font-mono">
                  {uncommittedDiffs.length} file{uncommittedDiffs.length > 1 ? 's' : ''} modified
                </span>
              )}
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                placeholder="Commit message (e.g. policy: adjust refund limit to $150)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none font-mono"
              />

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  Every saved version creates an immutable Git commit SHA.
                </p>
                <button
                  onClick={handleCommit}
                  disabled={isCommitting || !commitMessage.trim()}
                  className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition active:scale-95"
                >
                  <GitCommit className="w-4 h-4" />
                  <span>{isCommitting ? 'Committing...' : 'Commit Version to Git'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Diff Preview Column */}
        {showDiff && (
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                  <Diff className="w-4 h-4 text-indigo-400" />
                  <span>Git Diff Preview</span>
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">HEAD vs Working Tree</span>
              </div>

              {uncommittedDiffs.length > 0 ? (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {uncommittedDiffs.map(diff => (
                    <div key={diff.path} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-indigo-300 font-semibold">{diff.path}</span>
                        <span className="text-amber-400 uppercase text-[10px]">{diff.status}</span>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded border border-slate-800/80 overflow-x-auto whitespace-pre-wrap">
                        {diff.diffText}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p>No uncommitted changes in working tree.</p>
                  <p className="text-slate-600 text-[11px]">Edit RULES.md or SOUL.md to view live diffs.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
