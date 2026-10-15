export type ServiceCategory = 'ecommerce' | 'bioscience' | 'infrastructure';

export type CheckStatus = 'up' | 'down' | 'degraded' | 'pending';

export interface DnsRecords {
  A?: string[];
  AAAA?: string[];
  CNAME?: string[];
  MX?: string[];
}

export interface MonitoredTarget {
  id: string;
  name: string;
  category: ServiceCategory;
  url: string;
  expectedStatusCodes: number[];
  intervalSeconds: number;
  timeoutMs: number;
  expectedDnsRecords?: DnsRecords;
  checkSsl: boolean;
  checkDns: boolean;
  
  // Runtime check states
  lastCheckTimestamp: number;
  lastStatus: CheckStatus;
  lastDurationSeconds: number;
  lastStatusCode: number;
  errorMessage: string | null;
  history: Array<{
    timestamp: number;
    durationSeconds: number;
    status: CheckStatus;
    statusCode: number;
  }>;
  
  // SSL state
  sslDaysRemaining: number | null;
  sslIssuer: string | null;
  sslValidTo: string | null;
  sslSubject: string | null;
  
  // DNS state
  dnsMatch: boolean | null;
  dnsResolvedRecords: DnsRecords | null;
  dnsMismatchDetails: string | null;
  
  // Incident simulation flag
  simulatedFailure?: {
    type: 'http_down' | 'ssl_expire' | 'dns_poison' | 'latency_spike';
    description: string;
  };
}

export interface CronHeartbeatEvent {
  timestamp: number;
  status: 'success' | 'failure';
  durationMs?: number;
  clientIp?: string;
  notes?: string;
}

export interface CronJob {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  expectedIntervalSeconds: number;
  deadlineSeconds: number;
  token: string;
  lastHeartbeatTimestamp: number | null;
  lastStatus: 'success' | 'failure' | 'pending';
  isOverdue: boolean;
  history: CronHeartbeatEvent[];
  simulatedFailure?: boolean;
}

export interface PrometheusAlert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'firing' | 'pending' | 'resolved';
  summary: string;
  description: string;
  labels: Record<string, string>;
  firedAt?: number;
}

export interface BioscienceServiceTest {
  id: string;
  name: string;
  accession: string;
  description: string;
  provenance: 'Experimentally determined' | 'Predicted by model' | 'Literature curated';
  dataUrl: string;
  lastResult?: {
    status: 'ok' | 'error';
    responseTimeMs: number;
    details: Record<string, any>;
  };
}
