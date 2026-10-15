import { MonitoredTarget, CronJob, PrometheusAlert } from '../types/monitor.js';

export const INITIAL_TARGETS: MonitoredTarget[] = [
  {
    id: 'github_api',
    name: 'GitHub REST API v3',
    category: 'ecommerce',
    url: 'https://api.github.com',
    expectedStatusCodes: [200],
    intervalSeconds: 30,
    timeoutMs: 6000,
    checkSsl: true,
    checkDns: true,
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
  },
  {
    id: 'cloudflare_dns',
    name: 'Cloudflare Public Edge Gateway',
    category: 'ecommerce',
    url: 'https://1.1.1.1',
    expectedStatusCodes: [200],
    intervalSeconds: 30,
    timeoutMs: 5000,
    checkSsl: true,
    checkDns: true,
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
  },
  {
    id: 'storefront',
    name: 'Magento Storefront Main',
    category: 'ecommerce',
    url: 'https://magento.softwaretestingboard.com/',
    expectedStatusCodes: [200],
    intervalSeconds: 60,
    timeoutMs: 8000,
    checkSsl: true,
    checkDns: true,
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
  },
  {
    id: 'checkout_endpoint',
    name: 'Checkout Gateway API',
    category: 'ecommerce',
    url: 'https://httpbin.org/status/200',
    expectedStatusCodes: [200],
    intervalSeconds: 60,
    timeoutMs: 5000,
    checkSsl: true,
    checkDns: true,
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
  },
  {
    id: 'alphafold_db',
    name: 'AlphaFold DB API (EMBL-EBI)',
    category: 'bioscience',
    url: 'https://alphafold.ebi.ac.uk/api/prediction/P04637',
    expectedStatusCodes: [200],
    intervalSeconds: 60,
    timeoutMs: 10000,
    checkSsl: true,
    checkDns: true,
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
  },
  {
    id: 'uniprot_api',
    name: 'UniProtKB REST Service',
    category: 'bioscience',
    url: 'https://rest.uniprot.org/uniprotkb/P04637.json',
    expectedStatusCodes: [200],
    intervalSeconds: 60,
    timeoutMs: 10000,
    checkSsl: true,
    checkDns: true,
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
  },
  {
    id: 'rcsb_pdb',
    name: 'RCSB Protein Data Bank Core API',
    category: 'bioscience',
    url: 'https://data.rcsb.org/rest/v1/core/entry/4hhb',
    expectedStatusCodes: [200],
    intervalSeconds: 60,
    timeoutMs: 8000,
    checkSsl: true,
    checkDns: true,
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
  },
  {
    id: 'ncbi_pubmed',
    name: 'NCBI E-utilities (PubMed)',
    category: 'bioscience',
    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/einfo.fcgi?retmode=json',
    expectedStatusCodes: [200],
    intervalSeconds: 60,
    timeoutMs: 8000,
    checkSsl: true,
    checkDns: true,
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
  }
];

export const INITIAL_CRON_JOBS: CronJob[] = [
  {
    id: 'catalog_sync',
    name: 'Magento Catalog & Inventory Sync',
    category: 'ecommerce',
    description: 'Syncs Magento 2 stock levels and product catalog updates to ERP every 10 minutes.',
    expectedIntervalSeconds: 600, // 10 min
    deadlineSeconds: 900, // 15 min deadline
    token: 'token_magento_cat_sync_9941',
    lastHeartbeatTimestamp: null,
    lastStatus: 'pending',
    isOverdue: false,
    history: []
  },
  {
    id: 'order_export',
    name: 'Order Fulfillment & Payment Export',
    category: 'ecommerce',
    description: 'Pushes completed customer orders to warehouse WMS and ERP payment reconciliation.',
    expectedIntervalSeconds: 300, // 5 min
    deadlineSeconds: 450, // 7.5 min deadline
    token: 'token_order_export_8820',
    lastHeartbeatTimestamp: null,
    lastStatus: 'pending',
    isOverdue: false,
    history: []
  },
  {
    id: 'indexer_workflow',
    name: 'Magento Fulltext Search Indexer',
    category: 'ecommerce',
    description: 'Rebuilds Elasticsearch product and category search index tables.',
    expectedIntervalSeconds: 1800, // 30 min
    deadlineSeconds: 2700, // 45 min
    token: 'token_indexer_search_3311',
    lastHeartbeatTimestamp: null,
    lastStatus: 'pending',
    isOverdue: false,
    history: []
  },
  {
    id: 'alphafold_batch_prediction',
    name: 'AlphaFold 3D Structure Queue Worker',
    category: 'bioscience',
    description: 'Processes candidate protein sequences against AlphaFold DB models and extracts pLDDT matrices.',
    expectedIntervalSeconds: 900, // 15 min
    deadlineSeconds: 1200, // 20 min
    token: 'token_alphafold_worker_7719',
    lastHeartbeatTimestamp: null,
    lastStatus: 'pending',
    isOverdue: false,
    history: []
  },
  {
    id: 'ncbi_blast_sync',
    name: 'NCBI Entrez & BLAST Sequence Pipeline',
    category: 'bioscience',
    description: 'Polls NCBI Entrez efetch and UniProt for newly published reviewed proteome sequences.',
    expectedIntervalSeconds: 3600, // 60 min
    deadlineSeconds: 5400, // 90 min
    token: 'token_ncbi_sync_5521',
    lastHeartbeatTimestamp: null,
    lastStatus: 'pending',
    isOverdue: false,
    history: []
  }
];

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
