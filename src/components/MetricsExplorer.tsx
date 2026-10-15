import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, RefreshCw, ExternalLink, Play, Database } from 'lucide-react';

interface MetricsExplorerProps {
  isDarkMode: boolean;
}

export const MetricsExplorer: React.FC<MetricsExplorerProps> = ({ isDarkMode }) => {
  const [metricsText, setMetricsText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [queryInput, setQueryInput] = useState('monitor_http_up == 0');
  const [queryResult, setQueryResult] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/metrics');
      const text = await res.text();
      setMetricsText(text);
    } catch (err: any) {
      setMetricsText(`# Failed to fetch metrics: ${err?.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(metricsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunQuery = () => {
    if (!metricsText) return;
    const lines = metricsText.split('\n');
    const q = queryInput.trim();

    if (q === 'monitor_http_up == 0') {
      const matching = lines.filter(l => l.startsWith('monitor_http_up') && l.endsWith(' 0'));
      setQueryResult(matching.length > 0 ? matching.join('\n') : '{}: No series matching condition (All UP)');
    } else if (q.includes('monitor_ssl_expiry_days < 14')) {
      const matching = lines.filter(l => {
        if (!l.startsWith('monitor_ssl_expiry_days')) return false;
        const val = parseInt(l.split(' ').pop() || '999', 10);
        return val < 14;
      });
      setQueryResult(matching.length > 0 ? matching.join('\n') : '{}: 0 series matching (< 14 days)');
    } else if (q.includes('monitor_cron_overdue == 1')) {
      const matching = lines.filter(l => l.startsWith('monitor_cron_overdue') && l.endsWith(' 1'));
      setQueryResult(matching.length > 0 ? matching.join('\n') : '{}: 0 jobs overdue');
    } else if (q.includes('monitor_http_duration_seconds')) {
      const matching = lines.filter(l => l.startsWith('monitor_http_duration_seconds'));
      setQueryResult(matching.join('\n'));
    } else {
      const matching = lines.filter(l => l.toLowerCase().includes(q.toLowerCase()) && !l.startsWith('#'));
      setQueryResult(matching.length > 0 ? matching.join('\n') : `Query returned 0 results for "${q}"`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Smooth 3XL Curvature */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-emerald-500" />
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
              Prometheus Scrape Endpoint (GET /metrics)
            </h1>
          </div>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'} mt-1`}>
            Raw OpenMetrics text exposition format conforming to Prometheus server scrape specification (FR-009).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/metrics"
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono font-medium border transition-colors ${
              isDarkMode 
                ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-200' 
                : 'border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <span>Direct /metrics</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Scrape Now</span>
          </button>
        </div>
      </div>

      {/* PromQL Query Sandbox with Smooth 3XL Curvature */}
      <div className={`p-6 rounded-3xl border ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      } space-y-4 shadow-sm`}>
        <div className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
          isDarkMode ? 'text-zinc-400' : 'text-slate-700'
        }`}>
          <Play className="w-3.5 h-3.5 text-indigo-500" />
          <span>PromQL Metric Expression Evaluator</span>
        </div>

        <div className="flex gap-2.5">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="e.g. monitor_http_up == 0 or monitor_ssl_expiry_days < 14"
            className={`flex-1 px-4 py-2.5 text-xs font-mono rounded-full border focus:outline-none transition-all ${
              isDarkMode 
                ? 'bg-[#14161a] border-zinc-700 text-zinc-100 focus:border-indigo-400' 
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
            }`}
          />
          <button
            onClick={handleRunQuery}
            className="px-5 py-2.5 text-xs font-bold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <span>Execute</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`text-[11px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-slate-600 font-semibold'}`}>Presets:</span>
          {[
            'monitor_http_up == 0',
            'monitor_ssl_expiry_days < 14',
            'monitor_cron_overdue == 1',
            'monitor_http_duration_seconds'
          ].map(preset => (
            <button
              key={preset}
              onClick={() => {
                setQueryInput(preset);
                setTimeout(handleRunQuery, 50);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-mono border transition-colors ${
                isDarkMode 
                  ? 'bg-zinc-800/60 hover:bg-zinc-700/60 border-zinc-700/40 text-zinc-300' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 font-medium'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {queryResult !== null && (
          <div className="mt-2 p-4 rounded-2xl bg-zinc-950 font-mono text-xs text-emerald-400 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 mb-1 font-semibold uppercase">Result Vector:</div>
            <pre className="whitespace-pre-wrap">{queryResult}</pre>
          </div>
        )}
      </div>

      {/* Raw Metrics Exposition View */}
      <div className={`rounded-3xl border overflow-hidden ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      } shadow-sm`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isDarkMode ? 'border-zinc-800/60 bg-transparent' : 'border-slate-200 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-2">
            <Database className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`} />
            <span className={`text-xs font-bold font-mono ${isDarkMode ? 'text-zinc-300' : 'text-slate-800'}`}>
              Live OpenMetrics Stream
            </span>
          </div>

          <button
            onClick={handleCopy}
            className={`text-xs flex items-center gap-1 font-mono transition-colors font-semibold ${
              isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <pre className="p-5 bg-[#121417] font-mono text-xs text-zinc-200 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-indigo-900 selection:text-white">
          {metricsText.split('\n').map((line, idx) => {
            if (line.startsWith('# HELP')) {
              return <span key={idx} className="text-zinc-500 block">{line}</span>;
            }
            if (line.startsWith('# TYPE')) {
              return <span key={idx} className="text-zinc-400 font-semibold block">{line}</span>;
            }
            if (line.includes(' 0')) {
              return <span key={idx} className="text-amber-400 font-bold block">{line}</span>;
            }
            if (line.includes(' 1') || line.includes(' 200')) {
              return <span key={idx} className="text-emerald-400 block">{line}</span>;
            }
            return <span key={idx} className="text-cyan-300 block">{line}</span>;
          })}
        </pre>
      </div>
    </div>
  );
};
