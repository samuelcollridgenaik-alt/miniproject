import React, { useState } from 'react';
import { DocumentMeta, ModelComparisonData } from '../types.js';
import { GitCompare, Clock, Zap, AlertCircle, CheckCircle2, Send } from 'lucide-react';

interface ComparisonViewProps {
  documents: DocumentMeta[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ documents }) => {
  const [question, setQuestion] = useState(
    'Compare paging and segmentation: which minimizes external fragmentation, and why?'
  );
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<ModelComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunComparison = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/models/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          documentIdFilter: selectedDocId || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setComparison(data.data);
    } catch (err: any) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Config Card */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-zinc-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Model AI Comparison Arena
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Submits identical academic prompts simultaneously across Google Gemini models (Deep Reasoning vs Instant Speed) to compare latency, tokens, and explanations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-medium"
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
            className="relative flex items-center"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter academic question to benchmark across model architectures..."
              className="w-full bg-slate-50 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl pl-4 pr-32 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-zinc-700 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-300 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="p-12 text-center bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-xs">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Dispatching concurrent requests to Gemini models...</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Recording execution latency and synthesis differences...</p>
        </div>
      )}

      {/* Comparison Columns */}
      {comparison && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 flex items-center justify-between">
            <span>
              Retrieved Context: <strong className="text-slate-900">{comparison.contextSummary}</strong>
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Request ID: {comparison.requestId}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparison.results.map((res) => {
              const providerTitle = res.provider === 'gemini'
                ? 'Gemini 3.8 Flash (Reasoning Tier)'
                : res.provider === 'gemini-lite'
                ? 'Gemini 3.1 Flash-Lite (Speed Tier)'
                : 'Groq Llama 3.3 Versatile';

              return (
                <div
                  key={res.provider}
                  className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-zinc-800 flex flex-col justify-between shadow-xs overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {providerTitle}
                      </span>
                      {res.success ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Unconfigured
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                      Model: {res.model}
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Latency: <strong className="text-slate-900 dark:text-white">{res.latencyMs}ms</strong>
                      </span>
                      {res.usage?.totalTokens && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Tokens: <strong className="text-slate-900 dark:text-white">{res.usage.totalTokens}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto font-sans">
                    {res.response}
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
