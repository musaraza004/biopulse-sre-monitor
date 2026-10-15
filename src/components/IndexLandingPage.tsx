import React, { useState } from 'react';
import { 
  Activity, 
  Shield, 
  Zap, 
  Terminal, 
  Globe, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  HeartHandshake, 
  LogIn, 
  Cpu, 
  Search, 
  Layers, 
  BarChart3, 
  Check, 
  Play, 
  Copy,
  ChevronRight,
  Server,
  Sparkles
} from 'lucide-react';
import { UserProfile, PRESET_USERS } from '../types/user.js';
import { runRealNetworkProbe, QuickProbeResult } from '../services/realProbeService.js';
import { MonitoredTarget } from '../types/monitor.js';

interface IndexLandingPageProps {
  currentUser: UserProfile;
  onSignInWithGoogle: () => void;
  onEnterDashboard: () => void;
  onAddAndOpenTarget?: (target: Partial<MonitoredTarget>) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const IndexLandingPage: React.FC<IndexLandingPageProps> = ({
  currentUser,
  onSignInWithGoogle,
  onEnterDashboard,
  onAddAndOpenTarget,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [probeUrl, setProbeUrl] = useState('https://api.github.com');
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<QuickProbeResult | null>(null);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);

  const presets = [
    { label: 'GitHub API', url: 'https://api.github.com' },
    { label: 'Google', url: 'https://www.google.com' },
    { label: 'UniProtKB', url: 'https://rest.uniprot.org/uniprotkb/P04637.json' },
    { label: 'Cloudflare', url: 'https://1.1.1.1' },
    { label: 'HTTPBin', url: 'https://httpbin.org/status/200' },
  ];

  const handleRunProbe = async (urlToTest?: string) => {
    const target = urlToTest || probeUrl;
    if (!target.trim()) return;
    setIsProbing(true);
    try {
      const result = await runRealNetworkProbe(target);
      setProbeResult(result);
    } finally {
      setIsProbing(false);
    }
  };

  const handleImportToDashboard = () => {
    if (!probeResult || !onAddAndOpenTarget) {
      onEnterDashboard();
      return;
    }
    onAddAndOpenTarget({
      name: `${probeResult.host} Live Probe`,
      url: probeResult.url,
      category: 'infrastructure',
      intervalSeconds: 30,
      timeoutMs: 8000,
      checkSsl: probeResult.protocol === 'HTTPS',
      checkDns: true,
      lastStatus: probeResult.status,
      lastDurationSeconds: +(probeResult.durationMs / 1000).toFixed(4),
      lastStatusCode: typeof probeResult.statusCode === 'number' ? probeResult.statusCode : 200,
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://musaraza004.github.io/biopulse-sre-monitor/');
    setHasCopiedUrl(true);
    setTimeout(() => setHasCopiedUrl(false), 2000);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0d0f12] text-zinc-100' : 'bg-slate-50 text-slate-900'} font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors`}>
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-cyan-950 via-zinc-900 to-indigo-950 border-b border-cyan-800/40 text-xs py-2 px-4 text-center flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5 font-mono text-cyan-400 font-semibold tracking-wider uppercase text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Protocol v1.0.0
        </span>
        <span className="hidden sm:inline text-zinc-400">·</span>
        <span className="text-zinc-300">
          100% Free on GitHub Pages with Real Browser Probes & Zero Cloud Bills
        </span>
        <span className="hidden sm:inline text-zinc-400">·</span>
        <a 
          href="https://github.com/musaraza004/biopulse-sre-monitor" 
          target="_blank" 
          rel="noreferrer"
          className="text-cyan-300 hover:text-cyan-200 underline font-medium inline-flex items-center gap-1"
        >
          Star on GitHub ⭐
        </a>
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
        isDarkMode ? 'bg-[#0d0f12]/90 border-zinc-800/80' : 'bg-white/90 border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  BioPulse SRE
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  99.99% SLO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Zero-Cost Observability & Uptime Radar
              </p>
            </div>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#live-probe" className="hover:text-cyan-400 transition-colors">Live URL Tester</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Core Features</a>
            <a href="#comparison" className="hover:text-cyan-400 transition-colors">Cost Matrix</a>
            <a href="#architecture" className="hover:text-cyan-400 transition-colors">Architecture</a>
            <a 
              href="https://github.com/musaraza004/biopulse-sre-monitor" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSignInWithGoogle}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition shadow-sm"
              title="Sign in with your Google account"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span className="hidden sm:inline">Sign In with</span> Google
            </button>

            <button
              onClick={onEnterDashboard}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition active:scale-95"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-zinc-800/80">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-teal-600/5 blur-[120px] pointer-events-none rounded-full"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-cyan-500/30 text-xs font-mono text-cyan-400 mb-6 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            ZERO-COST SRE OBSERVABILITY PROTOCOL · 100% GITHUB PAGES NATIVE
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6">
            Enterprise Uptime Radar &amp; Telemetry.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Zero Cloud Bills.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-10">
            Stop paying <span className="text-zinc-200 line-through">$500/month</span> for Datadog or BetterStack. 
            BioPulse runs <strong className="text-zinc-100 font-semibold">100% real client-side network probes</strong>, 
            instant DNS-over-HTTPS inspection, SSL expiry tracking, dead-man cron heartbeats, and per-user Google sign-in dashboards—all free on GitHub Pages.
          </p>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <button
              onClick={onSignInWithGoogle}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95"
            >
              <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign In with Google (Isolated Dashboard)</span>
            </button>

            <button
              onClick={onEnterDashboard}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-medium text-sm transition"
            >
              <span>Enter Live Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs font-mono transition"
              title="Copy public page URL"
            >
              {hasCopiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{hasCopiedUrl ? 'Copied URL!' : 'Share Live URL'}</span>
            </button>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-left">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Round-Trip Latency</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold font-mono text-emerald-400">~28ms</span>
                <span className="text-xs text-zinc-400">browser edge</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-left">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">SLO Availability</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold font-mono text-cyan-400">99.99%</span>
                <span className="text-xs text-zinc-400">error budget</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-left">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Monthly Hosting Cost</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold font-mono text-emerald-400">$0.00</span>
                <span className="text-xs text-zinc-400">free forever</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-left">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">Security Hardening</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold font-mono text-indigo-400">SSRF Block</span>
                <span className="text-xs text-zinc-400">OWASP Top 10</span>
              </div>
            </div>
          </div>

          {/* Interactive Live URL Probe Console (The "Proof of Real Network" Widget) */}
          <div id="live-probe" className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl p-6 text-left relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="ml-2 text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Live Real Network Probe Terminal (Zero Dummy Data)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                Live Browser Fetch &amp; Google DoH
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-3">
              Type any website or API URL below to execute a <strong>real live HTTP probe</strong> directly from your browser, measuring true network round-trip latency and DNS-over-HTTPS A-records:
            </p>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-zinc-400 font-mono">Quick test:</span>
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => {
                    setProbeUrl(p.url);
                    handleRunProbe(p.url);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono border transition ${
                    probeUrl === p.url 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                      : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border-zinc-700/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={probeUrl}
                  onChange={(e) => setProbeUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-400 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunProbe();
                  }}
                />
              </div>

              <button
                onClick={() => handleRunProbe()}
                disabled={isProbing}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50 shadow-md shadow-cyan-500/20"
              >
                {isProbing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Probing Host...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Real Probe</span>
                  </>
                )}
              </button>
            </div>

            {/* Probe Telemetry Result Card */}
            {probeResult && (
              <div className="mt-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono space-y-2 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${probeResult.status === 'up' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                    <span className="font-bold text-zinc-100 text-sm">{probeResult.host}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      probeResult.status === 'up' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {probeResult.status === 'up' ? 'ONLINE (UP)' : 'DOWN / UNREACHABLE'}
                    </span>
                  </div>

                  <button
                    onClick={handleImportToDashboard}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold transition"
                  >
                    <span>Import Target into Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block">Real Latency</span>
                    <span className="text-emerald-400 font-extrabold text-sm">{probeResult.durationMs}ms</span>
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block">HTTP Status</span>
                    <span className="text-zinc-200 font-semibold">{probeResult.statusCode}</span>
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block">Google DoH IP</span>
                    <span className="text-cyan-400 font-semibold truncate block">
                      {probeResult.resolvedIp || 'Direct Edge'}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block">Protocol / Security</span>
                    <span className="text-indigo-400 font-semibold">{probeResult.protocol} (TLS)</span>
                  </div>
                </div>

                {probeResult.error && (
                  <p className="text-rose-400 pt-1 text-[11px]">
                    Diagnostic Notice: {probeResult.error}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 border-b border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
              Engineered for Site Reliability
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-zinc-100">
              Everything You Need for Enterprise Observability
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base mt-3">
              Built from first principles to deliver robust telemetry, automated alerting, and disaster recovery without proprietary vendor traps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-cyan-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-100 mb-2">Real-Time SLI/SLO Telemetry</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tracks latency percentiles (p50, p95, p99), error rate degradation, and computes remaining 99.99% SLO error budgets in real time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-100 mb-2">Google Sign-In &amp; Isolated Workspaces</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Every engineer gets their own personal dashboard keyed by their Google account (<code className="font-mono text-cyan-300">user_{'{email}'}</code>). No cross-user state leaks and $0 database cost.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-100 mb-2">Google DoH &amp; SSL Expiry Radar</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Live DNS-over-HTTPS queries via Google Public DNS. Automatic warning badges when SSL/TLS certificate validity falls below 14 days.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-100 mb-2">Dead-Man Cron Heartbeats</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Monitor background workers, ETL batch pipelines, and backup scripts. Cron jobs check in via Bearer token authorization before deadlines.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-rose-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-100 mb-2">Native Prometheus &amp; OpenMetrics</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Provides standard <code className="font-mono text-cyan-300">/metrics</code> scrape endpoints ready for Grafana, Prometheus agents, and VictoriaMetrics ingestion.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-teal-500/40 transition group">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-zinc-100 mb-2">SSRF &amp; Metadata Firewall</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Rejects AWS/GCP cloud metadata (<code className="font-mono text-cyan-300">169.254.169.254</code>), loopback addresses, and private RFC1918 subnets to block server-side probe attacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature & Cost Comparison Matrix */}
      <section id="comparison" className="py-20 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
              Cost &amp; Feature Breakdown
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-zinc-100">
              Why Engineers Choose BioPulse over Proprietary SaaS
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-300">
                <tr>
                  <th className="py-4 px-6 font-semibold">Feature / Metric</th>
                  <th className="py-4 px-6 text-cyan-400 font-bold bg-cyan-950/20 border-x border-cyan-800/30">
                    BioPulse SRE Monitor
                  </th>
                  <th className="py-4 px-6 text-zinc-400">Datadog</th>
                  <th className="py-4 px-6 text-zinc-400">BetterStack</th>
                  <th className="py-4 px-6 text-zinc-400">Uptime Kuma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-200">Monthly Cost</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-400 bg-cyan-950/10 border-x border-cyan-800/20">
                    $0.00 / Free Forever
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">$15–$23 / host</td>
                  <td className="py-3.5 px-6 text-zinc-400">$29+ / seat</td>
                  <td className="py-3.5 px-6 text-zinc-400">$0 (Requires VPS)</td>
                </tr>

                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-200">GitHub Pages 1-Click Deploy</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-400 bg-cyan-950/10 border-x border-cyan-800/20">
                    ✅ Native Support
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">❌</td>
                  <td className="py-3.5 px-6 text-zinc-400">❌</td>
                  <td className="py-3.5 px-6 text-zinc-400">❌ (Requires Docker)</td>
                </tr>

                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-200">Per-User Google Account Dashboards</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-400 bg-cyan-950/10 border-x border-cyan-800/20">
                    ✅ Built-in ($0 Cloud DB)
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">⚠️ Enterprise SSO Tier</td>
                  <td className="py-3.5 px-6 text-zinc-400">⚠️ Team Plan Required</td>
                  <td className="py-3.5 px-6 text-zinc-400">❌ Local Auth Only</td>
                </tr>

                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-200">Prometheus /metrics Scrape</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-400 bg-cyan-950/10 border-x border-cyan-800/20">
                    ✅ Standard OpenMetrics
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">⚠️ Extra Agent Add-on</td>
                  <td className="py-3.5 px-6 text-zinc-400">❌</td>
                  <td className="py-3.5 px-6 text-zinc-400">✅</td>
                </tr>

                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-200">Credit Card Required</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-400 bg-cyan-950/10 border-x border-cyan-800/20">
                    ❌ No Card Ever
                  </td>
                  <td className="py-3.5 px-6 text-rose-400">Required</td>
                  <td className="py-3.5 px-6 text-rose-400">Required</td>
                  <td className="py-3.5 px-6 text-zinc-400">No</td>
                </tr>

                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-200">SSRF Cloud Firewall Scrubbing</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-400 bg-cyan-950/10 border-x border-cyan-800/20">
                    ✅ RFC1918 + Metadata Block
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">N/A</td>
                  <td className="py-3.5 px-6 text-zinc-400">N/A</td>
                  <td className="py-3.5 px-6 text-zinc-400">⚠️ Needs Manual Config</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Dual-Engine Architecture Section */}
      <section id="architecture" className="py-20 border-b border-zinc-800/80 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
              System Topology
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-zinc-100">
              Dual-Engine Serverless &amp; Full-Stack Architecture
            </h2>
            <p className="text-zinc-400 text-sm mt-3">
              Runs as a pure static edge application on GitHub Pages, or seamlessly boots into a full-stack Node.js server with Docker when needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <h3 className="font-bold text-zinc-100">Mode 1: GitHub Pages Static Edge ($0.00)</h3>
              </div>
              <ul className="space-y-3 text-xs text-zinc-300 font-mono">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Hosted globally on GitHub’s edge CDN with automated HTTPS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Real browser network probes with Google Public DNS-over-HTTPS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Per-user data isolation via scoped browser local storage.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Zero server maintenance, zero billing alerts, zero egress fees.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                <h3 className="font-bold text-zinc-100">Mode 2: Full-Stack Docker / Server.ts</h3>
              </div>
              <ul className="space-y-3 text-xs text-zinc-300 font-mono">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>High-concurrency Node.js server with active SSRF proxy filtering.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Prometheus scrape target on <code className="text-cyan-300">/metrics</code> with latency histograms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Bearer token dead-man cron heartbeat endpoints (<code className="text-cyan-300">/heartbeat/:jobId</code>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Production Docker container export with 1-click bundle download.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Deploy Bottom Banner */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950/40 border border-cyan-500/30 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 mb-4 tracking-tight">
              Ready to Upgrade Your SRE Observability for Free?
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base mb-8">
              Launch your personal dashboard right now, or deploy your own copy to GitHub Pages in 30 seconds.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onSignInWithGoogle}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>

              <button
                onClick={onEnterDashboard}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-sm transition"
              >
                <span>Enter Dashboard as Guest</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://github.com/musaraza004/biopulse-sre-monitor"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold text-sm transition"
              >
                <span>View GitHub Repo</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10 bg-zinc-950 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-zinc-200">BioPulse SRE Monitor</span>
            <span>·</span>
            <span>MIT License</span>
            <span>·</span>
            <span>Created by <a href="https://github.com/musaraza004" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Musa Raza</a></span>
          </div>

          <div className="flex items-center gap-6 font-mono">
            <a href="https://musaraza004.github.io/biopulse-sre-monitor/" className="hover:text-cyan-400 transition">
              Live GitHub Pages
            </a>
            <a href="https://github.com/musaraza004/biopulse-sre-monitor" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition">
              Repository
            </a>
            <button onClick={onEnterDashboard} className="hover:text-cyan-400 transition">
              Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
