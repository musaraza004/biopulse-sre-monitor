import { MonitoredTarget, CronJob, PrometheusAlert } from '../types/monitor.js';

export const INITIAL_TARGETS: MonitoredTarget[] = [];

export const INITIAL_CRON_JOBS: CronJob[] = [];

export const PROMETHEUS_ALERT_RULES = `groups:
  - name: uptime_monitor_alerts
    rules:
      - alert: WebsiteDown
        expr: monitor_http_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Target {{ $labels.target }} is DOWN"
          description: "HTTP probe failed or timed out for target {{ $labels.target }} (category: {{ $labels.category }})."

      - alert: HighHttpLatency
        expr: monitor_http_duration_seconds > 2.0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High HTTP latency on {{ $labels.target }}"
          description: "Target {{ $labels.target }} p95 response time is {{ $value }}s (> 2.0s)."

      - alert: SslCertificateExpiringSoon
        expr: monitor_ssl_expiry_days < 14 and monitor_ssl_expiry_days > 0
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "TLS Certificate for {{ $labels.target }} expires in {{ $value }} days"
          description: "Renew SSL certificate immediately before service disruption."

      - alert: SslCertificateExpiring30Days
        expr: monitor_ssl_expiry_days < 30 and monitor_ssl_expiry_days >= 14
        for: 6h
        labels:
          severity: warning
        annotations:
          summary: "TLS Certificate for {{ $labels.target }} expires in {{ $value }} days"
          description: "Plan certificate renewal for {{ $labels.target }}."

      - alert: DnsRecordMismatch
        expr: monitor_dns_match == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "DNS record mismatch on {{ $labels.target }}"
          description: "Resolved DNS records do not match the expected records in targets.yaml."

      - alert: CronHeartbeatMissed
        expr: monitor_cron_overdue == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Scheduled job {{ $labels.job }} is OVERDUE"
          description: "Job {{ $labels.job }} has missed its execution deadline. Check background worker logs."
`;
