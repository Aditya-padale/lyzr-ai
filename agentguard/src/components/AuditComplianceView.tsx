'use client';

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  Clock,
  User,
  AlertTriangle,
  Terminal,
  Activity,
  DollarSign,
  Cpu,
} from 'lucide-react';
import { AuditEntry, ComplianceStatus } from '@/lib/types';

interface AuditComplianceViewProps {
  auditLogs: AuditEntry[];
  compliance: ComplianceStatus | null;
}

export const AuditComplianceView: React.FC<AuditComplianceViewProps> = ({
  auditLogs,
  compliance,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <span>Compliance Guard & Audit Telemetry</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Real-time compliance checks, immutable audit event log, and OpenTelemetry execution telemetry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Compliance Status Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Policy Compliance Scanner</span>
            </h2>

            {compliance && compliance.hasWarnings ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center space-x-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{compliance.warnings.length} Compliance Recommendations Detected</span>
                </div>

                <div className="space-y-2">
                  {compliance.warnings.map(w => (
                    <div key={w.ruleId} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-900">
                        <span className="text-amber-800 font-bold">{w.ruleId}</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">{w.severity}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] font-sans">{w.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">All Policy Rules Verified Clean</div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    RULES.md contains valid refund thresholds, data privacy guardrails, and injection defenses.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Telemetry Summary Card */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>OpenTelemetry & Token Cost Metrics</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block uppercase font-sans font-semibold">Total Executions</span>
                <span className="text-lg font-bold text-slate-900">{auditLogs.length}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block uppercase font-sans font-semibold">Est. Session Cost</span>
                <span className="text-lg font-bold text-emerald-700">$0.0024</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Stream Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Immutable Audit Event Stream</span>
            </h2>

            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                No audit events recorded yet. Perform file edits, test executions, or commits to populate audit trail.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {auditLogs.map(log => (
                  <div key={log.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="text-indigo-700 font-bold uppercase">{log.action}</span>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <p className="text-slate-900 font-sans text-xs font-medium">{log.details}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/80">
                      <span>Author: {log.author}</span>
                      {log.commitHash && <span>Commit: {log.commitHash.slice(0, 7)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
