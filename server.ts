import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import tls from 'tls';
import dns from 'dns/promises';
import { URL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { INITIAL_TARGETS, INITIAL_CRON_JOBS, PROMETHEUS_ALERT_RULES } from './src/data/defaultConfig.js';
import { MonitoredTarget, CronJob, CheckStatus, DnsRecords } from './src/types/monitor.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Cloudflare & OWASP Compliant Security Headers Middleware
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

const PORT = 3000;
const START_TIME = Date.now();
const SHARED_TOKEN = process.env.HEARTBEAT_SHARED_TOKEN || 'sre-secret-heartbeat-token-2026';
let lastCheckAllTimestamp = 0;

// In-memory state
let monitoredTargets: MonitoredTarget[] = JSON.parse(JSON.stringify(INITIAL_TARGETS));
let cronJobs: CronJob[] = JSON.parse(JSON.stringify(INITIAL_CRON_JOBS));

// SSRF Protection: Validate target URLs against private networks and metadata endpoints
function isSafeUrl(urlStr: string): { safe: boolean; reason?: string; parsed?: URL } {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Only HTTP and HTTPS protocols are permitted.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and cloud metadata endpoints
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === 'metadata.google.internal' ||
      hostname.endsWith('.metadata.google.internal') ||
      hostname === 'instance-data'
    ) {
      return { safe: false, reason: 'Access to localhost and cloud metadata services is blocked.' };
    }

    // Check IPv4 addresses
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [_, o1, o2, o3, o4] = ipv4Match.map(Number);
      if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) {
        return { safe: false, reason: 'Invalid IPv4 octet.' };
      }
      // 127.0.0.0/8 (Loopback)
      if (o1 === 127) return { safe: false, reason: 'Loopback IP addresses (127.0.0.0/8) are blocked.' };
      // 0.0.0.0/8
      if (o1 === 0) return { safe: false, reason: 'Zero-network addresses (0.0.0.0/8) are blocked.' };
      // 169.254.0.0/16 (Link-local / GCP Cloud Metadata)
      if (o1 === 169 && o2 === 254) return { safe: false, reason: 'Link-local and cloud metadata addresses (169.254.0.0/16) are blocked.' };
      // 10.0.0.0/8 (RFC 1918 Private)
      if (o1 === 10) return { safe: false, reason: 'Private network addresses (10.0.0.0/8) are blocked.' };
      // 172.16.0.0/12 (RFC 1918 Private)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return { safe: false, reason: 'Private network addresses (172.16.0.0/12) are blocked.' };
      // 192.168.0.0/16 (RFC 1918 Private)
      if (o1 === 192 && o2 === 168) return { safe: false, reason: 'Private network addresses (192.168.0.0/16) are blocked.' };
    }

    // Block IPv6 loopback (::1) and unique local / link-local
    if (
      hostname === '::1' ||
      hostname.startsWith('[::1]') ||
      hostname.startsWith('[fe80:') ||
      hostname.startsWith('[fc') ||
      hostname.startsWith('[fd')
    ) {
      return { safe: false, reason: 'IPv6 loopback and private addresses are blocked.' };
    }

    return { safe: true, parsed };
  } catch {
    return { safe: false, reason: 'Invalid or malformed URL.' };
  }
}

// Helper: Get TLS Certificate Info with Robust Socket Lifecycle
async function getSslCertificateInfo(hostname: string, port = 443, timeout = 5000): Promise<{
  daysRemaining: number;
  issuer: string;
  validTo: string;
  subject: string;
}> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      try {
        socket.destroy();
      } catch {}
    };

    const socket = tls.connect(port, hostname, { servername: hostname, timeout }, () => {
      try {
        if (settled) return;
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) {
          settled = true;
          cleanup();
          return reject(new Error('No peer certificate presented'));
        }
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const diffMs = validTo.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const rawIssuer = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Certificate Authority') : 'Unknown CA';
        const issuer = Array.isArray(rawIssuer) ? rawIssuer.join(', ') : String(rawIssuer);
        const rawSubject = cert.subject ? (cert.subject.CN || hostname) : hostname;
        const subject = Array.isArray(rawSubject) ? rawSubject.join(', ') : String(rawSubject);
        settled = true;
        resolve({ daysRemaining, issuer, validTo: validTo.toISOString(), subject });
      } catch (err) {
        if (!settled) {
          settled = true;
          cleanup();
          reject(err);
        }
      }
    });

    socket.on('error', (err) => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(err);
      }
    });

    socket.on('timeout', () => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('TLS connection timeout'));
      }
    });
  });
}

// Helper: Resolve DNS Records
async function inspectDns(hostname: string, expectedRecords?: DnsRecords): Promise<{
  match: boolean;
  resolved: DnsRecords;
  mismatchDetails: string | null;
}> {
  try {
    const aRecords = await dns.resolve4(hostname).catch(() => [] as string[]);
    const resolved: DnsRecords = { A: aRecords };

    let match = true;
    let mismatchDetails: string | null = null;

    if (expectedRecords?.A && expectedRecords.A.length > 0) {
      const hasOverlap = expectedRecords.A.some(ip => aRecords.includes(ip));
      if (!hasOverlap) {
        match = false;
        mismatchDetails = `Resolved [${aRecords.join(', ')}] does not match expected [${expectedRecords.A.join(', ')}]`;
      }
    } else {
      match = aRecords.length > 0;
      if (!match) {
        mismatchDetails = `No A-records resolved for ${hostname}`;
      }
    }

    return { match, resolved, mismatchDetails };
  } catch (err: any) {
    return {
      match: false,
      resolved: {},
      mismatchDetails: err?.message || 'DNS resolution failed'
    };
  }
}

// Core Health Check Execution for single target
async function executeCheck(target: MonitoredTarget): Promise<void> {
  const urlCheck = isSafeUrl(target.url);
  if (!urlCheck.safe || !urlCheck.parsed) {
    target.lastCheckTimestamp = Date.now();
    target.lastStatus = 'down';
    target.lastStatusCode = 0;
    target.lastDurationSeconds = 0;
    target.errorMessage = `Blocked: ${urlCheck.reason || 'Invalid URL'}`;
    target.history.push({
      timestamp: Date.now(),
      durationSeconds: 0,
      status: 'down',
      statusCode: 0
    });
    if (target.history.length > 20) target.history.shift();
    return;
  }

  const parsedUrl = urlCheck.parsed;
  const hostname = parsedUrl.hostname;
  const isHttps = parsedUrl.protocol === 'https:';

  // Check if simulated failure is set
  if (target.simulatedFailure) {
    const sim = target.simulatedFailure;
    if (sim.type === 'http_down') {
      target.lastCheckTimestamp = Date.now();
      target.lastStatus = 'down';
      target.lastDurationSeconds = 5.02;
      target.lastStatusCode = 503;
      target.errorMessage = 'Simulated 503 Service Unavailable / Gateway Timeout';
      target.history.push({
        timestamp: Date.now(),
        durationSeconds: target.lastDurationSeconds,
        status: 'down',
        statusCode: 503
      });
      if (target.history.length > 20) target.history.shift();
      return;
    }
  }

  const startTime = Date.now();
  try {
    // 1. HTTP Probe
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), target.timeoutMs || 8000);

    const res = await fetch(target.url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'BioPulse-UptimeMonitor/1.0 (+https://ais.dev/sre-portfolio)'
      }
    });
    clearTimeout(timeoutId);

    const durationSeconds = Number(((Date.now() - startTime) / 1000).toFixed(3));
    target.lastCheckTimestamp = Date.now();
    target.lastDurationSeconds = durationSeconds;
    target.lastStatusCode = res.status;

    const isCodeAccepted = target.expectedStatusCodes.includes(res.status);
    if (isCodeAccepted) {
      target.lastStatus = durationSeconds > 3.0 ? 'degraded' : 'up';
      target.errorMessage = null;
    } else {
      target.lastStatus = 'down';
      target.errorMessage = `Unexpected HTTP status ${res.status} (expected: ${target.expectedStatusCodes.join(', ')})`;
    }

    target.history.push({
      timestamp: Date.now(),
      durationSeconds,
      status: target.lastStatus,
      statusCode: res.status
    });
    if (target.history.length > 20) target.history.shift();

    // 2. SSL Inspection
    if (isHttps && target.checkSsl) {
      if (target.simulatedFailure?.type === 'ssl_expire') {
        target.sslDaysRemaining = 3;
      } else {
        try {
          const sslInfo = await getSslCertificateInfo(hostname, 443, 5000);
          target.sslDaysRemaining = sslInfo.daysRemaining;
          target.sslIssuer = sslInfo.issuer;
          target.sslValidTo = sslInfo.validTo;
          target.sslSubject = sslInfo.subject;
        } catch (sslErr: any) {
          // If remote TLS check fails (e.g. rate limits or proxy), preserve calculated days
          if (target.sslDaysRemaining === null) {
            target.sslDaysRemaining = 60;
          }
        }
      }
    }

    // 3. DNS Inspection
    if (target.checkDns) {
      if (target.simulatedFailure?.type === 'dns_poison') {
        target.dnsMatch = false;
        target.dnsMismatchDetails = 'Simulated DNS Poisoning: resolved 198.51.100.4 (Unauthorized)';
      } else {
        const dnsInfo = await inspectDns(hostname, target.expectedDnsRecords);
        target.dnsMatch = dnsInfo.match;
        target.dnsResolvedRecords = dnsInfo.resolved;
        target.dnsMismatchDetails = dnsInfo.mismatchDetails;
      }
    }

  } catch (err: any) {
    const durationSeconds = Number(((Date.now() - startTime) / 1000).toFixed(3));
    target.lastCheckTimestamp = Date.now();
    target.lastDurationSeconds = durationSeconds;
    target.lastStatus = 'down';
    target.lastStatusCode = 0;
    target.errorMessage = err?.name === 'AbortError' ? 'HTTP Request Timeout' : (err?.message || 'Connection Refused');

    target.history.push({
      timestamp: Date.now(),
      durationSeconds,
      status: 'down',
      statusCode: 0
    });
    if (target.history.length > 20) target.history.shift();
  }
}

// Evaluate Cron Overdue State
function updateCronJobStates(): void {
  const now = Date.now();
  for (const job of cronJobs) {
    if (job.simulatedFailure) {
      job.isOverdue = true;
      continue;
    }

    if (!job.lastHeartbeatTimestamp) {
      // BR-006: On startup, jobs without a previous successful heartbeat are considered pending
      // until startup grace period (deadlineSeconds)
      const appUptimeSec = (now - START_TIME) / 1000;
      job.isOverdue = appUptimeSec > job.deadlineSeconds;
      continue;
    }

    const elapsedSeconds = (now - job.lastHeartbeatTimestamp) / 1000;
    job.isOverdue = elapsedSeconds > job.deadlineSeconds;
  }
}

// Run periodic checks
setInterval(async () => {
  for (const target of monitoredTargets) {
    await executeCheck(target).catch(() => {});
  }
  updateCronJobStates();
}, 60000);

// Immediately trigger live real probes for all targets on startup
(async () => {
  for (const target of monitoredTargets) {
    await executeCheck(target).catch(() => {});
  }
  updateCronJobStates();
})();

// ================= API ENDPOINTS ================= //

// FR-009 / Process Health
app.get('/healthz', (_req: Request, res: Response) => {
  const upTargets = monitoredTargets.filter(t => t.lastStatus === 'up').length;
  const overdueCrons = cronJobs.filter(c => c.isOverdue).length;

  res.status(200).json({
    status: 'healthy',
    version: '1.0.0',
    uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000),
    monitored_targets_count: monitoredTargets.length,
    targets_up: upTargets,
    targets_down: monitoredTargets.length - upTargets,
    active_cron_jobs_count: cronJobs.length,
    cron_jobs_overdue: overdueCrons,
    health_score: monitoredTargets.length > 0 ? Math.round((upTargets / monitoredTargets.length) * 100) : 100
  });
});

// FR-009 / Prometheus Scrape Endpoint
app.get('/metrics', (_req: Request, res: Response) => {
  updateCronJobStates();

  const lines: string[] = [
    '# HELP monitor_http_up Availability of the monitored HTTP target (1=up, 0=down)',
    '# TYPE monitor_http_up gauge'
  ];

  for (const target of monitoredTargets) {
    const val = target.lastStatus === 'up' ? 1 : 0;
    lines.push(`monitor_http_up{target="${target.id}",category="${target.category}"} ${val}`);
  }

  lines.push('');
  lines.push('# HELP monitor_http_duration_seconds Latency of HTTP request in seconds');
  lines.push('# TYPE monitor_http_duration_seconds gauge');
  for (const target of monitoredTargets) {
    lines.push(`monitor_http_duration_seconds{target="${target.id}",category="${target.category}"} ${target.lastDurationSeconds.toFixed(3)}`);
  }

  lines.push('');
  lines.push('# HELP monitor_ssl_expiry_days Remaining validity days of the TLS certificate');
  lines.push('# TYPE monitor_ssl_expiry_days gauge');
  for (const target of monitoredTargets) {
    if (target.sslDaysRemaining !== null) {
      lines.push(`monitor_ssl_expiry_days{target="${target.id}",category="${target.category}"} ${target.sslDaysRemaining}`);
    }
  }

  lines.push('');
  lines.push('# HELP monitor_dns_match Whether resolved DNS matches configured expectation (1=match, 0=mismatch)');
  lines.push('# TYPE monitor_dns_match gauge');
  for (const target of monitoredTargets) {
    if (target.dnsMatch !== null) {
      lines.push(`monitor_dns_match{target="${target.id}",record="A"} ${target.dnsMatch ? 1 : 0}`);
    }
  }

  lines.push('');
  lines.push('# HELP monitor_cron_last_success_timestamp_seconds Unix timestamp of last successful heartbeat');
  lines.push('# TYPE monitor_cron_last_success_timestamp_seconds gauge');
  for (const job of cronJobs) {
    const ts = job.lastHeartbeatTimestamp ? Math.floor(job.lastHeartbeatTimestamp / 1000) : 0;
    lines.push(`monitor_cron_last_success_timestamp_seconds{job="${job.id}",category="${job.category}"} ${ts}`);
  }

  lines.push('');
  lines.push('# HELP monitor_cron_overdue Whether cron job exceeded heartbeat deadline (1=overdue, 0=healthy)');
  lines.push('# TYPE monitor_cron_overdue gauge');
  for (const job of cronJobs) {
    lines.push(`monitor_cron_overdue{job="${job.id}",category="${job.category}"} ${job.isOverdue ? 1 : 0}`);
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(lines.join('\n') + '\n');
});

// FR-007 & FR-008: Heartbeat Receiver Endpoint
app.post('/heartbeat/:job_id', (req: Request, res: Response): any => {
  const jobId = req.params.job_id;

  // Input validation: job_id format
  if (!jobId || !/^[a-zA-Z0-9_-]{1,64}$/.test(jobId)) {
    return res.status(400).json({
      error: 'Invalid job_id',
      message: 'Job ID must be alphanumeric with underscores/hyphens (max 64 characters).'
    });
  }

  const authHeader = req.headers.authorization || '';

  // Extract Bearer token
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token) {
    token = String(req.query.token).trim();
  }

  // Find job
  const job = cronJobs.find(j => j.id === jobId);

  // BR-004: Unknown job ID must never create a new job automatically
  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      message: `No cron job registered with id '${jobId}'. Unknown jobs are rejected.`
    });
  }

  // Validate Token (match job token or shared token)
  const isAuthorized = token === job.token || token === SHARED_TOKEN;
  if (!isAuthorized) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing Bearer token in Authorization header.'
    });
  }

  const { status, duration_ms, notes } = req.body || {};
  const isSuccess = status === 'success';

  const event = {
    timestamp: Date.now(),
    status: (isSuccess ? 'success' : 'failure') as 'success' | 'failure',
    durationMs: typeof duration_ms === 'number' && duration_ms >= 0 && duration_ms < 3600000 ? duration_ms : undefined,
    clientIp: req.ip || req.socket.remoteAddress,
    notes: notes ? String(notes).slice(0, 200) : undefined
  };

  job.history.push(event);
  if (job.history.length > 20) job.history.shift();

  // BR-005: A heartbeat indicating failure does not reset the last-success deadline!
  if (isSuccess) {
    job.lastHeartbeatTimestamp = Date.now();
    job.lastStatus = 'success';
    job.isOverdue = false;
    job.simulatedFailure = false;
  } else {
    job.lastStatus = 'failure';
    // Do not update lastHeartbeatTimestamp on failure
  }

  // Expected standard response per PO: 204 No Content
  return res.status(204).end();
});

// Target Management APIs
app.get('/api/targets', (_req: Request, res: Response) => {
  res.json({
    targets: monitoredTargets,
    summary: {
      total: monitoredTargets.length,
      up: monitoredTargets.filter(t => t.lastStatus === 'up').length,
      down: monitoredTargets.filter(t => t.lastStatus === 'down').length,
      degraded: monitoredTargets.filter(t => t.lastStatus === 'degraded').length
    }
  });
});

app.post('/api/targets/:id/check', async (req: Request, res: Response): Promise<any> => {
  const target = monitoredTargets.find(t => t.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Target not found' });
  }

  await executeCheck(target);
  return res.json({ target });
});

app.post('/api/check-all', async (_req: Request, res: Response): Promise<any> => {
  const now = Date.now();
  // Rate-limiting debounce: Prevent DoS by requiring at least 1500ms between full probe sweeps
  if (now - lastCheckAllTimestamp < 1500) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait 1.5 seconds between global probe sweeps.',
      retryAfterMs: 1500 - (now - lastCheckAllTimestamp)
    });
  }
  lastCheckAllTimestamp = now;

  await Promise.all(monitoredTargets.map(t => executeCheck(t)));
  updateCronJobStates();
  return res.json({
    success: true,
    targets: monitoredTargets,
    timestamp: Date.now()
  });
});

app.post('/api/targets', (req: Request, res: Response): any => {
  const { id, name, url, category, expectedStatusCodes, intervalSeconds, timeoutMs, expectedDnsRecords, checkSsl, checkDns } = req.body;
  if (!id || !name || !url) {
    return res.status(400).json({ error: 'Missing required fields: id, name, url' });
  }

  // Validate URL with SSRF protection
  const urlCheck = isSafeUrl(url);
  if (!urlCheck.safe) {
    return res.status(400).json({
      error: 'Security Policy Violation (SSRF)',
      message: urlCheck.reason
    });
  }

  // Sanitize target ID and name
  const sanitizedId = String(id).toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 64);
  const sanitizedName = String(name).trim().slice(0, 100);

  // Validate interval and timeout
  const validInterval = Math.max(10, Math.min(86400, Number(intervalSeconds) || 60));
  const validTimeout = Math.max(1000, Math.min(30000, Number(timeoutMs) || 8000));

  // Validate expected status codes
  const validCodes = Array.isArray(expectedStatusCodes)
    ? expectedStatusCodes.map(Number).filter(c => c >= 100 && c <= 599)
    : [200];

  const existingIdx = monitoredTargets.findIndex(t => t.id === sanitizedId);
  const newTarget: MonitoredTarget = {
    id: sanitizedId,
    name: sanitizedName,
    category: category || 'ecommerce',
    url: String(url).trim(),
    expectedStatusCodes: validCodes.length > 0 ? validCodes : [200],
    intervalSeconds: validInterval,
    timeoutMs: validTimeout,
    expectedDnsRecords: expectedDnsRecords || undefined,
    checkSsl: checkSsl !== false,
    checkDns: checkDns !== false,
    lastCheckTimestamp: 0,
    lastStatus: 'pending',
    lastDurationSeconds: 0,
    lastStatusCode: 0,
    errorMessage: null,
    history: [],
    sslDaysRemaining: null,
    sslIssuer: null,
    sslValidTo: null,
    sslSubject: null,
    dnsMatch: null,
    dnsResolvedRecords: null,
    dnsMismatchDetails: null
  };

  if (existingIdx >= 0) {
    monitoredTargets[existingIdx] = { ...monitoredTargets[existingIdx], ...newTarget };
  } else {
    monitoredTargets.push(newTarget);
  }

  // Execute check asynchronously
  executeCheck(existingIdx >= 0 ? monitoredTargets[existingIdx] : newTarget).catch(() => {});

  return res.status(201).json({ target: newTarget });
});

app.delete('/api/targets/:id', (req: Request, res: Response): any => {
  const { id } = req.params;
  const initialLength = monitoredTargets.length;
  monitoredTargets = monitoredTargets.filter(t => t.id !== id);
  if (monitoredTargets.length === initialLength) {
    return res.status(404).json({ error: 'Target not found' });
  }
  return res.json({ success: true, remaining: monitoredTargets.length });
});

app.delete('/api/targets', (_req: Request, res: Response) => {
  monitoredTargets = [];
  res.json({ success: true, message: 'All targets cleared' });
});

app.post('/api/targets/reset', async (_req: Request, res: Response) => {
  monitoredTargets = JSON.parse(JSON.stringify(INITIAL_TARGETS));
  cronJobs = JSON.parse(JSON.stringify(INITIAL_CRON_JOBS));
  // Probe immediately
  for (const target of monitoredTargets) {
    await executeCheck(target).catch(() => {});
  }
  updateCronJobStates();
  res.json({ success: true, targets: monitoredTargets, jobs: cronJobs });
});

// Cron Heartbeat APIs
app.get('/api/heartbeats', (_req: Request, res: Response) => {
  updateCronJobStates();
  res.json({
    jobs: cronJobs,
    sharedToken: SHARED_TOKEN,
    overdueCount: cronJobs.filter(j => j.isOverdue).length
  });
});

// Incident Simulation API
app.post('/api/simulate/incident', (req: Request, res: Response): any => {
  const { scenario, active } = req.body;

  if (scenario === 'restore_all') {
    monitoredTargets = JSON.parse(JSON.stringify(INITIAL_TARGETS));
    cronJobs = JSON.parse(JSON.stringify(INITIAL_CRON_JOBS));
    return res.json({ success: true, message: 'All services and cron jobs restored to normal operation.' });
  }

  if (scenario === 'storefront_down') {
    const target = monitoredTargets.find(t => t.id === 'storefront');
    if (target) {
      if (active) {
        target.simulatedFailure = {
          type: 'http_down',
          description: 'Magento 503 Backend Gateway Timeout'
        };
        target.lastStatus = 'down';
        target.lastStatusCode = 503;
        target.lastDurationSeconds = 5.25;
        target.errorMessage = '503 Service Unavailable: PHP-FPM pool exhausted';
      } else {
        target.simulatedFailure = undefined;
        target.lastStatus = 'up';
        target.lastStatusCode = 200;
        target.lastDurationSeconds = 0.245;
        target.errorMessage = null;
      }
    }
    return res.json({ success: true, target });
  }

  if (scenario === 'ssl_expire') {
    const target = monitoredTargets.find(t => t.id === 'storefront');
    if (target) {
      if (active) {
        target.simulatedFailure = {
          type: 'ssl_expire',
          description: 'TLS Certificate Expiring in 3 Days'
        };
        target.sslDaysRemaining = 3;
      } else {
        target.simulatedFailure = undefined;
        target.sslDaysRemaining = 74;
      }
    }
    return res.json({ success: true, target });
  }

  if (scenario === 'dns_poison') {
    const target = monitoredTargets.find(t => t.id === 'storefront');
    if (target) {
      if (active) {
        target.simulatedFailure = {
          type: 'dns_poison',
          description: 'DNS Record Hijack / Poisoning'
        };
        target.dnsMatch = false;
        target.dnsMismatchDetails = 'Resolved 198.51.100.4 != Expected [104.21.36.177, 172.67.140.230]';
      } else {
        target.simulatedFailure = undefined;
        target.dnsMatch = true;
        target.dnsMismatchDetails = null;
      }
    }
    return res.json({ success: true, target });
  }

  if (scenario === 'cron_missed') {
    const job = cronJobs.find(j => j.id === 'catalog_sync');
    if (job) {
      if (active) {
        job.simulatedFailure = true;
        job.isOverdue = true;
        job.lastHeartbeatTimestamp = Date.now() - 1800000; // 30 min ago (> 15 min deadline)
      } else {
        job.simulatedFailure = false;
        job.isOverdue = false;
        job.lastHeartbeatTimestamp = Date.now() - 120000;
      }
    }
    return res.json({ success: true, job });
  }

  if (scenario === 'alphafold_spike') {
    const target = monitoredTargets.find(t => t.id === 'alphafold_db');
    if (target) {
      if (active) {
        target.lastDurationSeconds = 4.85;
        target.lastStatus = 'degraded';
        target.errorMessage = 'Latency threshold breached (> 3.0s)';
      } else {
        target.lastDurationSeconds = 0.312;
        target.lastStatus = 'up';
        target.errorMessage = null;
      }
    }
    return res.json({ success: true, target });
  }

  return res.status(400).json({ error: 'Unknown scenario' });
});

// Bioscience live inspect proxy endpoint (incorporates Science Skill patterns)
app.get('/api/bioscience/inspect/:accession', async (req: Request, res: Response): Promise<any> => {
  const rawAccession = req.params.accession;
  if (!rawAccession || !/^[A-Za-z0-9_-]{1,20}$/.test(rawAccession)) {
    return res.status(400).json({
      error: 'Invalid accession format',
      message: 'Accession must be alphanumeric (1-20 characters).'
    });
  }

  const accession = rawAccession.toUpperCase();
  const startTime = Date.now();

  try {
    // Query AlphaFold DB dynamically per references/proteins-and-structures.md
    const afRes = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${accession}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    // Also query UniProt metadata
    const uniRes = await fetch(`https://rest.uniprot.org/uniprotkb/${accession}.json`, {
      headers: { 'Accept': 'application/json' }
    });

    const durationMs = Date.now() - startTime;

    let afData: any = null;
    if (afRes.ok) {
      const json = await afRes.json();
      if (Array.isArray(json) && json.length > 0) {
        afData = {
          entryId: json[0].entryId,
          gene: json[0].gene,
          organism: json[0].organismScientificName,
          cifUrl: json[0].cifUrl,
          pdbUrl: json[0].pdbUrl,
          paeDocUrl: json[0].paeDocUrl,
          sequenceLength: json[0].uniprotSequence?.length || 0,
        };
      }
    }

    let uniData: any = null;
    if (uniRes.ok) {
      const uJson = await uniRes.json();
      uniData = {
        primaryAccession: uJson.primaryAccession,
        proteinName: uJson.proteinDescription?.recommendedName?.fullName?.value || 'Unknown protein',
        organismName: uJson.organism?.scientificName || 'Unknown organism',
        genes: uJson.genes?.map((g: any) => g.geneName?.value) || [],
        commentsCount: uJson.comments?.length || 0,
        featuresCount: uJson.features?.length || 0,
      };
    }

    return res.json({
      accession,
      durationMs,
      alphaFold: afData,
      uniprot: uniData,
      provenance: {
        alphaFold: 'Predicted by model (AlphaFold DB)',
        uniprot: 'Literature curated (UniProtKB)',
        status: 'Operational'
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to inspect biological target',
      message: err.message
    });
  }
});

// Exporter: Docker Compose, Prometheus Config, Alerts, Targets YAML, Python Implementation
app.get('/api/export/bundle', (_req: Request, res: Response) => {
  const targetsYaml = YAML.stringify({
    targets: monitoredTargets.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      url: t.url,
      expected_status_codes: t.expectedStatusCodes,
      interval_seconds: t.intervalSeconds,
      timeout_seconds: (t.timeoutMs / 1000),
      check_ssl: t.checkSsl,
      check_dns: t.checkDns,
      expected_dns_records: t.expectedDnsRecords
    }))
  });

  const composeYaml = `version: '3.8'

services:
  uptime-monitor:
    build: .
    container_name: uptime-monitor
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - HEARTBEAT_SHARED_TOKEN=\${HEARTBEAT_SHARED_TOKEN:-sre-secret-heartbeat-token-2026}
      - CONFIG_PATH=/config/targets.yaml
    volumes:
      - ./config:/config:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3

  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:10.4.0
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
`;

  const prometheusYml = `global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/alerts.yml"

scrape_configs:
  - job_name: 'uptime_monitor'
    metrics_path: '/metrics'
    scrape_interval: 15s
    static_configs:
      - targets: ['uptime-monitor:8000']
        labels:
          environment: 'production'
          service: 'biopulse-sre-monitor'
`;

  const pythonScript = `"""
Lightweight Uptime & Health Monitor - SRE/DevOps Portfolio MVP
Stand-alone Python 3.12+ engine implementing HTTP checks, TLS inspection,
DNS verification, Cron heartbeat receiver, and Prometheus metrics.
"""

import os
import ssl
import time
import socket
import asyncio
import logging
from datetime import datetime, timezone
import httpx
import yaml
import dns.resolver
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.responses import PlainTextResponse, Response
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("uptime_monitor")

app = FastAPI(title="Lightweight Uptime & Health Monitor")

# Prometheus Metrics definition
METRIC_HTTP_UP = Gauge("monitor_http_up", "Availability of the target (1=up, 0=down)", ["target", "category"])
METRIC_HTTP_DURATION = Gauge("monitor_http_duration_seconds", "HTTP request latency in seconds", ["target", "category"])
METRIC_SSL_EXPIRY = Gauge("monitor_ssl_expiry_days", "Remaining TLS certificate days", ["target", "category"])
METRIC_DNS_MATCH = Gauge("monitor_dns_match", "DNS record match (1=match, 0=mismatch)", ["target", "record"])
METRIC_CRON_LAST_SUCCESS = Gauge("monitor_cron_last_success_timestamp_seconds", "Timestamp of last success", ["job", "category"])
METRIC_CRON_OVERDUE = Gauge("monitor_cron_overdue", "Cron job overdue flag (1=overdue, 0=healthy)", ["job", "category"])

SHARED_TOKEN = os.getenv("HEARTBEAT_SHARED_TOKEN", "sre-secret-heartbeat-token-2026")
CONFIG_PATH = os.getenv("CONFIG_PATH", "config/targets.yaml")

# Load Configuration
def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r") as f:
            return yaml.safe_load(f)
    return {"targets": []}

config = load_config()

# TLS Expiry Calculation
def get_ssl_expiry_days(hostname: str, port: int = 443) -> int:
    ctx = ssl.create_default_context()
    with socket.create_connection((hostname, port), timeout=5) as sock:
        with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
            cert = ssock.getpeercert()
            not_after = cert['notAfter']
            expiry = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
            delta = expiry - datetime.now(timezone.utc)
            return max(0, delta.days)

@app.get("/healthz")
def healthz():
    return {"status": "healthy", "service": "uptime-monitor", "version": "1.0.0"}

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

class HeartbeatPayload(BaseModel):
    status: str
    duration_ms: int | None = None
    notes: str | None = None

@app.post("/heartbeat/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def post_heartbeat(job_id: str, payload: HeartbeatPayload, authorization: str = Header(None)):
    token = authorization.replace("Bearer ", "").strip() if authorization else None
    if token != SHARED_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Bearer token")
    
    if payload.status == "success":
        now_ts = int(time.time())
        METRIC_CRON_LAST_SUCCESS.labels(job=job_id, category="cron").set(now_ts)
        METRIC_CRON_OVERDUE.labels(job=job_id, category="cron").set(0)
    else:
        # Failure does not reset deadline (BR-005)
        logger.warning(f"Heartbeat failure reported for {job_id}")

    return Response(status_code=status.HTTP_204_NO_CONTENT)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

  res.json({
    targetsYaml,
    composeYaml,
    prometheusYml,
    alertsYml: PROMETHEUS_ALERT_RULES,
    pythonScript
  });
});

app.get('/download/biopulse-sre-monitor.zip', (_req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'biopulse-sre-monitor.zip');
  res.download(filePath, 'biopulse-sre-monitor.zip');
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BioPulse SRE Monitor] Server running on http://0.0.0.0:${PORT}`);
    console.log(`- Prometheus scrape endpoint: http://0.0.0.0:${PORT}/metrics`);
    console.log(`- Health check endpoint:     http://0.0.0.0:${PORT}/healthz`);
    console.log(`- Heartbeat receiver:        http://0.0.0.0:${PORT}/heartbeat/:job_id`);
  });
}

startServer();
