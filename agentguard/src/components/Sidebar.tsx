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
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: regressionCount > 0 ? `${regressionCount} Regressions` : null,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    { id: 'workspace', label: 'Agent Workspace', icon: FileCode },
    {
      id: 'policy',
      label: 'Policy Editor',
      icon: ShieldAlert,
      badge: uncommittedDiffCount > 0 ? `${uncommittedDiffCount}` : null,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'pull_requests',
      label: 'Pull Requests',
      icon: GitPullRequest,
      badge: openPRCount > 0 ? `${openPRCount} Open` : null,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    { id: 'testlab', label: 'Test Lab', icon: TestTube2 },
    { id: 'compare', label: 'Version Compare', icon: GitCompare },
    {
      id: 'audit',
      label: 'Audit & Compliance',
      icon: ShieldCheck,
      badge: hasComplianceWarnings ? 'Alerts' : null,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    { id: 'history', label: 'Version History', icon: History },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Workbench Navigation
        </div>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
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
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span>GitAgent v2.2 Runtime</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Git-native AI agent developer workbench powered by @open-gitagent/gitagent.
        </p>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Git Policy Backend Connected</span>
        </div>
      </div>
    </aside>
  );
};
