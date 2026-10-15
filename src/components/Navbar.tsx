import React from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  Crosshair, 
  HeartHandshake, 
  Flame, 
  Dna, 
  Terminal, 
  Boxes, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Moon,
  Sun,
  Globe,
  ChevronDown,
  Home
} from 'lucide-react';
import { UserProfile } from '../types/user.js';

export type NavTab = 
  | 'dashboard' 
  | 'targets' 
  | 'heartbeats' 
  | 'incident' 
  | 'bioscience' 
  | 'metrics' 
  | 'docker';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isChecking: boolean;
  onRefreshAll: () => void;
  healthScore: number;
  firingAlertsCount: number;
  autoRefreshInterval: number;
  onChangeAutoRefresh: (seconds: number) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: UserProfile;
  onOpenUserModal: () => void;
  onGoToLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isChecking,
  onRefreshAll,
  healthScore,
  firingAlertsCount,
  autoRefreshInterval,
  onChangeAutoRefresh,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onOpenUserModal,
  onGoToLanding,
}) => {
  interface TabItem {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Grafana View', icon: LayoutDashboard },
    { id: 'targets', label: 'Targets & Probes', icon: Crosshair },
    { id: 'heartbeats', label: 'Cron Heartbeats', icon: HeartHandshake },
    { id: 'incident', label: 'Incident Sim', icon: Flame, badge: firingAlertsCount > 0 ? firingAlertsCount : undefined },
    { id: 'bioscience', label: 'Bioscience Hub', icon: Dna },
    { id: 'metrics', label: 'Prometheus', icon: Terminal },
    { id: 'docker', label: 'Docker / Config', icon: Boxes },
  ];

  return (
    <header className={`border-b transition-all duration-300 ${
      isDarkMode 
        ? 'bg-[#14161a]/95 border-zinc-800/80 text-zinc-100 backdrop-blur-md' 
        : 'bg-white/95 border-slate-200/80 text-slate-800 backdrop-blur-md'
    } sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onGoToLanding}
              className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-400 text-white shadow-md shadow-indigo-500/20 hover:scale-105 transition"
              title="Return to Public Landing Page"
            >
              <Activity className="w-5 h-5 animate-pulse" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToLanding}
                  className={`font-extrabold tracking-tight text-lg hover:text-cyan-400 transition ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}
                  title="Return to Landing Page"
                >
                  BioPulse SRE
                </button>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Real Probes Active
                </span>
                {firingAlertsCount > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    {firingAlertsCount} Alert{firingAlertsCount > 1 ? 's' : ''} Firing
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    {healthScore}% Healthy
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'} hidden sm:block`}>
                  Live Telemetry Radar · Scoped Workspace for {currentUser.name}
                </p>
                {onGoToLanding && (
                  <button
                    onClick={onGoToLanding}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 border-b border-cyan-500/30 pb-0.5 transition"
                  >
                    <Home className="w-3 h-3" />
                    <span>Home Page</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Controls & User Account Switcher */}
          <div className="flex items-center gap-2.5">
            {/* User Account & Isolated Dashboard Trigger */}
            <button
              onClick={onOpenUserModal}
              title={`Logged in as ${currentUser.email} (${currentUser.clusterName})`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all duration-300 shadow-sm ${
                isDarkMode
                  ? 'bg-[#1a1d24] border-zinc-700/80 hover:border-indigo-500/60 text-zinc-200'
                  : 'bg-slate-50 border-slate-300 hover:border-indigo-400 text-slate-700'
              }`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover border border-indigo-400"
              />
              <div className="flex flex-col text-left leading-tight hidden md:block">
                <span className="font-semibold text-[11px] flex items-center gap-1">
                  {currentUser.name}
                </span>
                <span className="text-[9px] text-zinc-400 font-mono">
                  {currentUser.clusterName}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {/* 100% Free Forever Badge */}
            <button
              onClick={onOpenUserModal}
              title="100% Free Architecture ($0 Cost forever) - Click to view details"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isDarkMode
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Free ($0)</span>
            </button>

            {/* GitHub Pages Live Badge */}
            <button
              onClick={onOpenUserModal}
              title="GitHub Pages Live Deployment status and settings"
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isDarkMode
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20'
                  : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>GH Pages Ready</span>
            </button>

            {/* Auto refresh dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`text-[11px] font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Auto:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => onChangeAutoRefresh(Number(e.target.value))}
                className={`text-xs rounded-full px-3 py-1 font-mono border focus:outline-none transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-[#1e2229] border-zinc-700 text-zinc-200'
                    : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <option value={0}>Off</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>

            {/* Run Probes Button */}
            <button
              onClick={onRefreshAll}
              disabled={isChecking}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 active:scale-95 ${
                isChecking
                  ? 'bg-indigo-500/30 text-indigo-300 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isChecking ? 'Probing...' : 'Run Checks'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Grafana Dark Theme'}
              className={`p-2 rounded-full border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-[#1e2229] border-zinc-700 text-amber-400 hover:text-amber-300 shadow-sm'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation with Smooth Rounded Full Pills */}
        <nav className="flex space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as NavTab)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold'
                    : isDarkMode
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
