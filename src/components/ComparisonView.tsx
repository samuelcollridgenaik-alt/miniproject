import { LoadingState, PageHeading } from "./ui/Primitives.js";
import React, { useState } from "react";
import { DocumentMeta, ModelComparisonData } from "../types.js";
import {
  GitCompare,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react";

interface ComparisonViewProps {
  documents: DocumentMeta[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  documents,
}) => {
  const [question, setQuestion] = useState(
    "Compare paging and segmentation: which minimizes external fragmentation, and why?",
  );
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<ModelComparisonData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleRunComparison = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    const customGeminiKey = localStorage.getItem("cognify_gemini_key") || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (customGeminiKey) headers["x-gemini-key"] = customGeminiKey;

    try {
      const res = await fetch("/api/models/compare", {
        method: "POST",
        headers,
        body: JSON.stringify({
          question,
          documentIdFilter: selectedDocId || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setComparison(data.data);
    } catch (err: any) {
      setError(err.message || "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page">
      {/* Top Config Card */}
      <div className="bg-surface rounded-2xl border border-default p-6 ">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeading
            icon={GitCompare}
            title={<> Multi-Model AI Comparison Arena </>}
            description={
              <>
                {" "}
                Compare the same academic question across the configured
                providers. Model identity and request results are reported by
                the backend.{" "}
              </>
            }
          />

          <div className="flex items-center gap-2">
            <select
              aria-label="Course context"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="ui-field bg-subtle border border-default text-xs text-primary rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-medium"
            >
              <option value="">All Uploaded Documents</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunComparison();
            }}
            className="ui-inline-form"
          >
            <input
              aria-label="Comparison question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter academic question to benchmark across model architectures..."
              className="ui-field w-full bg-subtle hover:bg-elevated focus:bg-surface focus:bg-subtle border border-default rounded-xl px-4 py-3 text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-accent transition shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="ui-control px-4 py-2 bg-accent-solid hover:bg-accent-hover disabled:bg-elevated text-on-accent font-medium text-xs rounded-lg flex items-center gap-1.5 transition"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-default border-t-transparent rounded-full animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <span>Compare Models</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 p-3 bg-danger-soft border border-danger text-xs text-danger rounded-xl"
          >
            {error}
          </div>
        )}
      </div>

      {loading && (
        <LoadingState label="Comparing configured model responses…" />
      )}

      {/* Comparison Columns */}
      {comparison && (
        <div className="space-y-4">
          <div className="bg-subtle border border-default rounded-2xl p-3.5 text-xs text-secondary text-muted flex items-center justify-between">
            <span>
              Retrieved Context:{" "}
              <strong className="text-primary">
                {comparison.contextSummary}
              </strong>
            </span>
            <span className="font-mono text-[11px] text-muted">
              Request ID: {comparison.requestId}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparison.results.map((res) => {
              const providerTitle =
                res.provider === "cognify-curriculum"
                  ? "Built-in syllabus engine"
                  : res.provider === "gemini"
                    ? "Google Gemini"
                    : res.provider === "gemini-lite"
                      ? "Gemini Lite"
                      : "Groq";

              return (
                <div
                  key={res.provider}
                  className="bg-surface rounded-2xl border border-default flex flex-col justify-between  overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-default bg-subtle">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        {providerTitle}
                      </span>
                      {res.success ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-warning">
                          <AlertCircle className="w-3.5 h-3.5" /> Request failed
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-accent">
                      Model: {res.model}
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted" />
                        Latency:{" "}
                        <strong className="text-primary">
                          {res.success ? `${res.latencyMs} ms` : "Not measured"}
                        </strong>
                      </span>
                      {res.usage?.totalTokens && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-warning" />
                          Tokens:{" "}
                          <strong className="text-primary">
                            {res.usage.totalTokens}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 text-xs text-primary whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto font-sans">
                    {res.success
                      ? res.response
                      : res.error ||
                        "No response was returned. Check provider settings and retry."}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
