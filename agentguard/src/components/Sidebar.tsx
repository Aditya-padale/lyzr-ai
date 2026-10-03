'use client';

import React from 'react';
import {
  LayoutDashboard,
  FileCode,
  ShieldAlert,
  GitPullRequest,
  TestTube2,
  GitCompare,
  ShieldCheck,
  History,
  Terminal,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  uncommittedDiffCount: number;
  regressionCount: number;
  openPRCount: number;
  hasComplianceWarnings: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  uncommittedDiffCount,
  regressionCount,
  openPRCount,
  hasComplianceWarnings,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: regressionCount > 0 ? `${regressionCount} Regressions` : null, badgeColor: 'bg-rose-950 text-rose-300 border-rose-800' },
    { id: 'workspace', label: 'Agent Workspace', icon: FileCode },
    { id: 'policy', label: 'Policy Editor', icon: ShieldAlert, badge: uncommittedDiffCount > 0 ? `${uncommittedDiffCount}` : null, badgeColor: 'bg-amber-950 text-amber-300 border-amber-800' },
    { id: 'pull_requests', label: 'Pull Requests', icon: GitPullRequest, badge: openPRCount > 0 ? `${openPRCount} Open` : null, badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    { id: 'testlab', label: 'Test Lab', icon: TestTube2 },
    { id: 'compare', label: 'Version Compare', icon: GitCompare },
    { id: 'audit', label: 'Audit & Compliance', icon: ShieldCheck, badge: hasComplianceWarnings ? 'Alerts' : null, badgeColor: 'bg-amber-950 text-amber-300 border-amber-800' },
    { id: 'history', label: 'Version History', icon: History },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Workbench Navigation
        </div>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* GitAgent Engine Info Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>GitAgent v2.2 Runtime</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Git-native AI agent developer workbench powered by @open-gitagent/gitagent.
        </p>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Git Policy Backend Connected</span>
        </div>
      </div>
    </aside>
  );
};
