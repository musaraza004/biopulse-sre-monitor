import React, { useState } from 'react';
import { CronJob } from '../types/monitor.js';
import { 
  HeartHandshake, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Copy, 
  Check, 
  Terminal, 
  History,
  Info
} from 'lucide-react';

interface HeartbeatManagerProps {
  cronJobs: CronJob[];
  sharedToken: string;
  isDarkMode: boolean;
  onSendHeartbeat: (jobId: string, status: 'success' | 'failure', token: string, durationMs?: number, notes?: string) => Promise<void>;
}

export const HeartbeatManager: React.FC<HeartbeatManagerProps> = ({
  cronJobs,
  sharedToken,
  isDarkMode,
  onSendHeartbeat
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(cronJobs[0]?.id || 'catalog_sync');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessNotice, setSendSuccessNotice] = useState<string | null>(null);

  // Trigger form state
  const [triggerStatus, setTriggerStatus] = useState<'success' | 'failure'>('success');
  const [triggerDuration, setTriggerDuration] = useState('850');
  const [triggerNotes, setTriggerNotes] = useState('Scheduled worker check-in');

  const selectedJob = cronJobs.find(j => j.id === selectedJobId) || cronJobs[0];

  const curlSnippet = selectedJob 
    ? `curl -X POST "http://localhost:3000/heartbeat/${selectedJob.id}" \\
  -H "Authorization: Bearer ${selectedJob.token}" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "success", "duration_ms": 720, "notes": "Batch completed"}'`
    : '';

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsSending(true);
    try {
      await onSendHeartbeat(
        selectedJob.id,
        triggerStatus,
        selectedJob.token,
        parseInt(triggerDuration, 10) || undefined,
        triggerNotes
      );
      setSendSuccessNotice(`Live heartbeat (${triggerStatus}) delivered to /heartbeat/${selectedJob.id}!`);
      setTimeout(() => setSendSuccessNotice(null), 3500);
    } catch (err: any) {
      setSendSuccessNotice(`Error: ${err?.message || 'Failed to dispatch heartbeat'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Smooth 3XL Curvature */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-sm ${
        isDarkMode ? 'bg-[#181b20] border-zinc-800/80' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <HeartHandshake className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cron Job Heartbeat Tracking</h1>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'} mt-0.5`}>
              Authenticated API: <code className="font-mono text-indigo-400">POST /heartbeat/:job_id</code>. Missing execution deadlines triggers Prometheus <code className="font-mono text-rose-400">monitor_cron_overdue = 1</code>.
            </p>
          </div>
        </div>
      </div>

      {sendSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{sendSuccessNotice}</span>
          </div>
          <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
            HTTP 204 No Content
          </span>
        </div>
      )}

      {/* Main Grid: Job Cards & Live Heartbeat Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cron Job List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold px-1">
            Registered Scheduled Jobs ({cronJobs.length})
          </div>

          <div className="space-y-3.5">
            {cronJobs.map(job => {
              const isSelected = job.id === selectedJob?.id;
              const elapsedSec = job.lastHeartbeatTimestamp 
                ? Math.floor((Date.now() - job.lastHeartbeatTimestamp) / 1000)
                : null;
              const deadlineSec = job.deadlineSeconds;
              const pctDeadline = elapsedSec !== null ? Math.min(100, Math.floor((elapsedSec / deadlineSec) * 100)) : 0;

              return (
                <div
                  key={`cron_job_${job.id}`}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? isDarkMode ? 'bg-[#212631] border-indigo-500/60 shadow-lg' : 'bg-indigo-50/80 border-indigo-600 shadow-md'
                      : isDarkMode ? 'bg-[#181b20] border-zinc-800/80 hover:bg-zinc-800/40' : 'bg-white border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          job.isOverdue 
                            ? 'bg-rose-500 animate-ping' 
                            : elapsedSec !== null 
                            ? 'bg-emerald-500' 
                            : 'bg-zinc-400'
                        }`} />
                        <h3 className={`font-bold text-sm ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>{job.name}</h3>
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-medium ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {job.category}
                        </span>
                      </div>
                      <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'} mt-1.5`}>
                        {job.description}
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold shrink-0 ${
                      job.isOverdue 
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                        : elapsedSec !== null
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {job.isOverdue ? 'OVERDUE' : elapsedSec !== null ? 'HEALTHY' : 'PENDING'}
                    </span>
                  </div>

                  <div className={`grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t text-xs font-mono ${
                    isDarkMode ? 'border-zinc-800/60' : 'border-slate-200'
                  }`}>
                    <div>
                      <span className={`text-[10px] uppercase block ${isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}`}>Interval</span>
                      <span className={`font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-slate-900'}`}>{Math.floor(job.expectedIntervalSeconds / 60)} min</span>
                    </div>
                    <div>
                      <span className={`text-[10px] uppercase block ${isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}`}>Deadline SLA</span>
                      <span className={`font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-slate-900'}`}>{Math.floor(job.deadlineSeconds / 60)} min</span>
                    </div>
                    <div>
                      <span className={`text-[10px] uppercase block ${isDarkMode ? 'text-zinc-500' : 'text-slate-500 font-semibold'}`}>Last Seen</span>
                      <span className={`font-semibold ${job.isOverdue ? 'text-rose-500' : isDarkMode ? 'text-zinc-300' : 'text-slate-900'}`}>
                        {elapsedSec !== null ? `${Math.floor(elapsedSec / 60)}m ago` : 'Awaiting check-in'}
                      </span>
                    </div>
                  </div>

                  {/* Deadline Progress */}
                  <div className="mt-3.5">
                    <div className={`flex justify-between text-[10px] font-mono mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                      <span>Time until deadline expiry</span>
                      <span className="font-semibold">{pctDeadline}% elapsed</span>
                    </div>
                    <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-zinc-800/60' : 'bg-slate-200'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          job.isOverdue 
                            ? 'bg-rose-500' 
                            : pctDeadline > 75 
                            ? 'bg-amber-500' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${pctDeadline}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Heartbeat Trigger Sandbox & cURL instructions (5 cols) */}
        {selectedJob && (
          <div className="lg:col-span-5 space-y-4">
            {/* Interactive Dispatch Sandbox with Smooth 3XL Curvature */}
            {/* Interactive Dispatch Sandbox with Smooth 3XL Curvature */}
            <form onSubmit={handleTrigger} className={`p-6 rounded-3xl border ${
              isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
            } space-y-4 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                  <Send className="w-4 h-4 text-indigo-500" />
                  <span>Live Heartbeat Dispatcher</span>
                </div>
                <span className={`text-[10px] font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>id: {selectedJob.id}</span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className={`block font-medium mb-1.5 ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>Check-in Status</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTriggerStatus('success')}
                      className={`py-2 px-3 rounded-full font-medium text-xs flex items-center justify-center gap-1.5 border transition-all duration-200 ${
                        triggerStatus === 'success'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-bold shadow-sm'
                          : isDarkMode ? 'bg-zinc-900/40 text-zinc-400 border-zinc-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Success
                    </button>
                    <button
                      type="button"
                      onClick={() => setTriggerStatus('failure')}
                      className={`py-2 px-3 rounded-full font-medium text-xs flex items-center justify-center gap-1.5 border transition-all duration-200 ${
                        triggerStatus === 'failure'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 font-bold shadow-sm'
                          : isDarkMode ? 'bg-zinc-900/40 text-zinc-400 border-zinc-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <XCircle className="w-4 h-4" /> Failure
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block font-medium mb-1.5 ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>Execution Duration (ms)</label>
                  <input
                    type="number"
                    value={triggerDuration}
                    onChange={e => setTriggerDuration(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border font-mono text-xs focus:outline-none transition-all ${
                      isDarkMode ? 'bg-[#14161a] border-zinc-700 text-zinc-100 focus:border-indigo-400' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-medium mb-1.5 ${isDarkMode ? 'text-zinc-200' : 'text-slate-800 font-semibold'}`}>Job Notes / Audit Payload</label>
                  <input
                    type="text"
                    value={triggerNotes}
                    onChange={e => setTriggerNotes(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none transition-all ${
                      isDarkMode ? 'bg-[#14161a] border-zinc-700 text-zinc-100 focus:border-indigo-400' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                    }`}
                  />
                </div>

                <div className={`p-3 rounded-2xl border text-[11px] font-mono flex items-center justify-between ${
                  isDarkMode ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <span>Bearer Token:</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-zinc-200' : 'text-slate-900'}`}>{selectedJob.token}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
                  <span>{isSending ? 'Delivering POST...' : `Send Heartbeat to /heartbeat/${selectedJob.id}`}</span>
                </button>
              </div>
            </form>

            {/* Production cURL Snippet */}
            <div className={`p-6 rounded-3xl border ${
              isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
            } space-y-3 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 text-xs font-mono font-bold ${
                  isDarkMode ? 'text-zinc-300' : 'text-slate-800'
                }`}>
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <span>Production Cron cURL Snippet</span>
                </div>
                <button
                  onClick={handleCopyCurl}
                  className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-mono transition-colors font-semibold"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-2xl bg-zinc-950 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed border border-zinc-800/80">
                {curlSnippet}
              </pre>
            </div>

            {/* Job Execution History */}
            <div className={`p-6 rounded-3xl border ${
              isDarkMode ? 'bg-[#181b20] border-zinc-800/80 text-zinc-100' : 'bg-white border-slate-200/90 text-slate-900'
            } space-y-3 shadow-sm`}>
              <div className={`flex items-center gap-2 text-xs font-bold ${
                isDarkMode ? 'text-zinc-300' : 'text-slate-800'
              }`}>
                <History className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`} />
                <span>Heartbeat Check-In Log ({selectedJob.history.length})</span>
              </div>

              {selectedJob.history.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedJob.history.slice().reverse().map((ev, i) => (
                    <div key={`ev_${i}`} className={`flex items-center justify-between text-[11px] font-mono p-2.5 rounded-2xl border ${
                      isDarkMode ? 'bg-zinc-900/30 border-zinc-800/40' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {ev.status === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span className={`truncate max-w-[150px] font-medium ${isDarkMode ? 'text-zinc-200' : 'text-slate-900'}`}>{ev.notes || 'Routine check-in'}</span>
                      </div>
                      <div className={isDarkMode ? 'text-zinc-500' : 'text-slate-500'}>
                        {ev.durationMs ? `${ev.durationMs}ms · ` : ''}
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-4 rounded-2xl border text-xs text-center font-mono flex items-center justify-center gap-2 ${
                  isDarkMode ? 'bg-zinc-900/30 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <Info className="w-4 h-4 text-indigo-500" />
                  <span>No heartbeats received yet. Send a test POST above to record the first event.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
