<div align="center">

# ⚡ BioPulse SRE & Uptime Monitor

### Production-Grade SRE Observability • 100% Free GitHub Pages Deploy • Prometheus Metrics • Zero Cloud Bills ($0.00)

[![GitHub Pages Deployment](https://img.shields.io/github/actions/workflow/status/musaraza004/biopulse-sre-monitor/deploy.yml?branch=main&label=GitHub%20Pages%20Deploy&logo=github&style=flat-square&color=22c55e)](https://musaraza004.github.io/biopulse-sre-monitor/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0284c7?style=flat-square&logo=googlechrome&logoColor=white)](https://musaraza004.github.io/biopulse-sre-monitor/)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b.svg?style=flat-square)](LICENSE)
[![Cost](https://img.shields.io/badge/Cost-%240.00%20Free%20Forever-10b981?style=flat-square&logo=cashapp&logoColor=white)](DEPLOYMENT.md)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prometheus](https://img.shields.io/badge/Prometheus-OpenMetrics-E6522C?style=flat-square&logo=prometheus&logoColor=white)](https://prometheus.io/)
[![OWASP Hardened](https://img.shields.io/badge/Security-SSRF%20Hardened-8b5cf6?style=flat-square&logo=shield&logoColor=white)](#-enterprise-grade-security-audit)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-22c55e.svg?style=flat-square)](https://github.com/musaraza004/biopulse-sre-monitor/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/musaraza004/biopulse-sre-monitor?style=social)](https://github.com/musaraza004/biopulse-sre-monitor)

<br/>

**[🌐 Launch Live GitHub Pages Demo](https://musaraza004.github.io/biopulse-sre-monitor/)** • **[📖 1-Click Deployment Guide](DEPLOYMENT.md)** • **[🐞 Report Bug / Feature Request](https://github.com/musaraza004/biopulse-sre-monitor/issues)**

</div>

---

## 🌟 Overview

**BioPulse SRE Monitor** is an ultra-fast, zero-overhead, production-ready Site Reliability Engineering (SRE) observability suite and high-resilience uptime monitor. 

Engineered for modern DevOps teams, indie hackers, bioscience researchers, and cloud architects who want **enterprise-grade observability without a $500+/month Datadog, New Relic, or BetterStack subscription**.

Deployable in **30 seconds to GitHub Pages for $0.00**, BioPulse gives every user their own isolated workspace using client-side **Google Identity**, local scoped persistence, native **Prometheus `/metrics` OpenMetrics export**, dead-man cron heartbeats, and strict **SSRF firewall protections**.

---

## 🚀 Key Value Propositions

- 💸 **100% Free Forever ($0 Cost Guarantee)**: Hosted at no cost on GitHub Pages global edge CDN with free automated SSL/HTTPS and unlimited GitHub Actions builds.
- 👤 **Per-User Google Account Dashboards**: Built with client-side Google OAuth and browser-scoped sandboxing (`user_{email}`). Every user gets their own private dashboard, probes, and alert thresholds with 0 cloud database overhead.
- 📊 **Prometheus & OpenMetrics Native**: Exposes `/metrics` standard scrape targets with latency histograms, uptime gauges, and error rates ready for Grafana.
- 🛡️ **SSRF & Cloud Metadata Firewalled**: Prohibits private RFC1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), AWS/GCP metadata (`169.254.169.254`), and loopback addresses.
- 🔒 **SSL/TLS Expiration Radar**: Real-time SSL certificate validity inspection, certificate authority verification, and automated expiry warnings.
- ⏱️ **Dead-Man Cron Job Heartbeats**: Secured with Bearer token authentication to monitor critical background workers, ETL pipelines, and scheduled scripts.
- 🧬 **Bioscience & Genomic API Inspector**: Dedicated probes for UniProt, NCBI, AlphaFold, and PDB biological databases.
- 💾 **Zero-Vendor Lock-In JSON Sync**: 1-click JSON export/import allows instant backup, team migration, and offline recovery.

---

## 📊 Feature Comparison Matrix

| Feature | BioPulse SRE Monitor | Datadog | BetterStack | Uptime Kuma |
| :--- | :---: | :---: | :---: | :---: |
| **Monthly Cost** | **$0.00 (Free Forever)** | $15–$23 / host | $29+ / seat | $0 (Self-host VM required) |
| **GitHub Pages 1-Click Deploy** | ✅ **Native** | ❌ | ❌ | ❌ |
| **Serverless Architecture** | ✅ **Zero server cost** | ❌ (SaaS Agent) | ❌ (SaaS) | ❌ (Requires Docker/VPS) |
| **Google Sign-In Scoped Dashboards**| ✅ **Built-in ($0)** | ⚠️ Enterprise SSO fee | ⚠️ Enterprise SSO fee | ❌ (Local auth) |
| **Prometheus `/metrics` Exporter** | ✅ **Standard OpenMetrics** | ⚠️ Add-on Agent | ❌ | ✅ |
| **Built-In SSRF Cloud Firewall** | ✅ **Strict RFC1918 Scrubbing** | N/A | N/A | ⚠️ Requires manual config |
| **SSL/TLS Expiration Radar** | ✅ **Included** | ✅ | ✅ | ✅ |
| **Dead-Man Cron Heartbeats** | ✅ **Bearer Auth** | ⚠️ Extra plan | ✅ | ✅ |
| **Bioscience API Health Radar** | ✅ **Built-in** | ❌ | ❌ | ❌ |
| **Credit Card Required** | ❌ **No credit card ever** | ✅ Required | ✅ Required | ❌ |

---

## 🏗️ Architecture

BioPulse features a **Dual-Engine Architecture** that adapts automatically to your deployment environment:

```
                                  +------------------------------------+
                                  |    GitHub Pages Edge Network CDN   |
                                  |   (musaraza004.github.io/biopulse) |
                                  +-----------------+------------------+
                                                    |
                                          [HTTPS GET / index.html]
                                                    v
                                  +------------------------------------+
                                  |   React 19 + Vite 6 Client Engine  |
                                  +-----------------+------------------+
                                                    |
                        +---------------------------+---------------------------+
                        |                                                       |
                        v                                                       v
         +-----------------------------+                         +-----------------------------+
         |     Google Identity Auth    |                         |    Sandboxed Storage Engine |
         |   (OAuth 2.0 Web Client)    |                         |  - Keyed by user_{email}    |
         |   No backend token leakage  |                         |  - 100% Client-Side ($0)    |
         +-----------------------------+                         |  - JSON Export & Import     |
                                                                 +-----------------------------+
                        |
                        +---------------------------+
                        |                           |
                        v                           v
         +-----------------------------+   +-----------------------------+
         |  Static / Direct Edge Probe |   | Full-Stack Node.js Mode     |
         |  - CORS-enabled HTTP checks |   | (Optional Docker/Server)    |
         |  - Latency percentiles      |   | - Server-side SSRF Firewall |
         |  - Simulated Chaos Drills   |   | - Prometheus /metrics       |
         |  - SSL Expiry calculation   |   | - Cron Bearer Heartbeats    |
         +-----------------------------+   +-----------------------------+
```

---

## 🚀 60-Second Quick Start

### Option A: 1-Click Deploy to GitHub Pages ($0.00 Free Forever)

Deploy your own live instance in under a minute without spending a dime:

1. **Fork or Push** this repository to your GitHub account:  
   `https://github.com/musaraza004/biopulse-sre-monitor`
2. Open your repository on GitHub and click **Settings** ➔ **Pages** (under *Code and automation*).
3. Under **Build and deployment**:
   - Change **Source** to **`GitHub Actions`**.
4. Pushing to `main` automatically triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`).
5. Your live SRE dashboard is published instantly at:  
   `https://<YOUR-GITHUB-USERNAME>.github.io/biopulse-sre-monitor/`

👉 **Read the complete [Step-by-Step GitHub Pages Deployment Guide](DEPLOYMENT.md)**.

---

### Option B: Local Development

```bash
# 1. Clone the repository
git clone https://github.com/musaraza004/biopulse-sre-monitor.git
cd biopulse-sre-monitor

# 2. Install dependencies
npm install

# 3. Create your environment configuration
cp .env.example .env

# 4. Start full-stack development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

### Option C: Production Node.js Build

```bash
# Build optimized static bundle and server
npm run build

# Start production server
npm start
```

---

### Option D: Docker Container Deployment

```bash
# Build the production Docker image
docker build -t biopulse-sre-monitor .

# Run container on port 3000
docker run -d -p 3000:3000 \
  -e PORT=3000 \
  -e HEARTBEAT_SECRET=sre-secret-heartbeat-token-2026 \
  --name biopulse \
  biopulse-sre-monitor
```

---

## 🎯 Core Features Deep-Dive

### 1. Multi-Target Health Radar & SLI/SLO Metrics
- Continuously probes HTTP/HTTPS targets with millisecond precision.
- Computes real-time **Uptime %**, **p50/p95/p99 Latency**, and **Error Budget Remaining** (99.99% SLO).
- Interactive latency sparklines and response-time distribution charts.

### 2. Multi-User Google Sign-In & Data Sandboxing
- Login securely with any Google account using official **Google Identity Services (OAuth 2.0)**.
- Each user's monitors, heartbeat configurations, and incident simulations are isolated in scoped browser storage (`user_{email}`).
- Seamless workspace switcher: switch between accounts or test with team member accounts without mixing data.

### 3. Enterprise-Grade Security & SSRF Defense
Built to withstand strict penetration testing and enterprise compliance:
- **SSRF Firewall**: Rejects localhost (`127.0.0.1`, `::1`), private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and AWS/GCP cloud metadata endpoints (`169.254.169.254`).
- **Path Traversal Shield**: Strictly sanitizes route parameters using alphanumeric regex (`^[a-zA-Z0-9_\-\.]{1,128}$`).
- **OWASP HTTP Headers**: Ships with `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict `Referrer-Policy`.
- **Anti-Flood Rate Limiting**: Intelligent debouncing on bulk probe sweeps (`/api/check-all`) returning `429 Too Many Requests` on abuse attempts.

### 4. Dead-Man Cron Worker Heartbeats
Monitor background cron jobs, Celery workers, and scheduled scripts:
- Workers ping `/heartbeat/:jobId` upon successful job execution.
- Protected by **Bearer Token Authentication**.
- BioPulse flags workers as `STALE` or `DOWN` if a heartbeat is not received within the expected window.

### 5. Native Prometheus `/metrics` Exporter
Plugs directly into your existing observability stack:
- Standard Prometheus/OpenMetrics text format at `/metrics`.
- Scrapeable by Prometheus, VictoriaMetrics, Datadog Agent, or Grafana Agent.
- Includes `biopulse_target_uptime_ratio`, `biopulse_target_latency_ms`, `biopulse_target_status`, and `biopulse_heartbeat_status`.

### 6. SSL/TLS Certificate Expiration Radar
- Inspects remote TLS certificates during checks.
- Displays issuer CA, Subject Alternative Names (SAN), and remaining validity days.
- Triggers alert badges when expiry drops below 14 days.

---

## 📡 API Reference

When running in full-stack mode, BioPulse exposes clean REST endpoints:

### Health Probe
```bash
curl -i http://localhost:3000/healthz
```
*Returns `200 OK` with system uptime, process memory, and security header verification.*

---

### Prometheus Scrape Target
```bash
curl -s http://localhost:3000/metrics
```
*Outputs OpenMetrics format for target latency, uptime percentages, and status gauges.*

---

### Send Cron Job Heartbeat
```bash
curl -X POST http://localhost:3000/heartbeat/daily-db-backup \
  -H "Authorization: Bearer sre-secret-heartbeat-token-2026" \
  -H "Content-Type: application/json" \
  -d '{"status":"ok","latencyMs":42}'
```

---

### Parallel Fleet Sweep
```bash
curl -X POST http://localhost:3000/api/check-all
```
*Triggers asynchronous, debounced health evaluations across all registered targets.*

---

## ⚙️ Environment Variables

Configure BioPulse via `.env` or system environment variables:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `3000` | Port for the full-stack server |
| `HEARTBEAT_SECRET` | String | `sre-secret-heartbeat-token-2026` | Bearer token required for cron heartbeats |
| `CHECK_INTERVAL_SECONDS` | Number | `30` | Automated target polling interval |
| `VITE_GOOGLE_CLIENT_ID` | String | *(Optional)* | Google Cloud OAuth Web Client ID |
| `VITE_APP_MODE` | String | `github-pages` | Execution mode (`github-pages` or `fullstack`) |

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/), [Vite 6](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & UI**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend**: [Node.js 20+](https://nodejs.org/), [Express](https://expressjs.com/)
- **Metrics**: [Prometheus / OpenMetrics Standard](https://prometheus.io/)
- **Deployment**: [GitHub Pages](https://pages.github.com/), [GitHub Actions CI/CD](https://github.com/features/actions)

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## ⭐ Show Your Support

If you find **BioPulse SRE Monitor** useful, give it a **⭐ Star** on [GitHub](https://github.com/musaraza004/biopulse-sre-monitor)! It helps more engineers discover this zero-cost tool.

<div align="center">

Made with ❤️ by [Musa Raza](https://github.com/musaraza004)

[![GitHub](https://img.shields.io/badge/GitHub-musaraza004-181717?style=flat-square&logo=github)](https://github.com/musaraza004)
[![Email](https://img.shields.io/badge/Email-musaraza004%40gmail.com-ea4335?style=flat-square&logo=gmail&logoColor=white)](mailto:musaraza004@gmail.com)

</div>
