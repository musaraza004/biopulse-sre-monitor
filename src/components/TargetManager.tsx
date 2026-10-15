import React, { useState } from 'react';
import { MonitoredTarget, ServiceCategory } from '../types/monitor.js';
import { 
  Crosshair, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Globe, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface TargetManagerProps {
  targets: MonitoredTarget[];
  isDarkMode: boolean;
  onCheckTarget: (id: string) => Promise<void>;
  onAddTarget: (newTarget: Partial<MonitoredTarget>) => Promise<void>;
  onDeleteTarget?: (id: string) => Promise<void>;
  onResetTargets?: () => Promise<void>;
  selectedTargetId?: string;
  onSelectTarget: (id: string) => void;
}

export const TargetManager: React.FC<TargetManagerProps> = ({
  targets,
  isDarkMode,
  onCheckTarget,
  onAddTarget,
  onDeleteTarget,
  onResetTargets,
  selectedTargetId,
  onSelectTarget
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('ecommerce');
  const [expectedCodes, setExpectedCodes] = useState('200');
  const [intervalSec, setIntervalSec] = useState('60');
  const [expectedDnsA, setExpectedDnsA] = useState('');
  const [checkSsl, setCheckSsl] = useState(true);
  const [checkDns, setCheckDns] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTarget = targets.find(t => t.id === selectedTargetId) || targets[0];

  const handleTestTarget = async (id: string) => {
    setCheckingId(id);
    try {
      await onCheckTarget(id);
    } finally {
      setCheckingId(null);
    }
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const parsedCodes = expectedCodes.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      const dnsArray = expectedDnsA.split(',').map(s => s.trim()).filter(Boolean);

      await onAddTarget({
        id,
        name,
        url,
        category,
        expectedStatusCodes: parsedCodes.length > 0 ? parsedCodes : [200],
        intervalSeconds: parseInt(intervalSec, 10) || 60,
        timeoutMs: 8000,
        expectedDnsRecords: dnsArray.length > 0 ? { A: dnsArray } : undefined,
        checkSsl,
        checkDns
      });

      setIsAdding(false);
      setName('');
      setUrl('');
      setExpectedDnsA('');
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to add target');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Smooth 3XL Curvature */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Monitored Endpoints & Active Probes</h1>
          </div>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'} mt-1`}>
            Configure live website URLs, expected HTTP status codes, check intervals, SSL inspection, and DNS match validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onResetTargets && (
            <button
              onClick={onResetTargets}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border border-zinc-700 hover:bg-zinc-800 transition-all duration-200"
              title="Reset targets to clean default URLs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          )}

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Cancel' : 'Add Endpoint'}</span>
          </button>
        </div>
      </div>

      {/* Add Target Modal / Form with Smooth 3XL Curvature */}
      {isAdding && (
        <form onSubmit={handleSubmitNew} className={`p-6 rounded-3xl border transition-all duration-300 ${
          isDarkMode ? 'bg-[#1a1d24] border-indigo-500/40' : 'bg-indigo-50/50 border-indigo-200'
        } space-y-4 shadow-xl`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Live Monitored Target
            </h2>
            <span className={`text-[10px] font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              SSRF & Scheme Protected
            </span>
          </div>

          {submitError && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
              isDarkMode ? 'bg-rose-950/50 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
            }`}>
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span><strong>Validation Error:</strong> {submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className={`block font-medium mb-1.5 ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>Target Name</label>
              <input
                type="text"
                required
                placeholder="e.g. My Magento Storefront"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none transition-all ${
                  isDarkMode ? 'bg-[#14161a] border-zinc-700 text-zinc-100 focus:border-indigo-400' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className={`block font-medium mb-1.5 ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>Target URL (HTTP or HTTPS)</label>
              <input
                type="url"
                required
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none transition-all ${
                  isDarkMode ? 'bg-[#14161a] border-zinc-700 text-zinc-100 focus:border-indigo-400' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>

            <div>
              <label className={`block font-medium mb-1.5 ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ServiceCategory)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none transition-all ${
                  isDarkMode ? 'bg-[#14161a] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="ecommerce">E-Commerce / Magento</option>
                <option value="bioscience">Bioscience / Scientific API</option>
                <option value="infrastructure">Core Infrastructure</option>
              </select>
            </div>

            <div>
              <label className={`block font-medium mb-1.5 ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>Expected Status Codes (comma separated)</label>
              <input
                type="text"
                placeholder="200, 204"
                value={expectedCodes}
                onChange={e => setExpectedCodes(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none font-mono ${
                  isDarkMode ? 'bg-[#14161a] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block font-medium mb-1.5 ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>Check Interval (seconds)</label>
              <input
                type="number"
                min="10"
                max="3600"
                value={intervalSec}
                onChange={e => setIntervalSec(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none font-mono ${
                  isDarkMode ? 'bg-[#14161a] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block font-medium mb-1.5 ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>Expected DNS A Records (optional)</label>
              <input
                type="text"
                placeholder="e.g. 104.21.36.177"
                value={expectedDnsA}
                onChange={e => setExpectedDnsA(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none font-mono ${
                  isDarkMode ? 'bg-[#14161a] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs pt-1">
            <label className={`flex items-center gap-2 cursor-pointer ${isDarkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
              <input
                type="checkbox"
                checked={checkSsl}
                onChange={e => setCheckSsl(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0"
              />
              <span>Inspect TLS / SSL Certificate</span>
            </label>
            <label className={`flex items-center gap-2 cursor-pointer ${isDarkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
              <input
                type="checkbox"
                checked={checkDns}
                onChange={e => setCheckDns(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0"
              />
              <span>Verify DNS A-Record Match</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`px-4 py-2 rounded-full text-xs border transition-colors ${
                isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Validating & Probing...' : 'Save Target & Execute Probe'}
            </button>
          </div>
        </form>
      )}

      {/* Main Split: Left Target List / Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Targets List (5 Cols) with Smooth 3XL Curvature */}
        <div className={`lg:col-span-5 rounded-3xl border overflow-hidden transition-all duration-300 shadow-sm ${
          isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-4 border-b flex justify-between items-center ${
            isDarkMode ? 'border-zinc-800/60 bg-transparent' : 'border-slate-200 bg-slate-50/70'
          }`}>
            <span className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-slate-700'}`}>
              Active Targets ({targets.length})
            </span>
            <span className={`text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Select to inspect</span>
          </div>

          <div className={`divide-y max-h-[600px] overflow-y-auto ${
            isDarkMode ? 'divide-zinc-800/60' : 'divide-slate-200'
          }`}>
            {targets.length === 0 && (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div className={`text-xs font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-800'}`}>No Targets Configured</div>
                <p className={`text-[11px] max-w-xs mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Your database is clean. Click <strong>Add Endpoint</strong> above to register your real website or API for live monitoring.
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Target</span>
                </button>
              </div>
            )}
            {targets.map(target => {
              const isSelected = target.id === selectedTarget?.id;
              const isUp = target.lastStatus === 'up';
              const isDown = target.lastStatus === 'down';

              return (
                <div
                  key={`target_item_${target.id}`}
                  onClick={() => onSelectTarget(target.id)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? isDarkMode ? 'bg-[#222732] border-l-4 border-indigo-400' : 'bg-indigo-50/80 border-l-4 border-indigo-600'
                      : isDarkMode ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isUp ? 'bg-emerald-500' : isDown ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                      }`} />
                      <span className={`font-bold text-xs ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>{target.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-medium ${
                      isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {target.category}
                    </span>
                  </div>

                  <div className={`text-[11px] font-mono truncate mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                    {target.url}
                  </div>

                  <div className={`flex items-center justify-between text-[11px] font-mono mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                    <span>
                      Latency: <strong className={isDarkMode ? 'text-zinc-100' : 'text-slate-900 font-bold'}>
                        {target.lastDurationSeconds > 0 ? `${(target.lastDurationSeconds * 1000).toFixed(0)}ms` : 'Pending'}
                      </strong>
                    </span>
                    <span>
                      TLS: <strong className={target.sslDaysRemaining && target.sslDaysRemaining < 14 ? 'text-rose-500' : 'text-emerald-500'}>
                        {target.sslDaysRemaining !== null ? `${target.sslDaysRemaining}d` : 'Validating'}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Target Inspector & Diagnostics (7 Cols) */}
        {selectedTarget && (
          <div className={`lg:col-span-7 rounded-3xl border p-6 space-y-5 transition-all duration-300 shadow-sm ${
            isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
          }`}>
            {/* Inspector Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                    selectedTarget.lastStatus === 'up' 
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : selectedTarget.lastStatus === 'down'
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {selectedTarget.lastStatus}
                  </span>
                  <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>id: {selectedTarget.id}</span>
                </div>
                <h2 className={`text-xl font-bold tracking-tight mt-1 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedTarget.name}</h2>
                <a 
                  href={selectedTarget.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono mt-0.5 font-medium"
                >
                  {selectedTarget.url}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                {onDeleteTarget && (
                  <button
                    onClick={() => onDeleteTarget(selectedTarget.id)}
                    className={`p-2 rounded-full border transition-colors ${
                      isDarkMode 
                        ? 'border-zinc-700 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 text-zinc-400' 
                        : 'border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-slate-500'
                    }`}
                    title="Remove this endpoint"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleTestTarget(selectedTarget.id)}
                  disabled={checkingId === selectedTarget.id}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                    checkingId === selectedTarget.id
                      ? 'bg-indigo-500/30 text-indigo-300'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingId === selectedTarget.id ? 'animate-spin' : ''}`} />
                  <span>{checkingId === selectedTarget.id ? 'Probing...' : 'Probe Now'}</span>
                </button>
              </div>
            </div>

            {/* Error banner if down */}
            {selectedTarget.errorMessage && (
              <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
                isDarkMode 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                  : 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
              }`}>
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <strong>Probe Failure:</strong> {selectedTarget.errorMessage}
                </div>
              </div>
            )}

            {/* Diagnostics Grid with Smooth 2XL Radii */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#14161a] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-[10px] font-mono uppercase font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>HTTP Code</div>
                <div className={`text-lg font-mono font-bold mt-1 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                  {selectedTarget.lastStatusCode || '---'}
                </div>
                <div className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Expected: {selectedTarget.expectedStatusCodes.join(', ')}</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#14161a] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-[10px] font-mono uppercase font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Response Latency</div>
                <div className="text-lg font-mono font-bold mt-1 text-emerald-500 dark:text-emerald-400">
                  {selectedTarget.lastDurationSeconds > 0 ? `${(selectedTarget.lastDurationSeconds * 1000).toFixed(0)} ms` : 'Testing...'}
                </div>
                <div className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{selectedTarget.lastDurationSeconds}s elapsed</div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#14161a] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-[10px] font-mono uppercase font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Probe Interval</div>
                <div className={`text-lg font-mono font-bold mt-1 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                  {selectedTarget.intervalSeconds}s
                </div>
                <div className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Timeout: {selectedTarget.timeoutMs / 1000}s</div>
              </div>
            </div>

            {/* TLS Certificate Section */}
            {selectedTarget.checkSsl && (
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#14161a] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-900'}`}>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>TLS / SSL Certificate Inspection</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${
                    selectedTarget.sslDaysRemaining && selectedTarget.sslDaysRemaining < 14 ? 'text-rose-500' : 'text-emerald-500'
                  }`}>
                    {selectedTarget.sslDaysRemaining !== null ? `${selectedTarget.sslDaysRemaining} days remaining` : 'Inspecting cert...'}
                  </span>
                </div>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <div><strong className={isDarkMode ? 'text-zinc-400' : 'text-slate-900'}>Issuer:</strong> {selectedTarget.sslIssuer || 'Verifying issuer CA...'}</div>
                  <div><strong className={isDarkMode ? 'text-zinc-400' : 'text-slate-900'}>Subject:</strong> {selectedTarget.sslSubject || 'Host'}</div>
                  <div><strong className={isDarkMode ? 'text-zinc-400' : 'text-slate-900'}>Valid Until:</strong> {selectedTarget.sslValidTo ? new Date(selectedTarget.sslValidTo).toLocaleDateString() : 'N/A'}</div>
                  <div><strong className={isDarkMode ? 'text-zinc-400' : 'text-slate-900'}>Status:</strong> {selectedTarget.sslDaysRemaining && selectedTarget.sslDaysRemaining < 14 ? '⚠️ Urgent Renewal' : '✅ Valid & Trusted'}</div>
                </div>
              </div>
            )}

            {/* DNS Resolution Section */}
            {selectedTarget.checkDns && (
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#14161a] border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-900'}`}>
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <span>DNS Record Match</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${selectedTarget.dnsMatch ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {selectedTarget.dnsMatch === true ? 'MATCH' : selectedTarget.dnsMatch === false ? 'MISMATCH' : 'RESOLVING'}
                  </span>
                </div>
                <div className={`text-[11px] font-mono space-y-1 ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <div>
                    <strong className={isDarkMode ? 'text-zinc-400' : 'text-slate-900'}>Resolved A-Records:</strong> {selectedTarget.dnsResolvedRecords?.A?.join(', ') || 'Querying nameservers...'}
                  </div>
                  {selectedTarget.expectedDnsRecords?.A && (
                    <div>
                      <strong className={isDarkMode ? 'text-zinc-400' : 'text-slate-900'}>Expected A-Records:</strong> {selectedTarget.expectedDnsRecords.A.join(', ')}
                    </div>
                  )}
                  {selectedTarget.dnsMismatchDetails && (
                    <div className="text-rose-500 font-sans text-xs mt-1 font-medium">
                      ⚠️ {selectedTarget.dnsMismatchDetails}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Check History with Smooth Pill Indicators */}
            <div>
              <div className={`text-xs font-mono uppercase mb-2 font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                Probe Samples ({selectedTarget.history.length})
              </div>
              {selectedTarget.history.length > 0 ? (
                <div className={`flex items-end gap-2 h-14 w-full p-2.5 rounded-2xl border ${
                  isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  {selectedTarget.history.map((h, i) => {
                    const heightPct = Math.min(100, Math.max(20, (h.durationSeconds / 2.0) * 100));
                    return (
                      <div
                        key={`hist_${i}`}
                        title={`${(h.durationSeconds * 1000).toFixed(0)}ms - Status ${h.status}`}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          h.status === 'up' ? 'bg-emerald-500' : h.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className={`p-3.5 rounded-2xl border text-xs text-center font-mono ${
                  isDarkMode ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  Live probe history accumulates here as checks run every {selectedTarget.intervalSeconds}s
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedTarget && (
          <div className={`lg:col-span-7 rounded-3xl border p-12 text-center flex flex-col items-center justify-center space-y-4 transition-all duration-300 shadow-sm ${
            isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Crosshair className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Zero Probes in Active Database</h3>
              <p className={`text-xs max-w-sm mx-auto mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                All dummy data has been removed. You have a completely clean workspace. Add an endpoint to see real-time latency graphs, TLS expiration countdowns, and DNS records.
              </p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Configure First Real Probe</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
