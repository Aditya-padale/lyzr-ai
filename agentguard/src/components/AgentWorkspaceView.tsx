'use client';

import React, { useState } from 'react';
import {
  FileCode,
  Save,
  Play,
  Terminal,
  Check,
  AlertCircle,
  Cpu,
  Clock,
  Sparkles,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import { AgentFile } from '@/lib/types';

interface AgentWorkspaceViewProps {
  files: AgentFile[];
  onSaveFile: (filePath: string, content: string) => Promise<void>;
  onRunAgent: (prompt: string) => Promise<any>;
}

export const AgentWorkspaceView: React.FC<AgentWorkspaceViewProps> = ({
  files,
  onSaveFile,
  onRunAgent,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>(files[0]?.path || 'RULES.md');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [fileContents, setFileContents] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    files.forEach(f => {
      map[f.path] = f.content;
    });
    return map;
  });

  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // New file modal state
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  // Live Agent Terminal State
  const [testPrompt, setTestPrompt] = useState('Hi AcmeBot! Can I get a refund for Order ORD-9821 of $45?');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const activeContent = fileContents[selectedFile] ?? (files.find(f => f.path === selectedFile)?.content || '');
  const isModified = activeContent !== (files.find(f => f.path === selectedFile)?.content || '');

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'instruction', label: 'Instructions' },
    { id: 'skill', label: 'Skills' },
    { id: 'config', label: 'Configs' },
    { id: 'memory', label: 'Memory' },
    { id: 'test', label: 'Tests' },
  ];

  const filteredFiles = activeCategory === 'all' ? files : files.filter(f => f.category === activeCategory);

  const handleContentChange = (val: string) => {
    setFileContents(prev => ({ ...prev, [selectedFile]: val }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveFile(selectedFile, activeContent);
      setSavedStatus(prev => ({ ...prev, [selectedFile]: true }));
      setTimeout(() => setSavedStatus(prev => ({ ...prev, [selectedFile]: false })), 2000);
    } catch (e) {
      console.error('Error saving file:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewFile = async () => {
    if (!newFilePath.trim()) return;
    setIsSaving(true);
    try {
      await onSaveFile(newFilePath.trim(), newFileContent || '# New Policy File\n');
      setSelectedFile(newFilePath.trim());
      setShowNewFileModal(false);
      setNewFilePath('');
      setNewFileContent('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunAgentPrompt = async () => {
    if (!testPrompt.trim()) return;
    setIsExecuting(true);
    try {
      const res = await onRunAgent(testPrompt);
      setExecutionResult(res);
    } catch (e) {
      console.error('Execution error:', e);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <span>Agent Workspace & File Inspector</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Inspect & edit GitAgent instruction files, skill definitions, MCP configs, and system prompts.
          </p>
        </div>

        <button
          onClick={() => setShowNewFileModal(true)}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>New Policy File</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* File Navigation Panel */}
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600/30 text-indigo-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* File List */}
            <div className="space-y-1">
              {filteredFiles.map(file => {
                const isCurrent = file.path === selectedFile;
                const fileIsModified = (fileContents[file.path] ?? file.content) !== file.content;

                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition ${
                      isCurrent
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{file.path}</span>
                    </div>

                    {fileIsModified && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">GitAgent Conventions</div>
            <p className="text-slate-500 leading-relaxed">
              <strong className="text-slate-400">RULES.md</strong>: Safety policies<br />
              <strong className="text-slate-400">SOUL.md</strong>: Agent persona<br />
              <strong className="text-slate-400">skills/</strong>: Executable skills
            </p>
          </div>
        </div>

        {/* File Editor */}
        <div className="lg:col-span-9 space-y-4 flex flex-col">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden">
            {/* Editor Header */}
            <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-mono text-xs text-slate-200">
                <span className="text-indigo-400">editing:</span>
                <span className="font-bold">{selectedFile}</span>
                {isModified && (
                  <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] px-2 py-0.5 rounded font-sans">
                    Unsaved Draft
                  </span>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={!isModified || isSaving}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition"
              >
                {savedStatus[selectedFile] ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save File'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Textarea Editor */}
            <div className="p-4 flex-1 bg-slate-950/90 font-mono text-xs text-slate-200 min-h-[350px]">
              <textarea
                value={activeContent}
                onChange={e => handleContentChange(e.target.value)}
                className="w-full h-full min-h-[340px] bg-transparent resize-none outline-none font-mono leading-relaxed text-slate-200 selection:bg-indigo-500/30"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Interactive Agent Terminal */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Live Agent Terminal Execution</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">GitAgent v2.2 SDK</span>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                placeholder="Ask the active agent a prompt..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none font-mono"
              />
              <button
                onClick={handleRunAgentPrompt}
                disabled={isExecuting}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition"
              >
                {isExecuting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Execute Query</span>
                  </>
                )}
              </button>
            </div>

            {/* Execution Result Box */}
            {executionResult && (
              <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="text-indigo-400 font-bold">Execution Output:</span>
                  <div className="flex items-center space-x-3">
                    <span>Model: {executionResult.model}</span>
                    <span>Time: {executionResult.executionTimeMs}ms</span>
                    <span>Tokens: {executionResult.tokensUsed?.total || 0}</span>
                  </div>
                </div>

                <div className="text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed whitespace-pre-wrap">
                  {executionResult.output}
                </div>

                {executionResult.toolCalls && executionResult.toolCalls.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[11px]">Tool Calls Executed:</span>
                    <div className="flex flex-wrap gap-2">
                      {executionResult.toolCalls.map((t: any, idx: number) => (
                        <span key={idx} className="bg-slate-900 border border-slate-800 text-purple-300 px-2 py-1 rounded text-[11px]">
                          {t.name}({JSON.stringify(t.args)})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Create New Policy File</h3>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  File Path (e.g. skills/refund-check/SKILL.md or KNOWLEDGE.md)
                </label>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={e => setNewFilePath(e.target.value)}
                  placeholder="skills/new-skill/SKILL.md"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Initial Content
                </label>
                <textarea
                  value={newFileContent}
                  onChange={e => setNewFileContent(e.target.value)}
                  placeholder="# File content..."
                  className="w-full h-32 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowNewFileModal(false)}
                className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewFile}
                disabled={!newFilePath.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
