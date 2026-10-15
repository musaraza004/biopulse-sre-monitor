import React, { useState, useMemo } from 'react';
import { 
  MonitoredTarget, 
  CronJob, 
  PrometheusAlert, 
  ServiceCategory 
} from '../types/monitor.js';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Globe, 
  Zap, 
  ArrowUpRight, 
  Flame, 
  TrendingUp,
  Server,
  Activity
} from 'lucide-react';

interface GrafanaDashboardProps {
  targets: MonitoredTarget[];
  cronJobs: CronJob[];
  alerts: PrometheusAlert[];
  isDarkMode: boolean;
  onSelectTarget: (id: string) => void;
  onNavigateToSim: () => void;
  onNavigateToCron: () => void;
}

// Convert discrete points into a continuous smooth cubic bezier spline (no sharp corners/turns)
function generateSmoothCurve(points: Array<{ x: number; y: number }>, baseHeight: number = 140): { strokePath: string; areaPath: string } {
  if (points.length < 2) return { strokePath: '', areaPath: '' };
  
  let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Cardinal / Catmull-Rom to Cubic Bezier conversion
    const tension = 0.5;
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const area = `${d} L ${last.x.toFixed(1)},${baseHeight} L ${first.x.toFixed(1)},${baseHeight} Z`;

  return { strokePath: d, areaPath: area };
}

export const GrafanaDashboard: React.FC<GrafanaDashboardProps> = ({
  targets,
  cronJobs,
  alerts,
  isDarkMode,
  onSelectTarget,
  onNavigateToSim,
  onNavigateToCron,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ServiceCategory>('all');
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h' | '24h'>('15m');

  const filteredTargets = selectedCategory === 'all' 
    ? targets 
    : targets.filter(t => t.category === selectedCategory);

  const filteredCronJobs = selectedCategory === 'all'
    ? cronJobs
    : cronJobs.filter(c => c.category === selectedCategory);

  const totalTargets = targets.length;
  const upTargets = targets.filter(t => t.lastStatus === 'up').length;
  const downTargets = targets.filter(t => t.lastStatus === 'down').length;
  const overdueCrons = cronJobs.filter(c => c.isOverdue).length;
  const sslWarningCount = targets.filter(t => t.sslDaysRemaining !== null && t.sslDaysRemaining < 30).length;

  const validDurations = targets.filter(t => t.lastDurationSeconds > 0).map(t => t.lastDurationSeconds);
  const avgLatencyMs = validDurations.length > 0 
    ? Math.round((validDurations.reduce((a, b) => a + b, 0) / validDurations.length) * 1000)
    : 0;

  const healthScore = totalTargets > 0 ? Math.round((upTargets / totalTargets) * 100) : 100;
  const firingAlerts = alerts.filter(a => a.state === 'firing');

  // Generate smooth SVG curves from real target history or live probe values
  const seriesCurves = useMemo(() => {
    const palette = [
      { id: 'emerald', stroke: '#10b981', fill: '#10b981' },
      { id: 'indigo', stroke: '#6366f1', fill: '#6366f1' },
      { id: 'amber', stroke: '#f59e0b', fill: '#f59e0b' },
      { id: 'cyan', stroke: '#06b6d4', fill: '#06b6d4' }
    ];

    const topTargets = filteredTargets.slice(0, 4);

    return topTargets.map((target, idx) => {
      const color = palette[idx % palette.length];
      const history = target.history || [];
      const points: Array<{ x: number; y: number }> = [];

      if (history.length >= 2) {
        history.forEach((h, hIdx) => {
          const x = (hIdx / (history.length - 1)) * 800;
          // Scale latency: 0s -> 135 (bottom), 2.0s -> 50, 3.0s+ -> 15 (top)
          const clampedDuration = Math.max(0, Math.min(3.0, h.durationSeconds));
          const y = 135 - (clampedDuration / 3.0) * 115;
          points.push({ x, y });
        });
      } else {
        // When freshly probed or initializing: compute smooth flowing curve around actual target.lastDurationSeconds
        const curDuration = target.lastDurationSeconds > 0 ? target.lastDurationSeconds : 0.25;
        const baseY = 135 - (Math.min(3.0, curDuration) / 3.0) * 115;
        
        // Construct 5 smooth harmonic control points across the width
        const sampleCount = 6;
        for (let i = 0; i < sampleCount; i++) {
          const x = (i / (sampleCount - 1)) * 800;
          const offset = Math.sin((i + idx * 1.5) * 1.2) * 5;
          points.push({ x, y: Math.max(20, Math.min(135, baseY + offset)) });
        }
      }

      const paths = generateSmoothCurve(points, 140);
      return {
        target,
        color,
        strokePath: paths.strokePath,
        areaPath: paths.areaPath,
        latestLatencyMs: (target.lastDurationSeconds * 1000).toFixed(0)
      };
    });
  }, [filteredTargets]);

  return (
    <div className="space-y-6">
      {/* Grafana-style Dashboard Header */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
        isDarkMode 
          ? 'bg-[#181b20]/90 border-zinc-800/80 text-zinc-100 backdrop-blur-md' 
          : 'bg-white border-slate-200/90 text-slate-900 shadow-slate-100'
      } flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-mono text-indigo-500 dark:text-indigo-400 font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              Observability Dashboard
            </span>
            <span className="text-zinc-400 text-xs">/</span>
            <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              uid: global-health-mesh
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1.5 flex items-center gap-2.5">
            <span className={isDarkMode ? 'text-zinc-100' : 'text-slate-900'}>Production Health, Latency & Cron Jobs</span>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              firingAlerts.length > 0 
                ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30 animate-pulse font-semibold' 
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold'
            }`}>
              {firingAlerts.length > 0 ? `${firingAlerts.length} Active Incidents` : 'All Systems Nominal'}
            </span>
          </h1>
        </div>

        {/* Filter Controls with Smooth Pill Radii */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className={`inline-flex rounded-full p-1 border ${
            isDarkMode ? 'bg-[#121418] border-zinc-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['all', 'ecommerce', 'bioscience'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-300 capitalize ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-200' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All Endpoints' : cat === 'ecommerce' ? 'E-Commerce' : 'Bioscience'}
              </button>
            ))}
          </div>

          {/* Time Range */}
          <div className={`inline-flex rounded-full p-1 border ${
            isDarkMode ? 'bg-[#121418] border-zinc-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['5m', '15m', '1h', '24h'] as const).map(tr => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-3 py-1.5 text-xs rounded-full font-mono transition-all duration-300 ${
                  timeRange === tr
                    ? isDarkMode 
                      ? 'bg-zinc-800 text-zinc-100 font-bold shadow-sm' 
                      : 'bg-white text-slate-900 font-bold shadow-sm'
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-200' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Firing Alerts Banner (if any) */}
      {firingAlerts.length > 0 && (
        <div className={`p-5 rounded-3xl border shadow-md transition-all duration-300 ${
          isDarkMode 
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' 
            : 'bg-rose-50/90 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
              </div>
              <span className={`font-bold text-sm ${isDarkMode ? 'text-rose-200' : 'text-rose-950'}`}>
                Prometheus AlertManager: {firingAlerts.length} Active Alert Rule{firingAlerts.length > 1 ? 's' : ''} Firing
              </span>
            </div>
            <button
              onClick={onNavigateToSim}
              className="text-xs px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full font-semibold transition-all shadow-md active:scale-95"
            >
              Open Incident Sim / Resolve
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            {firingAlerts.map((alert, idx) => (
              <div 
                key={`firing_alert_${alert.id || alert.name}_${alert.labels?.target || alert.labels?.job || ''}_${idx}`} 
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border transition-all ${
                  isDarkMode 
                    ? 'bg-rose-950/50 border-rose-500/30 text-rose-200' 
                    : 'bg-white border-rose-200 text-rose-950 shadow-sm'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <span className={`font-bold ${isDarkMode ? 'text-rose-200' : 'text-rose-900'}`}>{alert.name}</span>
                  <span className={isDarkMode ? 'text-rose-300' : 'text-rose-800'}>: {alert.summary}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 1: Key Metric Gauges / Stat Panels with Smooth 2XL Radii */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Panel 1: Availability */}
        <div className={`p-5 rounded-3xl border transition-all duration-300 hover:shadow-md ${
          isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className={`text-[11px] font-mono uppercase tracking-wider flex items-center justify-between ${
            isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-semibold'
          }`}>
            <span>Availability</span>
            <Server className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono tracking-tight ${
              healthScore === 100 
                ? 'text-emerald-500 dark:text-emerald-400' 
                : healthScore >= 75 
                ? 'text-amber-500 dark:text-amber-400' 
                : 'text-rose-500 dark:text-rose-400'
            }`}>
              {healthScore}%
            </span>
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-600 font-medium'}`}>
              ({upTargets}/{totalTargets} UP)
            </span>
          </div>
          <div className={`mt-3 w-full rounded-full h-2 overflow-hidden ${isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-200'}`}>
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                healthScore === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : healthScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* Panel 2: Latency */}
        <div className={`p-5 rounded-3xl border transition-all duration-300 hover:shadow-md ${
          isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className={`text-[11px] font-mono uppercase tracking-wider flex items-center justify-between ${
            isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-semibold'
          }`}>
            <span>Avg HTTP Latency</span>
            <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono tracking-tight ${
              avgLatencyMs === 0 
                ? isDarkMode ? 'text-zinc-500' : 'text-slate-400' 
                : avgLatencyMs < 400 
                ? 'text-emerald-500 dark:text-emerald-400' 
                : avgLatencyMs < 1000 
                ? 'text-amber-500 dark:text-amber-400' 
                : 'text-rose-500 dark:text-rose-400'
            }`}>
              {avgLatencyMs > 0 ? avgLatencyMs : 'Live'}
            </span>
            <span className={`text-xs font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>ms</span>
          </div>
          <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-medium'}`}>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Target SLA: &lt; 500ms</span>
          </div>
        </div>

        {/* Panel 3: Cron Health */}
        <div 
          onClick={onNavigateToCron}
          className={`p-5 rounded-3xl border cursor-pointer hover:border-indigo-500/50 transition-all duration-300 hover:shadow-md ${
            isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200/90 shadow-sm'
          }`}
        >
          <div className={`text-[11px] font-mono uppercase tracking-wider flex items-center justify-between ${
            isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-semibold'
          }`}>
            <span>Cron Heartbeats</span>
            <Clock className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono tracking-tight ${
              overdueCrons === 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400 animate-pulse'
            }`}>
              {overdueCrons === 0 ? 'Healthy' : `${overdueCrons} Overdue`}
            </span>
          </div>
          <div className={`mt-2 text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-medium'}`}>
            <span>{cronJobs.length} active jobs monitored</span>
          </div>
        </div>

        {/* Panel 4: TLS Expiry Warnings */}
        <div className={`p-5 rounded-3xl border transition-all duration-300 hover:shadow-md ${
          isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className={`text-[11px] font-mono uppercase tracking-wider flex items-center justify-between ${
            isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-semibold'
          }`}>
            <span>TLS Expiry Risk</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono tracking-tight ${
              sslWarningCount === 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'
            }`}>
              {sslWarningCount}
            </span>
            <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-medium'}`}>&lt; 30 days</span>
          </div>
          <div className={`mt-2 text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-medium'}`}>
            {sslWarningCount === 0 ? 'Certificates verified' : 'Renewal recommended'}
          </div>
        </div>

        {/* Panel 5: Incident Sim Shortcut */}
        <div 
          onClick={onNavigateToSim}
          className={`p-5 rounded-3xl border cursor-pointer hover:border-rose-500/50 transition-all duration-300 hover:shadow-md ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#181b20] to-[#221822] border-zinc-800/80' 
              : 'bg-gradient-to-br from-white to-rose-50/70 border-slate-200/90 shadow-sm'
          }`}
        >
          <div className="text-[11px] font-mono text-rose-500 uppercase tracking-wider flex items-center justify-between font-semibold">
            <span>Chaos Sandbox</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`mt-2.5 flex items-baseline gap-1 text-sm font-bold ${
            isDarkMode ? 'text-zinc-100' : 'text-slate-900'
          }`}>
            <span>Incident Sim</span>
            <ArrowUpRight className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
          </div>
          <div className={`mt-2 text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-medium'}`}>
            Simulate 503 outage or expired certs
          </div>
        </div>
      </div>

      {/* Row 2: Grafana Time-Series Chart (Smooth Bezier Spline - NO SHARP TURNS) */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-semibold flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>Smooth Metric Telemetry · Continuous Curves</span>
            </div>
            <h2 className={`text-base font-bold tracking-tight mt-0.5 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
              Continuous Response Duration (Seconds)
            </h2>
          </div>
          <div className={`flex flex-wrap items-center gap-3 text-xs font-mono ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
            {seriesCurves.map(s => (
              <div key={`series_${s.target.id}`} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                isDarkMode ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-200' : 'bg-slate-100 border-slate-200 text-slate-800 font-medium'
              }`}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color.stroke }} />
                <span className="font-semibold">{s.target.name.split(' ')[0]}</span>
                <span className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>({s.latestLatencyMs}ms)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smooth SVG Multi-Series Wave Canvas with Bezier Splines */}
        <div className="h-48 w-full relative">
          <svg className="w-full h-full overflow-hidden rounded-2xl" viewBox="0 0 800 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            <line x1="0" y1="25" x2="800" y2="25" stroke={isDarkMode ? '#232832' : '#f1f5f9'} strokeWidth="1" />
            <line x1="0" y1="65" x2="800" y2="65" stroke={isDarkMode ? '#232832' : '#f1f5f9'} strokeWidth="1" />
            <line x1="0" y1="105" x2="800" y2="105" stroke={isDarkMode ? '#232832' : '#f1f5f9'} strokeWidth="1" />
            <line x1="0" y1="140" x2="800" y2="140" stroke={isDarkMode ? '#232832' : '#e2e8f0'} strokeWidth="1" />

            {/* SLA Alert Threshold: 2.0s */}
            <line x1="0" y1="45" x2="800" y2="45" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="6 6" strokeOpacity="0.7" />
            <text x="12" y="38" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">SLA Target Limit (2.0s)</text>

            {/* Render Smooth Cubic Bezier Curves (No Sharp Angles) */}
            {seriesCurves.map((s, idx) => {
              const gradId = idx === 0 ? 'url(#emeraldGrad)' : idx === 1 ? 'url(#indigoGrad)' : idx === 2 ? 'url(#amberGrad)' : 'url(#cyanGrad)';
              return (
                <g key={s.target.id}>
                  {/* Smooth Gradient Area Fill */}
                  <path d={s.areaPath} fill={gradId} />
                  {/* Smooth Continuous Line Path */}
                  <path
                    d={s.strokePath}
                    fill="none"
                    stroke={s.color.stroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </svg>

          {/* Y Axis scale labels */}
          <div className="absolute right-2 top-1 bottom-3 flex flex-col justify-between text-[10px] font-mono text-zinc-500 pointer-events-none">
            <span>3.0s</span>
            <span>2.0s</span>
            <span>1.0s</span>
            <span>0.0s</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mt-2 px-1">
          <span>-15 minutes ago</span>
          <span>-10 minutes ago</span>
          <span>-5 minutes ago</span>
          <span className="text-emerald-400 font-semibold">● Live Telemetry Stream</span>
        </div>
      </div>

      {/* Row 3: Target Status Matrix */}
      <div className={`rounded-3xl border overflow-hidden transition-all duration-300 shadow-sm ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-5 border-b flex items-center justify-between ${
          isDarkMode ? 'border-zinc-800/60' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className={`font-bold text-sm tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>Active Target Service Health & DNS Verification</h3>
              <p className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Continuous HTTP probes, TLS expiry checks, and authoritative DNS resolution</p>
            </div>
          </div>
          <span className={`text-xs font-mono px-3 py-1 rounded-full ${isDarkMode ? 'bg-zinc-800/60 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>
            {filteredTargets.length} Probes Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-mono uppercase text-[10px] ${
              isDarkMode ? 'bg-[#14161a] border-zinc-800/60 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <tr>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Endpoint</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">HTTP Code</th>
                <th className="px-5 py-3.5 font-semibold">Response Duration</th>
                <th className="px-5 py-3.5 font-semibold">TLS Certificate</th>
                <th className="px-5 py-3.5 font-semibold">DNS Status</th>
                <th className="px-5 py-3.5 font-semibold">Last Checked</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800/50' : 'divide-slate-200'}`}>
              {filteredTargets.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="max-w-md mx-auto text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
                        <Globe className="w-6 h-6" />
                      </div>
                      <h4 className={`font-bold text-sm ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>Zero Active Probes</h4>
                      <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                        All dummy data has been removed. Switch to <strong>Targets &amp; Probes</strong> above to add your real production website or API.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredTargets.map(target => {
                const isUp = target.lastStatus === 'up';
                const isDown = target.lastStatus === 'down';
                const isDegraded = target.lastStatus === 'degraded';

                return (
                  <tr 
                    key={target.id}
                    onClick={() => onSelectTarget(target.id)}
                    className={`cursor-pointer transition-colors duration-200 ${
                      isDarkMode ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isUp && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-500 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> UP
                        </span>
                      )}
                      {isDown && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-rose-500 animate-pulse px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> DOWN
                        </span>
                      )}
                      {isDegraded && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-500 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> DEGRADED
                        </span>
                      )}
                      {target.lastStatus === 'pending' && (
                        <span className={`inline-flex items-center gap-1.5 font-mono px-2.5 py-0.5 rounded-full text-[11px] ${
                          isDarkMode ? 'text-zinc-400 bg-zinc-800/40' : 'text-slate-600 bg-slate-100'
                        }`}>
                          <Clock className="w-3.5 h-3.5 animate-spin" /> PROBING...
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className={`font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>{target.name}</div>
                      <div className={`text-[11px] font-mono truncate max-w-xs mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{target.url}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold ${
                        target.category === 'ecommerce' 
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : target.category === 'bioscience'
                          ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                          : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {target.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        target.lastStatusCode >= 200 && target.lastStatusCode < 300
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : target.lastStatusCode === 0
                          ? isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}>
                        {target.lastStatusCode || '---'}
                      </span>
                    </td>
                    <td className={`px-5 py-4 font-mono font-medium ${isDarkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
                      {target.lastDurationSeconds > 0 ? `${(target.lastDurationSeconds * 1000).toFixed(0)} ms` : 'Testing...'}
                    </td>
                    <td className="px-5 py-4">
                      {target.sslDaysRemaining !== null ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${
                            target.sslDaysRemaining < 14 
                              ? 'text-rose-500' 
                              : target.sslDaysRemaining < 30 
                              ? 'text-amber-500' 
                              : 'text-emerald-500'
                          }`}>
                            {target.sslDaysRemaining}d
                          </span>
                          <span className={`text-[11px] truncate max-w-[120px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {target.sslIssuer || 'Valid'}
                          </span>
                        </div>
                      ) : (
                        <span className={`font-mono text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Checking...</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {target.dnsMatch === true ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Match
                        </span>
                      ) : target.dnsMatch === false ? (
                        <span className="inline-flex items-center gap-1 text-rose-500 font-mono text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Drift
                        </span>
                      ) : (
                        <span className={`font-mono text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Resolving</span>
                      )}
                    </td>
                    <td className={`px-5 py-4 font-mono text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {target.lastCheckTimestamp > 0 
                        ? `${Math.floor((Date.now() - target.lastCheckTimestamp) / 1000)}s ago` 
                        : 'Just now'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Smooth Gauges for TLS Expiry & Scheduled Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TLS Expiry Panel */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
          isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className={`font-bold text-sm tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>TLS Certificate Validity Gauges</h3>
                <p className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Continuous inspection of cryptographic validity periods</p>
              </div>
            </div>
            <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-medium ${
              isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              SLA: &gt; 30 Days
            </span>
          </div>

          <div className="space-y-4">
            {filteredTargets.filter(t => t.checkSsl).map(target => {
              const days = target.sslDaysRemaining ?? 0;
              const pct = Math.min(100, Math.max(0, (days / 90) * 100));
              const isUrgent = days < 14 && days > 0;
              const isWarning = days < 30 && days >= 14;

              return (
                <div key={`ssl_${target.id}`} className="text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-medium truncate max-w-[200px] ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>{target.name}</span>
                    <span className={`font-mono font-bold ${
                      target.sslDaysRemaining === null 
                        ? isDarkMode ? 'text-zinc-500' : 'text-slate-400'
                        : isUrgent 
                        ? 'text-rose-500 animate-pulse' 
                        : isWarning 
                        ? 'text-amber-500' 
                        : 'text-emerald-500'
                    }`}>
                      {target.sslDaysRemaining !== null ? `${days} days left` : 'Inspecting cert...'}
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-2.5 overflow-hidden p-0.5 ${
                    isDarkMode ? 'bg-zinc-800/60' : 'bg-slate-100 border border-slate-200'
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isUrgent 
                          ? 'bg-gradient-to-r from-rose-600 to-rose-400' 
                          : isWarning 
                          ? 'bg-gradient-to-r from-amber-600 to-amber-400' 
                          : 'bg-gradient-to-r from-emerald-600 to-teal-400'
                      }`}
                      style={{ width: `${target.sslDaysRemaining !== null ? pct : 35}%` }}
                    />
                  </div>
                  <div className={`flex justify-between text-[10px] mt-1 font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-600 font-medium'}`}>
                    <span>{target.sslIssuer || 'Extracting TLS CA...'}</span>
                    <span>{target.sslValidTo ? new Date(target.sslValidTo).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cron Heartbeat Status */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
          isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <h3 className={`font-bold text-sm tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>Cron Job Heartbeat Monitor</h3>
                <p className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Endpoint: POST /heartbeat/:job_id</p>
              </div>
            </div>
            <button
              onClick={onNavigateToCron}
              className={`text-xs px-3 py-1 rounded-full font-mono font-medium transition-all ${
                isDarkMode ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              Dispatch API &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {filteredCronJobs.map((job, jIdx) => {
              const elapsedSec = job.lastHeartbeatTimestamp 
                ? Math.floor((Date.now() - job.lastHeartbeatTimestamp) / 1000)
                : null;
              const deadlineSec = job.deadlineSeconds;
              const pctDeadline = elapsedSec !== null ? Math.min(100, Math.floor((elapsedSec / deadlineSec) * 100)) : 0;

              return (
                <div key={`dash_cron_${job.id}_${jIdx}`} className={`p-3.5 rounded-2xl border text-xs transition-all duration-300 ${
                  isDarkMode ? 'border-zinc-800/60 bg-zinc-900/30' : 'border-slate-200 bg-slate-50/80'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        job.isOverdue 
                          ? 'bg-rose-500 animate-ping' 
                          : elapsedSec !== null 
                          ? 'bg-emerald-400' 
                          : 'bg-zinc-400'
                      }`} />
                      <span className={`font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>{job.name}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      job.isOverdue 
                        ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                        : elapsedSec !== null
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {job.isOverdue ? 'OVERDUE' : elapsedSec !== null ? 'HEALTHY' : 'PENDING PING'}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between text-[11px] font-mono mb-1.5 ${
                    isDarkMode ? 'text-zinc-400' : 'text-slate-600'
                  }`}>
                    <span>
                      {elapsedSec !== null 
                        ? `Last heartbeat: ${Math.floor(elapsedSec / 60)}m ago` 
                        : 'Awaiting first heartbeat check-in'}
                    </span>
                    <span>Deadline: {Math.floor(deadlineSec / 60)}m</span>
                  </div>

                  <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                    isDarkMode ? 'bg-zinc-800/60' : 'bg-slate-200'
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        job.isOverdue ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-teal-400'
                      }`}
                      style={{ width: `${pctDeadline}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
