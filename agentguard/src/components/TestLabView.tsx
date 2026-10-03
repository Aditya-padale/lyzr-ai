'use client';

import React, { useState } from 'react';
import {
  TestTube2,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
  Plus,
  Trash2,
  Edit,
  ShieldAlert,
} from 'lucide-react';
import { TestScenario, TestExecution, VersionTestRun } from '@/lib/types';

interface TestLabViewProps {
  scenarios: TestScenario[];
  latestTestRun: VersionTestRun | null;
  onRunSingleScenario: (scenarioId: string) => Promise<TestExecution>;
  onRunTestSuite: () => Promise<VersionTestRun>;
  onSaveScenario: (scenario: TestScenario | Omit<TestScenario, 'id'>) => Promise<void>;
  onDeleteScenario: (scenarioId: string) => Promise<void>;
  isTesting: boolean;
}

export const TestLabView: React.FC<TestLabViewProps> = ({
  scenarios,
  latestTestRun,
  onRunSingleScenario,
  onRunTestSuite,
  onSaveScenario,
  onDeleteScenario,
  isTesting,
}) => {
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [singleExecutions, setSingleExecutions] = useState<Record<string, TestExecution>>({});
  const [expandedId, setExpandedId] = useState<string | null>(scenarios[0]?.id || null);

  // Scenario Modal State
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState<TestScenario | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TestScenario['category']>('normal');
  const [description, setDescription] = useState('');
  const [input, setInput] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [evaluationCriteria, setEvaluationCriteria] = useState<string>('');

  const handleRunSingle = async (scenarioId: string) => {
    setRunningScenarioId(scenarioId);
    try {
      const exec = await onRunSingleScenario(scenarioId);
      setSingleExecutions(prev => ({ ...prev, [scenarioId]: exec }));
      setExpandedId(scenarioId);
    } catch (e) {
      console.error('Error running single scenario:', e);
    } finally {
      setRunningScenarioId(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingScenario(null);
    setName('');
    setCategory('normal');
    setDescription('');
    setInput('');
    setExpectedBehavior('');
    setEvaluationCriteria('Polite greeting\nValid Order ID verification');
    setShowScenarioModal(true);
  };

  const handleOpenEditModal = (sc: TestScenario) => {
    setEditingScenario(sc);
    setName(sc.name);
    setCategory(sc.category);
    setDescription(sc.description);
    setInput(sc.input);
    setExpectedBehavior(sc.expectedBehavior);
    setEvaluationCriteria(sc.evaluationCriteria.join('\n'));
    setShowScenarioModal(true);
  };

  const handleSaveScenarioSubmit = async () => {
    if (!name.trim() || !input.trim()) return;

    const criteriaArray = evaluationCriteria
      .split('\n')
      .map(c => c.trim())
      .filter(Boolean);

    const payload = editingScenario
      ? {
          ...editingScenario,
          name,
          category,
          description,
          input,
          expectedBehavior,
          evaluationCriteria: criteriaArray,
        }
      : {
          name,
          category,
          description,
          input,
          expectedBehavior,
          evaluationCriteria: criteriaArray,
        };

    await onSaveScenario(payload as any);
    setShowScenarioModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <TestTube2 className="w-5 h-5 text-indigo-400" />
            <span>Agent Evaluation Test Lab</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Evaluate agent behavior against policy compliance rules, prompt injection attempts, and store constraints.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>New Test Scenario</span>
          </button>

          <button
            onClick={onRunTestSuite}
            disabled={isTesting}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition active:scale-95"
          >
            {isTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Test Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LLM Grading Disclosure Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 text-xs text-slate-400">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          <strong>Evaluation Note:</strong> Model outputs may vary between runs. Evaluations measure compliance against explicit criteria rules.
        </span>
      </div>

      {/* Test Suite Summary Banner */}
      {latestTestRun && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-mono">
              Latest Test Execution • Commit: {latestTestRun.commitHash.slice(0, 7)}
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-bold text-slate-100">{latestTestRun.passRate}% Pass Rate</span>
              <span className="text-xs text-slate-400">
                ({latestTestRun.passed} Passed, {latestTestRun.failed} Failed, {latestTestRun.inconclusive} Inconclusive)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  latestTestRun.passRate >= 80 ? 'bg-emerald-500' : latestTestRun.passRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${latestTestRun.passRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scenario List */}
      <div className="space-y-4">
        {scenarios.map(scenario => {
          const isExpanded = expandedId === scenario.id;
          const isSingleRunning = runningScenarioId === scenario.id;

          const execution = singleExecutions[scenario.id] || latestTestRun?.executions.find(e => e.scenarioId === scenario.id);
          const evalStatus = execution?.evaluation.status;

          return (
            <div
              key={scenario.id}
              className={`bg-slate-900/60 border rounded-2xl transition duration-150 overflow-hidden ${
                isExpanded ? 'border-slate-700 shadow-xl' : 'border-slate-800 hover:border-slate-700/60'
              }`}
            >
              {/* Item Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-slate-200">{scenario.name}</span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${
                        scenario.category === 'normal'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : scenario.category === 'prompt_injection'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : scenario.category === 'policy_violation'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {scenario.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{scenario.description}</p>
                </div>

                <div className="flex items-center space-x-3">
                  {evalStatus && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${
                        evalStatus === 'passed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : evalStatus === 'failed'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {evalStatus === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {evalStatus === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                      {evalStatus === 'inconclusive' && <AlertCircle className="w-3.5 h-3.5" />}
                      <span className="capitalize">{evalStatus}</span>
                    </span>
                  )}

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRunSingle(scenario.id);
                    }}
                    disabled={isSingleRunning}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition"
                  >
                    {isSingleRunning ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Run</span>
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleOpenEditModal(scenario);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                    title="Edit Scenario"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteScenario(scenario.id);
                    }}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-lg transition"
                    title="Delete Scenario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Detail Drawer */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/80 p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Test Input Prompt
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed">
                          "{scenario.input}"
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Expected Behavior
                        </div>
                        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                          {scenario.expectedBehavior}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Evaluation Criteria Breakdown
                      </div>
                      <div className="space-y-2">
                        {scenario.evaluationCriteria.map((criterion, idx) => {
                          const critRes = execution?.evaluation.criteriaResults.find(c => c.criterion === criterion);
                          const passed = critRes ? critRes.passed : false;

                          return (
                            <div
                              key={idx}
                              className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-medium text-slate-200">{criterion}</span>
                                {critRes && (
                                  <p className="text-[11px] text-slate-400">{critRes.explanation}</p>
                                )}
                              </div>
                              {execution && (
                                <span className={passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                  {passed ? 'PASSED' : 'FAILED'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {execution && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span className="text-indigo-400 font-bold">Actual Agent Response:</span>
                        <span>Executed in {execution.executionTimeMs}ms</span>
                      </div>
                      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {execution.agentResponse}
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded text-[11px] text-slate-400 border border-slate-800 flex items-center justify-between">
                        <span>Score: {execution.evaluation.score}%</span>
                        <span>{execution.evaluation.reasoning}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scenario CRUD Modal */}
      {showScenarioModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">
              {editingScenario ? 'Edit Test Scenario' : 'Create New Test Scenario'}
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Scenario Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 6. High Value Refund Escalation"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="policy_violation">Policy Violation</option>
                  <option value="missing_info">Missing Information</option>
                  <option value="conflicting_rules">Conflicting Rules</option>
                  <option value="prompt_injection">Prompt Injection</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  User Input Prompt
                </label>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Customer request prompt..."
                  className="w-full h-20 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Expected Behavior
                </label>
                <textarea
                  value={expectedBehavior}
                  onChange={e => setExpectedBehavior(e.target.value)}
                  placeholder="Agent should..."
                  className="w-full h-16 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Evaluation Criteria (One per line)
                </label>
                <textarea
                  value={evaluationCriteria}
                  onChange={e => setEvaluationCriteria(e.target.value)}
                  placeholder="Criterion 1&#10;Criterion 2"
                  className="w-full h-24 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowScenarioModal(false)}
                className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenarioSubmit}
                disabled={!name.trim() || !input.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Save Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
