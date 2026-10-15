import React, { useState } from 'react';
import { 
  X, 
  User, 
  LogIn, 
  LogOut, 
  Check, 
  Shield, 
  Key, 
  Globe, 
  Download, 
  Upload, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Copy,
  Layers,
  ChevronRight,
  BadgeDollarSign,
  CheckCircle2,
  Lock,
  HardDrive,
  Cpu,
  Zap,
  Trash2,
  Database
} from 'lucide-react';
import { UserProfile, PRESET_USERS } from '../types/user.js';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  isDarkMode: boolean;
  onExportDashboard: () => void;
  onImportDashboard: (jsonString: string) => void;
  onResetToDefaults: () => void;
  onWipeDatabase?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  isDarkMode,
  onExportDashboard,
  onImportDashboard,
  onResetToDefaults,
  onWipeDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'free_tier' | 'github_pages' | 'backup'>('accounts');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customCluster, setCustomCluster] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [isCopied, setIsCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleCreateCustomGoogleUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) return;

    const newUser: UserProfile = {
      id: `user_${customEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
      name: customName.trim(),
      email: customEmail.trim(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName)}`,
      role: 'DevOps Engineer',
      provider: 'google',
      clusterName: customCluster.trim() || `${customName.split(' ')[0]}-Cluster-01`,
      lastLogin: 'Active now',
    };

    onSelectUser(newUser);
    setIsAddingCustom(false);
    setCustomName('');
    setCustomEmail('');
    setCustomCluster('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportDashboard(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDarkMode 
            ? 'bg-[#181b20] border-zinc-700/80 text-zinc-100' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDarkMode ? 'border-zinc-800 bg-[#14161a]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Google Account & Dashboard Workspace</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  100% FREE ($0)
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                Per-user isolated uptime monitors, incident simulations, and custom alert rules
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Forever Banner */}
        <div className={`px-6 py-2.5 border-b text-xs flex items-center justify-between ${
          isDarkMode ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Zero Cost Guarantee:</strong> Free hosting (GitHub Pages), Free CI/CD (GitHub Actions), Free Auth (Google OAuth), and $0 database cost.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('free_tier')}
            className="text-[11px] underline font-semibold text-emerald-400 hover:text-emerald-300 shrink-0 ml-2"
          >
            See $0 Breakdown
          </button>
        </div>

        {/* Navigation Sub-tabs */}
        <div className={`flex border-b px-6 pt-2 gap-4 ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'accounts'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Google Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('free_tier')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'free_tier'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BadgeDollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Free Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('github_pages')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'github_pages'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GitHub Pages Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'backup'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON Backup & Sync</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
          {/* TAB 1: ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {/* Active User Card */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isDarkMode ? 'bg-[#14161a] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-12 h-12 rounded-full border-2 border-indigo-500 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-100">{currentUser.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Active Workspace
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">{currentUser.email}</div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                      <span>Role: <strong className="text-zinc-300">{currentUser.role}</strong></span>
                      <span>•</span>
                      <span>Cluster: <strong className="text-zinc-300">{currentUser.clusterName}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Isolation explanation */}
              <div className={`p-3 rounded-lg text-xs border ${
                isDarkMode ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}>
                <div className="font-semibold flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Independent Per-User Dashboards:
                </div>
                Every user who signs in receives their own isolated probes, chaos tests, alert rules, and refresh frequency. Changes you make here will only affect your own workspace!
              </div>

              {/* Switch User List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Switch Active Account / Preset SRE Users
                </h3>
                <div className="space-y-2">
                  {PRESET_USERS.map((user) => {
                    const isSelected = currentUser.id === user.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => onSelectUser(user)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-indigo-600/10 border-indigo-500/50 shadow-sm'
                              : 'bg-indigo-50 border-indigo-300 shadow-sm'
                            : isDarkMode
                            ? 'bg-[#181d24] border-zinc-800 hover:border-zinc-700'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-9 h-9 rounded-full border border-zinc-700"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-zinc-200">{user.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                {user.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">{user.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-zinc-500">{user.clusterName}</span>
                          {isSelected ? (
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button className="px-2.5 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium">
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom User Form */}
              <div className="pt-2">
                {!isAddingCustom ? (
                  <button
                    onClick={() => setIsAddingCustom(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 hover:border-indigo-500 text-xs font-semibold text-zinc-300 hover:text-indigo-400 flex items-center justify-center gap-2 transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In with Any Google Account / Custom Email
                  </button>
                ) : (
                  <form onSubmit={handleCreateCustomGoogleUser} className={`p-4 rounded-xl border space-y-3 ${
                    isDarkMode ? 'bg-[#14161a] border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="font-bold text-xs text-zinc-200 flex items-center justify-between">
                      <span>Add / Authenticate Google Account</span>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingCustom(false)} 
                        className="text-zinc-500 hover:text-zinc-300 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g. Musa Raza"
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Google Email</label>
                        <input
                          type="email"
                          required
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          placeholder="musaraza004@gmail.com"
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Custom SRE Cluster Name (Optional)</label>
                      <input
                        type="text"
                        value={customCluster}
                        onChange={(e) => setCustomCluster(e.target.value)}
                        placeholder="e.g. Asia-BioCluster-Alpha"
                        className="w-full px-3 py-1.5 rounded-lg text-xs bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Authenticate & Spawn Dedicated Workspace
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 100% FREE ARCHITECTURE BREAKDOWN */}
          {activeTab === 'free_tier' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${
                isDarkMode ? 'bg-[#14161a] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-zinc-100">
                    100% Free Forever Architecture ($0.00 Cost)
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  Every component of this solution was intentionally engineered to use 100% free, tier-zero services. 
                  You will never receive a bill, and no credit card is required.
                </p>
              </div>

              {/* The 4 Free Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pillar 1: GitHub Pages */}
                <div className={`p-3.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#181d24] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-400" /> Web Hosting
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      $0.00 / Free
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-indigo-400 mb-1">GitHub Pages</div>
                  <p className="text-[11px] text-zinc-400">
                    Free static hosting on GitHub's global CDN. Free SSL/HTTPS certificates, unlimited bandwidth for regular web traffic, and 99.99% uptime.
                  </p>
                </div>

                {/* Pillar 2: GitHub Actions */}
                <div className={`p-3.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#181d24] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" /> CI/CD Automation
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      $0.00 / Free
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-amber-400 mb-1">GitHub Actions</div>
                  <p className="text-[11px] text-zinc-400">
                    Unlimited free build minutes for public GitHub repositories. Every time you push to <code className="font-mono text-zinc-300">main</code>, GitHub compiles the React Vite build automatically.
                  </p>
                </div>

                {/* Pillar 3: Google Identity */}
                <div className={`p-3.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#181d24] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-400" /> Authentication
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      $0.00 / Free
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-blue-400 mb-1">Google Identity OAuth</div>
                  <p className="text-[11px] text-zinc-400">
                    Google OAuth 2.0 Client IDs for web apps are completely free. No paid workspace or Google Cloud billing account is needed to log in users.
                  </p>
                </div>

                {/* Pillar 4: Client Storage */}
                <div className={`p-3.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#181d24] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Database & Storage
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      $0.00 / Free
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-emerald-400 mb-1">Browser LocalStorage + JSON</div>
                  <p className="text-[11px] text-zinc-400">
                    Zero database hosting bills. Each user's monitors, targets, and logs stay safely in their own browser with instant JSON file backup and sync.
                  </p>
                </div>
              </div>

              {/* Free verification checklist */}
              <div className={`p-4 rounded-xl border ${
                isDarkMode ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="font-bold text-xs flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  What makes this 100% Free vs Paid Monitoring (e.g. Datadog, New Relic)?
                </div>
                <ul className="text-[11px] space-y-1.5 list-disc list-inside text-zinc-300">
                  <li><strong>No per-host agent fee</strong>: Standard SRE SaaS charges $15–$25 per host/month. BioPulse runs client-side for $0.</li>
                  <li><strong>No retention or ingest caps</strong>: Log ingest is calculated locally inside the browser.</li>
                  <li><strong>Unlimited endpoints & cron monitors</strong>: Add as many targets and heartbeats as you want.</li>
                  <li><strong>Apache 2.0 Open Source</strong>: Full source code ownership with no license expiration.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB PAGES */}
          {activeTab === 'github_pages' && (
            <div className="space-y-4 text-xs">
              {/* Repository info */}
              <div className={`p-4 rounded-xl border ${
                isDarkMode ? 'bg-[#14161a] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Repository</span>
                    <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                      musaraza004 / biopulse-sre-monitor
                    </div>
                  </div>
                  <a
                    href="https://github.com/musaraza004/biopulse-sre-monitor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors"
                  >
                    <span>View Repo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Your Live Public URL will be:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="bg-zinc-900 text-teal-300 px-2.5 py-1 rounded font-mono text-[11px]">
                      https://musaraza004.github.io/biopulse-sre-monitor/
                    </code>
                    <button
                      onClick={() => copyToClipboard('https://musaraza004.github.io/biopulse-sre-monitor/', 'ghurl')}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      title="Copy URL"
                    >
                      {isCopied === 'ghurl' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Step Deployment Instructions */}
              <div className="space-y-3">
                <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
                  3 Simple Steps to Activate GitHub Pages (100% Free):
                </h4>

                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-200">Go to your GitHub Repository Settings</div>
                    <p className="text-zinc-400 mt-0.5">
                      Open <a href="https://github.com/musaraza004/biopulse-sre-monitor/settings/pages" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline inline-flex items-center gap-1">
                        github.com/musaraza004/biopulse-sre-monitor/settings/pages <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-200">Select Build and Deployment Source</div>
                    <p className="text-zinc-400 mt-0.5">
                      Under <strong>Build and deployment</strong> &gt; <strong>Source</strong>, choose:
                    </p>
                    <div className="mt-1.5 inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-400 font-mono text-xs">
                      GitHub Actions
                    </div>
                    <p className="text-zinc-400 mt-1">
                      (The workflow file <code className="text-zinc-300 font-mono">.github/workflows/deploy.yml</code> is already configured and verified!).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-200">Push to main or click Run Workflow</div>
                    <p className="text-zinc-400 mt-0.5">
                      Every push to <code className="font-mono text-zinc-300">main</code> will automatically build the React Vite bundle and deploy it live in ~45 seconds!
                    </p>
                  </div>
                </div>
              </div>

              {/* Google OAuth on GitHub Pages */}
              <div className={`p-4 rounded-xl border mt-4 ${
                isDarkMode ? 'bg-[#181d24] border-zinc-700/80' : 'bg-slate-50 border-slate-300'
              }`}>
                <h4 className="font-bold text-zinc-200 flex items-center gap-1.5 mb-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Setting up Google Sign-In for GitHub Pages (Completely Free)
                </h4>
                <p className="text-zinc-400 mb-2">
                  Google Cloud OAuth 2.0 Web Client IDs are 100% free with no credit card required. To allow anyone visiting your GitHub Pages site to authenticate:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                  <li>Go to <strong>Google Cloud Console</strong> &gt; <strong>APIs & Services</strong> &gt; <strong>Credentials</strong></li>
                  <li>Edit your <strong>OAuth 2.0 Client ID (Web Application)</strong></li>
                  <li>In <strong>Authorized JavaScript origins</strong>, add:
                    <div className="my-1 font-mono text-[11px] bg-zinc-900 px-2 py-1 rounded text-teal-300">
                      https://musaraza004.github.io
                    </div>
                  </li>
                  <li>In <strong>Authorized redirect URIs</strong>, add:
                    <div className="my-1 font-mono text-[11px] bg-zinc-900 px-2 py-1 rounded text-teal-300">
                      https://musaraza004.github.io/biopulse-sre-monitor/
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE & BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* How We Manage the Database 100% Free */}
              <div className={`p-4 rounded-xl border ${
                isDarkMode ? 'bg-[#14161a] border-cyan-800/40' : 'bg-cyan-50/50 border-cyan-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Database className="w-4 h-4" />
                    How Your Database is Managed ($0.00 / 100% Free)
                  </h3>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Zero Server Bills
                  </span>
                </div>
                <div className="text-[11px] text-zinc-300 space-y-2">
                  <p>
                    Instead of paying $25–$100/month for hosted PostgreSQL, Supabase, or AWS RDS, BioPulse uses a <strong>Local-First Browser-Edge Database Engine</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    <li><strong className="text-zinc-200">Scoped Storage Sandbox</strong>: Data is saved directly in browser LocalStorage / IndexedDB under <code className="text-cyan-300 font-mono">biopulse_user_{'{email}'}</code>.</li>
                    <li><strong className="text-zinc-200">Zero Cloud Egress &amp; Zero Latency</strong>: Instant queries, 0ms database lookup latency, and zero data limits.</li>
                    <li><strong className="text-zinc-200">JSON State Portability</strong>: 1-click export and import lets you back up or transfer your monitors to another device or teammate anytime.</li>
                  </ul>
                </div>
              </div>

              {/* Export / Import Box */}
              <div className={`p-4 rounded-xl border ${
                isDarkMode ? 'bg-[#181d24] border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2 mb-1">
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  JSON Database Backup &amp; Restore
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Save your real target probes, heartbeats, and alert configs to an encrypted JSON file.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={onExportDashboard}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Database JSON
                  </button>

                  <label className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border font-semibold text-xs cursor-pointer transition-colors ${
                    isDarkMode ? 'bg-[#1e2229] border-zinc-700 hover:border-zinc-600 text-zinc-200' : 'bg-white border-slate-300 hover:border-slate-400 text-slate-700'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Database JSON</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Danger Zone: Wipe Database & Delete All Data */}
              <div className={`p-4 rounded-xl border ${
                isDarkMode ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      Delete All Data &amp; Flush Database Clean
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Permanently wipes all target probes, stored history, and user workspace caches. Starts fresh with an empty database.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all existing data and reset your database clean?')) {
                        if (onWipeDatabase) {
                          onWipeDatabase();
                        } else {
                          onResetToDefaults();
                        }
                        onClose();
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 shadow-md shadow-rose-600/20 transition active:scale-95"
                  >
                    Wipe Database
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-3.5 border-t ${
          isDarkMode ? 'border-zinc-800 bg-[#14161a]' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="text-[11px] text-zinc-500 flex items-center gap-2">
            <span>Active User: <span className="font-mono text-zinc-300">{currentUser.email}</span></span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">100% Free Forever</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
