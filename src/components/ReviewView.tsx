import React, { useState } from 'react';
import { DocumentMeta, ContentAuditData } from '../types.js';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Search, Sparkles } from 'lucide-react';

interface ReviewViewProps {
  documents: DocumentMeta[];
}

export const ReviewView: React.FC<ReviewViewProps> = ({ documents }) => {
  const [contentType, setContentType] = useState<'explanation' | 'quiz_question' | 'summary'>('explanation');
  const [contentToAudit, setContentToAudit] = useState(
    'Paging completely prevents external fragmentation because memory is allocated in fixed-size page frames. However, internal fragmentation can still occur in the final allocated page.'
  );
  const [sourceContext, setSourceContext] = useState(
    'Paging divides memory into fixed-sized blocks called pages and frames, avoiding external fragmentation. However, it can suffer from internal fragmentation when the last frame allocated to a process is not completely filled.'
  );
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<ContentAuditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async () => {
    if (!contentToAudit.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/review/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          originalContent: contentToAudit,
          sourceContext,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setAuditResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Audit execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Academic Fact-Check & Verification Auditor
              </h2>
              <p className="text-xs text-slate-500">
                Independent AI verification layer to detect hallucinations, verify answer keys, and flag unsupported claims.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Content Type:</span>
            <select
              value={contentType}
              onChange={(e: any) => setContentType(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="explanation">Academic Explanation</option>
              <option value="quiz_question">Assessment Quiz Item</option>
              <option value="summary">Summary Passage</option>
            </select>
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Draft / Generated Content to Audit
            </label>
            <textarea
              rows={4}
              value={contentToAudit}
              onChange={(e) => setContentToAudit(e.target.value)}
              placeholder="Paste generated response, summary, or question to audit..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ground Truth / Authentic Reference Excerpts
            </label>
            <textarea
              rows={4}
              value={sourceContext}
              onChange={(e) => setSourceContext(e.target.value)}
              placeholder="Paste supporting textbook excerpt or course notes to verify against..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleRunAudit}
            disabled={loading || !contentToAudit.trim()}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-full flex items-center gap-2 transition shadow-xs"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Auditing Content...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Run Fact-Check Audit</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-2xl">
            {error}
          </div>
        )}
      </div>

      {/* AUDIT REPORT */}
      {auditResult && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Verdict:</span>
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  auditResult.verdict === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : auditResult.verdict === 'FLAGGED'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {auditResult.verdict}
              </span>

              <span className="text-xs text-slate-600 font-medium ml-2">
                Factual Consistency Score: <strong className="text-slate-900 font-bold">{auditResult.consistencyScore} / 100</strong>
              </span>
            </div>

            <div className="text-xs text-slate-500">
              Auditor: <strong className="text-slate-800">{auditResult.auditorModel}</strong> • Latency: <strong className="text-slate-800">{auditResult.latencyMs}ms</strong>
            </div>
          </div>

          {/* Audit findings grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Unsupported Claims Detected ({auditResult.unsupportedClaims.length})
              </h4>
              {auditResult.unsupportedClaims.length === 0 ? (
                <p className="text-xs text-emerald-700 italic font-medium">No unsupported claims detected.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {auditResult.unsupportedClaims.map((claim, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{claim}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Contradictions / Ambiguities ({auditResult.factualDiscrepancies.length})
              </h4>
              {auditResult.factualDiscrepancies.length === 0 ? (
                <p className="text-xs text-emerald-700 italic font-medium">No direct factual contradictions found.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {auditResult.factualDiscrepancies.map((disc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{disc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {auditResult.recommendations.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Auditor Recommendations
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {auditResult.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
