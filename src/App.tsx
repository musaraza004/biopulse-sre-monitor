/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Navbar, NavTab } from './components/Navbar.js';
import { GrafanaDashboard } from './components/GrafanaDashboard.js';
import { TargetManager } from './components/TargetManager.js';
import { HeartbeatManager } from './components/HeartbeatManager.js';
import { IncidentSimulator } from './components/IncidentSimulator.js';
import { BioscienceHub } from './components/BioscienceHub.js';
import { MetricsExplorer } from './components/MetricsExplorer.js';
import { DockerBundleExporter } from './components/DockerBundleExporter.js';
import { UserAccountModal } from './components/UserAccountModal.js';
import { MonitoredTarget, CronJob, PrometheusAlert } from './types/monitor.js';
import { UserProfile, UserDashboardData, PRESET_USERS } from './types/user.js';
import { INITIAL_TARGETS, INITIAL_CRON_JOBS } from './data/defaultConfig.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('biopulse_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback to default
    }
    return PRESET_USERS[0]; // Musa Raza (Lead SRE)
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [targets, setTargets] = useState<MonitoredTarget[]>(INITIAL_TARGETS);
  const [cronJobs, setCronJobs] = useState<CronJob[]>(INITIAL_CRON_JOBS);
  const [sharedToken, setSharedToken] = useState('sre-secret-heartbeat-token-2026');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('storefront');
  
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(15);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const isInitialLoad = useRef(true);

  // Helper to get storage key for user
  const getUserStorageKey = useCallback((userId: string) => `biopulse_user_${userId}_workspace`, []);

  // Load user-specific workspace data
  const loadUserWorkspace = useCallback((user: UserProfile) => {
    try {
      const key = getUserStorageKey(user.id);
      const savedData = localStorage.getItem(key);
      if (savedData) {
        const parsed: UserDashboardData = JSON.parse(savedData);
        if (parsed.targets && parsed.targets.length > 0) setTargets(parsed.targets);
        if (parsed.cronJobs && parsed.cronJobs.length > 0) setCronJobs(parsed.cronJobs);
        if (parsed.sharedToken) setSharedToken(parsed.sharedToken);
        if (typeof parsed.autoRefreshInterval === 'number') setAutoRefreshInterval(parsed.autoRefreshInterval);
        if (typeof parsed.isDarkMode === 'boolean') setIsDarkMode(parsed.isDarkMode);
        if (parsed.selectedTargetId) setSelectedTargetId(parsed.selectedTargetId);
        return true;
      }
    } catch (e) {
      console.warn('Failed to load user workspace from storage', e);
    }
    return false;
  }, [getUserStorageKey]);

  // Save current workspace state to user storage
  const saveUserWorkspace = useCallback((user: UserProfile, curTargets: MonitoredTarget[], curJobs: CronJob[]) => {
    try {
      const key = getUserStorageKey(user.id);
      const data: UserDashboardData = {
        userId: user.id,
        userEmail: user.email,
        updatedAt: Date.now(),
        targets: curTargets,
        cronJobs: curJobs,
        sharedToken,
        autoRefreshInterval,
        isDarkMode,
        selectedTargetId,
      };
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem('biopulse_current_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user workspace', e);
    }
  }, [getUserStorageKey, sharedToken, autoRefreshInterval, isDarkMode, selectedTargetId]);

  // Handle user switch
  const handleSelectUser = (newUser: UserProfile) => {
    // Save current user state before switching
    saveUserWorkspace(currentUser, targets, cronJobs);

    // Switch to new user
    setCurrentUser(newUser);
    const loaded = loadUserWorkspace(newUser);
    if (!loaded) {
      // If new user has no data yet, initialize custom default set
      const userSpecificTargets = INITIAL_TARGETS.map(t => ({
        ...t,
        history: [...t.history]
      }));
      setTargets(userSpecificTargets);
      setCronJobs([...INITIAL_CRON_JOBS]);
    }
    setIsUserModalOpen(false);
  };

  // Sync targets from server or keep local
  const fetchTargets = useCallback(async () => {
    try {
      const res = await fetch('/api/targets');
      if (res.ok) {
        const data = await res.json();
        if (data.targets) {
          setTargets(data.targets);
          saveUserWorkspace(currentUser, data.targets, cronJobs);
        }
      }
    } catch {
      // Fallback to local user state on static host like GitHub Pages
    }
  }, [currentUser, cronJobs, saveUserWorkspace]);

  // Sync cron jobs from server or keep local
  const fetchHeartbeats = useCallback(async () => {
    try {
      const res = await fetch('/api/heartbeats');
      if (res.ok) {
        const data = await res.json();
        if (data.jobs) {
          setCronJobs(data.jobs);
          saveUserWorkspace(currentUser, targets, data.jobs);
        }
        if (data.sharedToken) setSharedToken(data.sharedToken);
      }
    } catch {
      // Keep local jobs on error (GitHub Pages static mode)
    }
  }, [currentUser, targets, saveUserWorkspace]);

  const refreshAllData = useCallback(async () => {
    await Promise.all([fetchTargets(), fetchHeartbeats()]);
  }, [fetchTargets, fetchHeartbeats]);

  // Initial load
  useEffect(() => {
    const loaded = loadUserWorkspace(currentUser);
    if (!loaded) {
      refreshAllData();
    }
    isInitialLoad.current = false;
  }, []);

  // Save changes to current user's workspace
  useEffect(() => {
    if (!isInitialLoad.current) {
      saveUserWorkspace(currentUser, targets, cronJobs);
    }
  }, [targets, cronJobs, currentUser, saveUserWorkspace]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      refreshAllData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, refreshAllData]);

  // Evaluate dynamic Prometheus Alerts matching alerts.yml
  const alerts: PrometheusAlert[] = useMemo(() => {
    const list: PrometheusAlert[] = [];

    // 1. WebsiteDown
    for (const t of targets) {
      if (t.lastStatus === 'down') {
        list.push({
          id: `down_${t.id}`,
          name: 'TargetServiceDown',
          severity: 'critical',
          state: 'firing',
          summary: `${t.name} probe is DOWN (${t.lastStatusCode || 'No Response'})`,
          description: t.errorMessage || `Expected ${t.expectedStatusCodes.join(', ')} but probe failed or timed out`,
          labels: { target: t.id, category: t.category, url: t.url }
        });
      }
    }

    // 2. HighLatency
    for (const t of targets) {
      if (t.lastStatus === 'degraded' || t.lastDurationSeconds > 0.8) {
        list.push({
          id: `lat_${t.id}`,
          name: 'HighResponseLatency',
          severity: 'warning',
          state: 'firing',
          summary: `High probe latency on ${t.name}: ${(t.lastDurationSeconds * 1000).toFixed(0)}ms`,
          description: `Probe duration exceeded 800ms threshold for 2 consecutive cycles`,
          labels: { target: t.id, category: t.category }
        });
      }
    }

    // 3. SslCertificateExpiringSoon
    for (const t of targets) {
      if (t.sslDaysRemaining !== null && t.sslDaysRemaining < 14 && t.sslDaysRemaining > 0) {
        list.push({
          id: `ssl_${t.id}`,
          name: 'SslCertificateExpiringSoon',
          severity: 'critical',
          state: 'firing',
          summary: `TLS Certificate for ${t.name} expires in ${t.sslDaysRemaining} days`,
          description: `Renew SSL certificate immediately before disruption`,
          labels: { target: t.id, category: t.category }
        });
      }
    }

    // 4. DnsRecordMismatch
    for (const t of targets) {
      if (t.dnsMatch === false) {
        list.push({
          id: `dns_${t.id}`,
          name: 'DnsRecordMismatch',
          severity: 'warning',
          state: 'firing',
          summary: `DNS record mismatch on ${t.name}`,
          description: t.dnsMismatchDetails || 'Resolved IP does not match expected A-record',
          labels: { target: t.id, category: t.category }
        });
      }
    }

    // 5. CronHeartbeatMissed
    for (const c of cronJobs) {
      if (c.isOverdue) {
        list.push({
          id: `cron_${c.id}`,
          name: 'CronHeartbeatMissed',
          severity: 'critical',
          state: 'firing',
          summary: `Scheduled job ${c.name} is OVERDUE`,
          description: `Missed expected heartbeat deadline (${Math.floor(c.deadlineSeconds / 60)} min)`,
          labels: { job: c.id, category: c.category }
        });
      }
    }

    return list;
  }, [targets, cronJobs]);

  // Trigger manual probe of all targets
  const handleRefreshAll = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/check-all', { method: 'POST' }).catch(() => null);
      if (res && res.ok) {
        await refreshAllData();
      } else {
        // Fallback for GitHub Pages static execution: simulate live check
        setTargets(prev => prev.map(t => {
          if (t.simulatedFailure) {
            return {
              ...t,
              lastStatus: t.simulatedFailure.type === 'latency_spike' ? 'degraded' : 'down',
              lastDurationSeconds: t.simulatedFailure.type === 'latency_spike' ? 2.45 : 0.05,
              lastCheckTimestamp: Date.now(),
              lastStatusCode: t.simulatedFailure.type === 'http_down' ? 503 : 200,
            };
          }
          const randomLatency = +(0.04 + Math.random() * 0.12).toFixed(3);
          return {
            ...t,
            lastStatus: 'up',
            lastDurationSeconds: randomLatency,
            lastCheckTimestamp: Date.now(),
            lastStatusCode: 200,
            history: [
              ...t.history.slice(-19),
              { timestamp: Date.now(), durationSeconds: randomLatency, status: 'up', statusCode: 200 }
            ]
          };
        }));
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Run single target check
  const handleCheckTarget = async (id: string) => {
    try {
      const res = await fetch(`/api/targets/${id}/check`, { method: 'POST' }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setTargets(prev => prev.map(t => t.id === id ? data.target : t));
      } else {
        // GitHub Pages client-side fallback
        setTargets(prev => prev.map(t => {
          if (t.id !== id) return t;
          const randomLatency = +(0.03 + Math.random() * 0.08).toFixed(3);
          return {
            ...t,
            lastStatus: 'up',
            lastDurationSeconds: randomLatency,
            lastCheckTimestamp: Date.now(),
            lastStatusCode: 200,
          };
        }));
      }
    } catch {
      await refreshAllData();
    }
  };

  // Add target
  const handleAddTarget = async (newTarget: Partial<MonitoredTarget>) => {
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTarget)
      }).catch(() => null);

      if (res && res.ok) {
        await refreshAllData();
      } else {
        // Static GitHub Pages fallback
        const completeTarget: MonitoredTarget = {
          id: newTarget.id || `target-${Date.now()}`,
          name: newTarget.name || 'New Service Probe',
          category: newTarget.category || 'ecommerce',
          url: newTarget.url || 'https://example.com',
          expectedStatusCodes: newTarget.expectedStatusCodes || [200],
          intervalSeconds: newTarget.intervalSeconds || 30,
          timeoutMs: newTarget.timeoutMs || 5000,
          expectedDnsRecords: newTarget.expectedDnsRecords,
          checkSsl: !!newTarget.checkSsl,
          checkDns: !!newTarget.checkDns,
          lastCheckTimestamp: Date.now(),
          lastStatus: 'up',
          lastDurationSeconds: 0.082,
          lastStatusCode: 200,
          errorMessage: null,
          history: [{ timestamp: Date.now(), durationSeconds: 0.082, status: 'up', statusCode: 200 }],
          sslDaysRemaining: 84,
          sslIssuer: "Let's Encrypt Authority X3",
          sslValidTo: '2026-12-31T00:00:00Z',
          sslSubject: newTarget.url || '',
          dnsMatch: true,
          dnsResolvedRecords: { A: ['93.184.216.34'] },
          dnsMismatchDetails: null,
        };
        setTargets(prev => [completeTarget, ...prev]);
      }
    } catch {
      // Fallback
    }

    if (newTarget.id) setSelectedTargetId(newTarget.id);
  };

  // Delete target
  const handleDeleteTarget = async (id: string) => {
    try {
      await fetch(`/api/targets/${id}`, { method: 'DELETE' }).catch(() => null);
    } catch {
      // Handled below
    }
    setTargets(prev => prev.filter(t => t.id !== id));
    if (selectedTargetId === id) {
      setSelectedTargetId(targets.find(t => t.id !== id)?.id || '');
    }
  };

  // Reset targets to default configuration
  const handleResetTargets = async () => {
    try {
      await fetch('/api/targets/reset', { method: 'POST' }).catch(() => null);
    } catch {
      // Handled below
    }
    setTargets(INITIAL_TARGETS);
  };

  // Send authenticated heartbeat
  const handleSendHeartbeat = async (
    jobId: string, 
    status: 'success' | 'failure', 
    token: string, 
    durationMs?: number, 
    notes?: string
  ) => {
    try {
      const res = await fetch(`/heartbeat/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, duration_ms: durationMs, notes })
      }).catch(() => null);

      if (res && res.ok) {
        await fetchHeartbeats();
        return;
      }
    } catch {
      // Handled below
    }

    // GitHub Pages client-side fallback
    setCronJobs(prev => prev.map(job => {
      if (job.id !== jobId) return job;
      return {
        ...job,
        lastHeartbeatTimestamp: Date.now(),
        lastStatus: status,
        isOverdue: false,
        history: [
          { timestamp: Date.now(), status, durationMs, notes },
          ...job.history.slice(0, 19)
        ]
      };
    }));
  };

  // Simulate Chaos / Incident scenario
  const handleSimulateScenario = async (scenario: string, active: boolean) => {
    try {
      await fetch('/api/simulate/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, active })
      }).catch(() => null);
    } catch {
      // Handled below
    }

    // Static fallback
    if (scenario === 'http_down') {
      setTargets(prev => prev.map(t => t.id === 'storefront' ? {
        ...t,
        lastStatus: active ? 'down' : 'up',
        lastStatusCode: active ? 503 : 200,
        errorMessage: active ? 'HTTP 503 Service Unavailable' : null,
        simulatedFailure: active ? { type: 'http_down', description: 'Simulated 503 Gateway Down' } : undefined
      } : t));
    } else if (scenario === 'ssl_expire') {
      setTargets(prev => prev.map(t => t.id === 'checkout' ? {
        ...t,
        sslDaysRemaining: active ? 3 : 84,
        simulatedFailure: active ? { type: 'ssl_expire', description: 'Simulated SSL Expiring in 3 Days' } : undefined
      } : t));
    } else if (scenario === 'dns_poison') {
      setTargets(prev => prev.map(t => t.id === 'gene_sequencer' ? {
        ...t,
        dnsMatch: !active,
        dnsMismatchDetails: active ? 'DNS Poisoning: Expected 198.51.100.44 but got 203.0.113.99' : null,
        simulatedFailure: active ? { type: 'dns_poison', description: 'Simulated DNS Poisoning' } : undefined
      } : t));
    } else if (scenario === 'cron_overdue') {
      setCronJobs(prev => prev.map(c => c.id === 'cron_database_backup' ? {
        ...c,
        isOverdue: active,
        simulatedFailure: active
      } : c));
    }
  };

  // Restore all to normal
  const handleRestoreAll = async () => {
    try {
      await fetch('/api/simulate/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'restore_all' })
      }).catch(() => null);
    } catch {
      // Handled below
    }
    setTargets(prev => prev.map(t => ({
      ...t,
      lastStatus: 'up',
      lastStatusCode: 200,
      errorMessage: null,
      sslDaysRemaining: 84,
      dnsMatch: true,
      dnsMismatchDetails: null,
      simulatedFailure: undefined
    })));
    setCronJobs(prev => prev.map(c => ({
      ...c,
      isOverdue: false,
      simulatedFailure: undefined
    })));
  };

  // Export current dashboard JSON
  const handleExportDashboard = () => {
    const dataToExport: UserDashboardData = {
      userId: currentUser.id,
      userEmail: currentUser.email,
      updatedAt: Date.now(),
      targets,
      cronJobs,
      sharedToken,
      autoRefreshInterval,
      isDarkMode,
      selectedTargetId,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biopulse-${currentUser.email.split('@')[0]}-dashboard.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import dashboard JSON
  const handleImportDashboard = (jsonString: string) => {
    try {
      const parsed: UserDashboardData = JSON.parse(jsonString);
      if (Array.isArray(parsed.targets)) setTargets(parsed.targets);
      if (Array.isArray(parsed.cronJobs)) setCronJobs(parsed.cronJobs);
      if (parsed.sharedToken) setSharedToken(parsed.sharedToken);
      if (typeof parsed.autoRefreshInterval === 'number') setAutoRefreshInterval(parsed.autoRefreshInterval);
      if (typeof parsed.isDarkMode === 'boolean') setIsDarkMode(parsed.isDarkMode);
      alert('Dashboard configuration imported successfully for active user!');
    } catch {
      alert('Invalid dashboard JSON file format.');
    }
  };

  // Reset to initial preset defaults
  const handleResetToDefaults = () => {
    setTargets(INITIAL_TARGETS);
    setCronJobs(INITIAL_CRON_JOBS);
    setSharedToken('sre-secret-heartbeat-token-2026');
    saveUserWorkspace(currentUser, INITIAL_TARGETS, INITIAL_CRON_JOBS);
  };

  const healthScore = targets.length > 0
    ? Math.round((targets.filter(t => t.lastStatus === 'up').length / targets.length) * 100)
    : 100;

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode ? 'bg-[#0f1115] text-zinc-100' : 'bg-[#f8fafc] text-slate-800'
    } flex flex-col font-sans selection:bg-indigo-600 selection:text-white`}>
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isChecking={isChecking}
        onRefreshAll={handleRefreshAll}
        healthScore={healthScore}
        firingAlertsCount={alerts.filter(a => a.state === 'firing').length}
        autoRefreshInterval={autoRefreshInterval}
        onChangeAutoRefresh={setAutoRefreshInterval}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        currentUser={currentUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <GrafanaDashboard
            targets={targets}
            cronJobs={cronJobs}
            alerts={alerts}
            isDarkMode={isDarkMode}
            onSelectTarget={(id) => {
              setSelectedTargetId(id);
              setCurrentTab('targets');
            }}
            onNavigateToSim={() => setCurrentTab('incident')}
            onNavigateToCron={() => setCurrentTab('heartbeats')}
          />
        )}

        {currentTab === 'targets' && (
          <TargetManager
            targets={targets}
            isDarkMode={isDarkMode}
            onCheckTarget={handleCheckTarget}
            onAddTarget={handleAddTarget}
            onDeleteTarget={handleDeleteTarget}
            onResetTargets={handleResetTargets}
            selectedTargetId={selectedTargetId}
            onSelectTarget={setSelectedTargetId}
          />
        )}

        {currentTab === 'heartbeats' && (
          <HeartbeatManager
            cronJobs={cronJobs}
            sharedToken={sharedToken}
            isDarkMode={isDarkMode}
            onSendHeartbeat={handleSendHeartbeat}
          />
        )}

        {currentTab === 'incident' && (
          <IncidentSimulator
            targets={targets}
            cronJobs={cronJobs}
            alerts={alerts}
            isDarkMode={isDarkMode}
            onSimulateScenario={handleSimulateScenario}
            onRestoreAll={handleRestoreAll}
            onGoToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'bioscience' && (
          <BioscienceHub isDarkMode={isDarkMode} />
        )}

        {currentTab === 'metrics' && (
          <MetricsExplorer isDarkMode={isDarkMode} />
        )}

        {currentTab === 'docker' && (
          <DockerBundleExporter isDarkMode={isDarkMode} />
        )}
      </main>

      {/* User Account & Isolated Workspace Modal */}
      <UserAccountModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        isDarkMode={isDarkMode}
        onExportDashboard={handleExportDashboard}
        onImportDashboard={handleImportDashboard}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs transition-colors ${
        isDarkMode ? 'border-[#22252b] text-zinc-400 bg-[#111217]' : 'border-slate-200 text-slate-600 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDarkMode ? 'text-zinc-200' : 'text-slate-800'}`}>BioPulse SRE Monitor</span>
            <span>&middot;</span>
            <span className={isDarkMode ? 'text-zinc-400' : 'text-slate-600'}>Prometheus /metrics &middot; Grafana Dashboards &middot; GitHub Pages CI/CD</span>
          </div>
          <div className={`font-mono text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-medium'}`}>
            Workspace: <span className="text-indigo-400">{currentUser.clusterName}</span> ({currentUser.email})
          </div>
        </div>
      </footer>
    </div>
  );
}
