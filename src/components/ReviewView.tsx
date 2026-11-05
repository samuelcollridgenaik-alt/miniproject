import { StatusMessage } from "./ui/Primitives.js";
import { PageHeading } from "./ui/Primitives.js";
import React, { useState } from "react";
import { DocumentMeta, ContentAuditData } from "../types.js";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
} from "lucide-react";

interface ReviewViewProps {
  documents: DocumentMeta[];
}

export const ReviewView: React.FC<ReviewViewProps> = ({ documents }) => {
  const [contentType, setContentType] = useState<
    "explanation" | "quiz_question" | "summary"
  >("explanation");
  const [contentToAudit, setContentToAudit] = useState(
    "Paging completely prevents external fragmentation because memory is allocated in fixed-size page frames. However, internal fragmentation can still occur in the final allocated page.",
  );
  const [sourceContext, setSourceContext] = useState(
    "Paging divides memory into fixed-sized blocks called pages and frames, avoiding external fragmentation. However, it can suffer from internal fragmentation when the last frame allocated to a process is not completely filled.",
  );
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<ContentAuditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async () => {
    if (!contentToAudit.trim() || !sourceContext.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/review/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setError(err.message || "Audit execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page">
      {/* Top Banner */}
      <div className="bg-surface rounded-xl border border-default p-6 ">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeading
            icon={ShieldCheck}
            title={<> Academic Fact-Check & Verification Auditor </>}
            description={
              <>
                {" "}
                Compare a draft against supplied reference text. Automated
                findings require human review.{" "}
              </>
            }
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">
              Content Type:
            </span>
            <select
              aria-label="Content type"
              value={contentType}
              onChange={(e: any) => setContentType(e.target.value)}
              className="ui-field bg-subtle border border-default text-xs text-primary rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
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
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Draft / Generated Content to Audit
            </label>
            <textarea
              aria-label="Draft / Generated Content to Audit"
              rows={4}
              value={contentToAudit}
              onChange={(e) => setContentToAudit(e.target.value)}
              placeholder="Paste generated response, summary, or question to audit..."
              className="ui-field w-full bg-subtle border border-default rounded-2xl p-3.5 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">
              Ground Truth / Authentic Reference Excerpts
            </label>
            <textarea
              aria-label="Ground Truth / Authentic Reference Excerpts"
              rows={4}
              value={sourceContext}
              onChange={(e) => setSourceContext(e.target.value)}
              placeholder="Paste supporting textbook excerpt or course notes to verify against..."
              className="ui-field w-full bg-subtle border border-default rounded-2xl p-3.5 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-accent"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleRunAudit}
            disabled={
              loading || !contentToAudit.trim() || !sourceContext.trim()
            }
            className="ui-control px-5 py-2.5 bg-accent-solid hover:bg-accent-hover disabled:bg-elevated text-on-accent font-semibold text-xs rounded-full flex items-center gap-2 transition"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-default border-t-transparent rounded-full animate-spin" />
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
          <div
            role="alert"
            className="mt-3 p-3 bg-danger-soft border border-danger text-xs text-danger rounded-2xl"
          >
            {error}
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        A PASS is an automated assessment of the supplied excerpts, not proof of
        factual accuracy. Check source quality and completeness.
      </p>
      {auditResult?.isAssessmentAvailable === false && (
        <StatusMessage tone="error">
          Audit unavailable. No validated model assessment was returned.
          Configure a live provider or retry; no score or PASS verdict has been
          assigned.
        </StatusMessage>
      )}
      {/* AUDIT REPORT */}
      {auditResult && auditResult.isAssessmentAvailable !== false && (
        <div className="bg-surface rounded-xl border border-default p-8  space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-default">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted font-medium">Verdict:</span>
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  auditResult.verdict === "PASS"
                    ? "bg-success-soft text-success border border-success"
                    : auditResult.verdict === "FLAGGED"
                      ? "bg-warning-soft text-warning border border-warning"
                      : "bg-danger-soft text-danger border border-danger"
                }`}
              >
                {auditResult.verdict}
              </span>

              <span className="text-xs text-secondary font-medium ml-2">
                Reported consistency score:{" "}
                <strong className="text-primary font-bold">
                  {auditResult.consistencyScore} / 100
                </strong>
              </span>
            </div>

            <div className="text-xs text-muted">
              Auditor:{" "}
              <strong className="text-primary">
                {auditResult.auditorModel}
              </strong>{" "}
              • Latency:{" "}
              <strong className="text-primary">
                {auditResult.latencyMs}ms
              </strong>
            </div>
          </div>

          {/* Audit findings grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-subtle border border-default rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-danger mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Unsupported Claims Detected
                ({auditResult.unsupportedClaims.length})
              </h4>
              {auditResult.unsupportedClaims.length === 0 ? (
                <p className="text-xs text-success italic font-medium">
                  No unsupported claims flagged by this check.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs text-secondary">
                  {auditResult.unsupportedClaims.map((claim, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-danger font-bold">•</span>
                      <span>{claim}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-subtle border border-default rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warning mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Contradictions /
                Ambiguities ({auditResult.factualDiscrepancies.length})
              </h4>
              {auditResult.factualDiscrepancies.length === 0 ? (
                <p className="text-xs text-success italic font-medium">
                  No direct contradictions flagged by this check.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs text-secondary">
                  {auditResult.factualDiscrepancies.map((disc, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-warning font-bold">•</span>
                      <span>{disc}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {auditResult.recommendations.length > 0 && (
            <div className="bg-subtle border border-default rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">
                Auditor Recommendations
              </h4>
              <ul className="space-y-1.5 text-xs text-secondary">
                {auditResult.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
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
