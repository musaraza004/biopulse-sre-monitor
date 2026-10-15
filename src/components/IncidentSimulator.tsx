import React, { useState } from 'react';
import { MonitoredTarget, CronJob, PrometheusAlert } from '../types/monitor.js';
import { 
  Flame, 
  RotateCcw, 
  Server, 
  ShieldAlert, 
  Globe, 
  Clock, 
  ArrowRight
} from 'lucide-react';

interface IncidentSimulatorProps {
  targets: MonitoredTarget[];
  cronJobs: CronJob[];
  alerts: PrometheusAlert[];
  isDarkMode: boolean;
  onSimulateScenario: (scenario: string, active: boolean) => Promise<void>;
  onRestoreAll: () => Promise<void>;
  onGoToDashboard: () => void;
}

export const IncidentSimulator: React.FC<IncidentSimulatorProps> = ({
  targets,
  cronJobs,
  alerts,
  isDarkMode,
  onSimulateScenario,
  onRestoreAll,
  onGoToDashboard
}) => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);

  const storefront = targets.find(t => t.id === 'storefront');
  const catalogJob = cronJobs.find(j => j.id === 'catalog_sync');

  const isStorefrontDown = storefront?.lastStatus === 'down';
  const isSslExpiring = (storefront?.sslDaysRemaining ?? 99) < 14;
  const isDnsPoisoned = storefront?.dnsMatch === false;
  const isCronMissed = catalogJob?.isOverdue === true;

  const handleToggle = async (scenario: string, currentState: boolean) => {
    setLoadingScenario(scenario);
    try {
      await onSimulateScenario(scenario, !currentState);
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleRestore = async () => {
    setLoadingScenario('restore_all');
    try {
      await onRestoreAll();
    } finally {
      setLoadingScenario(null);
    }
  };

  const firingAlerts = alerts.filter(a => a.state === 'firing');

  return (
    <div className="space-y-6">
      {/* Header with Smooth 3XL Curvature */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200'
      } flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
              SRE Incident Simulation & Chaos Sandbox
            </h1>
          </div>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'} mt-1`}>
            DevOps incident handling: inject operational failures, observe Prometheus metrics and Grafana alerts, and verify post-incident recovery.
          </p>
        </div>

        <button
          onClick={handleRestore}
          disabled={loadingScenario !== null}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 active:scale-95"
        >
          <RotateCcw className={`w-4 h-4 ${loadingScenario === 'restore_all' ? 'animate-spin' : ''}`} />
          <span>Restore All Endpoints (Green)</span>
        </button>
      </div>

      {/* Active Firing Status Box */}
      <div className={`p-5 rounded-3xl border transition-all duration-300 ${
        firingAlerts.length > 0 
          ? isDarkMode 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200 shadow-md' 
            : 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm'
          : isDarkMode 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200 shadow-sm' 
            : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
      } flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full ${firingAlerts.length > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
          <div>
            <div className="font-bold text-sm">
              {firingAlerts.length > 0 
                ? `Incident Active: ${firingAlerts.length} Prometheus Alert Rule(s) Triggered` 
                : 'All Services Nominal · 0 Firing Alerts'}
            </div>
            <div className={`text-xs font-mono mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
              Prometheus scrape targets evaluated continuously against /etc/prometheus/alerts.yml
            </div>
          </div>
        </div>

        <button
          onClick={onGoToDashboard}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-sm active:scale-95 ${
            isDarkMode 
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' 
              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
          }`}
        >
          <span>View in Grafana</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Incident Scenarios Grid with Smooth 3XL Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Scenario 1: Storefront HTTP 503 Outage */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 ${
          isStorefrontDown 
            ? 'bg-rose-950/20 border-rose-500/50 shadow-lg' 
            : isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800/60' : 'bg-slate-100'}`}>
                <Server className={`w-4 h-4 ${isStorefrontDown ? 'text-rose-500' : isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
              </div>
              <h3 className={`font-bold text-sm ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>1. Storefront HTTP 503 Outage</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
              isStorefrontDown ? 'bg-rose-500 text-white animate-pulse' : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {isStorefrontDown ? 'DOWN' : 'NORMAL'}
            </span>
          </div>

          <p className={`text-xs mt-2.5 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
            Simulates PHP-FPM process pool exhaustion on Magento storefront. Causes HTTP probe to return 503 Service Unavailable and latency to exceed 5s.
          </p>

          <div className={`mt-3.5 p-3 rounded-2xl text-[11px] font-mono border ${
            isDarkMode ? 'bg-zinc-950/60 text-zinc-300 border-zinc-800' : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}>
            <div><strong>Metric Affected:</strong> <span className="text-rose-500 dark:text-rose-400 font-semibold">monitor_http_up&#123;target="storefront"&#125; = 0</span></div>
            <div><strong>Alert Fired:</strong> <span className="text-amber-600 dark:text-amber-400 font-semibold">WebsiteDown (severity: critical)</span></div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-500' : 'text-slate-600 font-medium'}`}>Target: storefront</span>
            <button
              onClick={() => handleToggle('storefront_down', isStorefrontDown)}
              disabled={loadingScenario !== null}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 ${
                isStorefrontDown 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              {isStorefrontDown ? 'Restore Storefront (200 OK)' : 'Trigger 503 Outage'}
            </button>
          </div>
        </div>

        {/* Scenario 2: TLS Certificate Imminent Expiry */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 ${
          isSslExpiring 
            ? 'bg-amber-950/20 border-amber-500/50 shadow-lg' 
            : isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800/60' : 'bg-slate-100'}`}>
                <ShieldAlert className={`w-4 h-4 ${isSslExpiring ? 'text-amber-500' : isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
              </div>
              <h3 className={`font-bold text-sm ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>2. SSL/TLS Certificate Expiry (&lt; 14 Days)</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
              isSslExpiring ? 'bg-amber-500 text-black animate-pulse' : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {isSslExpiring ? 'EXPIRING SOON' : 'VALID'}
            </span>
          </div>

          <p className={`text-xs mt-2.5 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
            Simulates TLS certificate validity dropping to 3 days remaining before ACME auto-renewal failure, triggering critical SRE renewal alarms.
          </p>

          <div className={`mt-3.5 p-3 rounded-2xl text-[11px] font-mono border ${
            isDarkMode ? 'bg-zinc-950/60 text-zinc-300 border-zinc-800' : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}>
            <div><strong>Metric Affected:</strong> <span className="text-rose-500 dark:text-rose-400 font-semibold">monitor_ssl_expiry_days&#123;target="storefront"&#125; = 3</span></div>
            <div><strong>Alert Fired:</strong> <span className="text-amber-600 dark:text-amber-400 font-semibold">SslCertificateExpiringSoon (severity: critical)</span></div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-500' : 'text-slate-600 font-medium'}`}>Current: {storefront?.sslDaysRemaining ?? 'Inspecting'}d</span>
            <button
              onClick={() => handleToggle('ssl_expire', isSslExpiring)}
              disabled={loadingScenario !== null}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 ${
                isSslExpiring 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
              }`}
            >
              {isSslExpiring ? 'Renew Certificate' : 'Simulate 3 Days Remaining'}
            </button>
          </div>
        </div>

        {/* Scenario 3: DNS Record Poisoning */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 ${
          isDnsPoisoned 
            ? 'bg-rose-950/20 border-rose-500/50 shadow-lg' 
            : isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800/60' : 'bg-slate-100'}`}>
                <Globe className={`w-4 h-4 ${isDnsPoisoned ? 'text-rose-500' : isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
              </div>
              <h3 className={`font-bold text-sm ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>3. DNS Record Mismatch / Drift</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
              isDnsPoisoned ? 'bg-rose-500 text-white animate-pulse' : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {isDnsPoisoned ? 'MISMATCH' : 'MATCH'}
            </span>
          </div>

          <p className={`text-xs mt-2.5 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
            Simulates unauthorized A-record change or DNS cache poisoning where resolved IP does not match the configured authoritative address.
          </p>

          <div className={`mt-3.5 p-3 rounded-2xl text-[11px] font-mono border ${
            isDarkMode ? 'bg-zinc-950/60 text-zinc-300 border-zinc-800' : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}>
            <div><strong>Metric Affected:</strong> <span className="text-rose-500 dark:text-rose-400 font-semibold">monitor_dns_match&#123;target="storefront"&#125; = 0</span></div>
            <div><strong>Alert Fired:</strong> <span className="text-amber-600 dark:text-amber-400 font-semibold">DnsRecordMismatch (severity: warning)</span></div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-500' : 'text-slate-600 font-medium'}`}>A-Record Check</span>
            <button
              onClick={() => handleToggle('dns_poison', isDnsPoisoned)}
              disabled={loadingScenario !== null}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 ${
                isDnsPoisoned 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              {isDnsPoisoned ? 'Restore Authoritative DNS' : 'Simulate DNS Drift'}
            </button>
          </div>
        </div>

        {/* Scenario 4: Missed Scheduled Job Heartbeat */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 ${
          isCronMissed 
            ? 'bg-rose-950/20 border-rose-500/50 shadow-lg' 
            : isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800/60' : 'bg-slate-100'}`}>
                <Clock className={`w-4 h-4 ${isCronMissed ? 'text-rose-500' : isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
              </div>
              <h3 className={`font-bold text-sm ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>4. Missed Cron Heartbeat</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
              isCronMissed ? 'bg-rose-500 text-white animate-pulse' : isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {isCronMissed ? 'OVERDUE' : 'OK'}
            </span>
          </div>

          <p className={`text-xs mt-2.5 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
            Simulates Magento <code className="font-mono text-indigo-500 dark:text-indigo-400 font-semibold">catalog_sync</code> cron worker dying silently without pinging the heartbeat endpoint within its 15m deadline.
          </p>

          <div className={`mt-3.5 p-3 rounded-2xl text-[11px] font-mono border ${
            isDarkMode ? 'bg-zinc-950/60 text-zinc-300 border-zinc-800' : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}>
            <div><strong>Metric Affected:</strong> <span className="text-rose-500 dark:text-rose-400 font-semibold">monitor_cron_overdue&#123;job="catalog_sync"&#125; = 1</span></div>
            <div><strong>Alert Fired:</strong> <span className="text-amber-600 dark:text-amber-400 font-semibold">CronHeartbeatMissed (severity: critical)</span></div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-500' : 'text-slate-600 font-medium'}`}>Job: catalog_sync</span>
            <button
              onClick={() => handleToggle('cron_missed', isCronMissed)}
              disabled={loadingScenario !== null}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 ${
                isCronMissed 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              {isCronMissed ? 'Post Successful Heartbeat' : 'Simulate Missed Deadline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
