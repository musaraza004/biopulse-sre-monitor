import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Copy, 
  Check, 
  Download, 
  FileCode
} from 'lucide-react';

interface DockerBundleExporterProps {
  isDarkMode: boolean;
}

type FileTab = 'compose' | 'targets' | 'prometheus' | 'alerts' | 'python' | 'readme';

export const DockerBundleExporter: React.FC<DockerBundleExporterProps> = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<FileTab>('compose');
  const [copied, setCopied] = useState(false);
  const [bundleData, setBundleData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/export/bundle')
      .then(res => res.json())
      .then(data => setBundleData(data))
      .catch(() => {});
  }, []);

  const readmeContent = `# Lightweight Uptime & Health Monitor
## SRE / DevOps Portfolio Project · E-Commerce & Bioscience Observability

A self-hosted, lightweight monitoring stack built with Python, Prometheus, and Grafana.

### Architecture
- **Monitor Service** (Python 3.12+ / FastAPI / httpx):
  - HTTP Availability & Latency checks
  - SSL/TLS Certificate Expiry calculation
  - DNS A-record verification
  - Authenticated Cron Heartbeat Receiver (\`POST /heartbeat/{job_id}\`)
  - Prometheus Metrics Exporter (\`GET /metrics\`)
- **Prometheus** (v2.51.0): Scrapes metrics every 15s, preserves 15-day history across container restarts.
- **Grafana** (v10.4.0): Automatically provisions datasources and dashboards upon launch.

### Quick Start
\`\`\`bash
# 1. Clone repository & inspect configuration
git clone https://github.com/your-username/uptime-monitor.git
cd uptime-monitor

# 2. Start the complete stack
docker compose up -d

# 3. Verify running containers
docker compose ps
\`\`\`

### Access Points
- **Grafana Dashboard**: [http://localhost:3001](http://localhost:3001) (admin / admin)
- **Prometheus UI & Alerts**: [http://localhost:9090](http://localhost:9090)
- **Monitor Health**: [http://localhost:8000/healthz](http://localhost:8000/healthz)
- **Prometheus Metrics**: [http://localhost:8000/metrics](http://localhost:8000/metrics)

### Testing a Cron Heartbeat
\`\`\`bash
curl -X POST http://localhost:8000/heartbeat/catalog_sync \\
  -H "Authorization: Bearer sre-secret-heartbeat-token-2026" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "success", "duration_ms": 1150, "notes": "Sync OK"}'
\`\`\`
`;

  const filesMap: Record<FileTab, { name: string; content: string; language: string }> = {
    compose: {
      name: 'compose.yaml',
      content: bundleData?.composeYaml || '# Loading...',
      language: 'yaml'
    },
    targets: {
      name: 'config/targets.yaml',
      content: bundleData?.targetsYaml || '# Loading...',
      language: 'yaml'
    },
    prometheus: {
      name: 'prometheus/prometheus.yml',
      content: bundleData?.prometheusYml || '# Loading...',
      language: 'yaml'
    },
    alerts: {
      name: 'prometheus/alerts.yml',
      content: bundleData?.alertsYml || '# Loading...',
      language: 'yaml'
    },
    python: {
      name: 'app/main.py',
      content: bundleData?.pythonScript || '# Loading...',
      language: 'python'
    },
    readme: {
      name: 'README.md',
      content: readmeContent,
      language: 'markdown'
    }
  };

  const currentFile = filesMap[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name.split('/').pop() || 'config.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Smooth 3XL Curvature */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-indigo-500" />
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
              Docker Compose & Portfolio Repository Artifacts
            </h1>
          </div>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'} mt-1`}>
            Production-ready files to run the 3-container monitoring stack on any Linux host, VPS, or local developer machine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadFile}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              isDarkMode 
                ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-200' 
                : 'border-slate-300 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {currentFile.name.split('/').pop()}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Architecture Highlights with Smooth 3XL Radii */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className={`p-5 rounded-3xl border transition-all duration-300 ${
          isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          <div className="font-bold text-indigo-500 dark:text-indigo-400 text-sm">1. Monitor Container</div>
          <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Python 3.12, FastAPI, Asyncio, httpx, dnspython</div>
          <div className={`mt-2 font-mono text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}`}>Port 8000 &middot; Healthcheck enabled</div>
        </div>

        <div className={`p-5 rounded-3xl border transition-all duration-300 ${
          isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          <div className="font-bold text-amber-500 dark:text-amber-400 text-sm">2. Prometheus Container</div>
          <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>prom/prometheus:v2.51.0 with alerts.yml & 15d volume</div>
          <div className={`mt-2 font-mono text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}`}>Port 9090 &middot; 15s scrape interval</div>
        </div>

        <div className={`p-5 rounded-3xl border transition-all duration-300 ${
          isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
        }`}>
          <div className="font-bold text-emerald-500 dark:text-emerald-400 text-sm">3. Grafana Container</div>
          <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Auto-provisioned datasource & 12-panel dashboard</div>
          <div className={`mt-2 font-mono text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}`}>Port 3001:3000 &middot; Ready on startup</div>
        </div>
      </div>

      {/* File Viewer Box with Smooth 3XL Curvature */}
      <div className={`rounded-3xl border overflow-hidden ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      } shadow-sm`}>
        {/* File Tabs with Smooth Rounded-Full Pills */}
        <div className={`flex items-center space-x-1.5 p-3 border-b overflow-x-auto text-xs ${
          isDarkMode ? 'bg-[#14161a] border-zinc-800/60' : 'bg-slate-100/80 border-slate-200'
        }`}>
          {(['compose', 'targets', 'prometheus', 'alerts', 'python', 'readme'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[11px] transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                  : isDarkMode 
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{filesMap[tab].name}</span>
            </button>
          ))}
        </div>

        {/* Code Content */}
        <pre className="p-5 bg-[#121417] font-mono text-xs text-zinc-200 overflow-x-auto max-h-[550px] leading-relaxed selection:bg-indigo-900 selection:text-white">
          {currentFile.content}
        </pre>
      </div>
    </div>
  );
};
