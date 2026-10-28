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
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Multi-Model Academic Laboratory (Gemini vs Groq Llama)
              </h2>
              <p className="text-xs text-slate-500">
                Submits identical prompt and retrieved context simultaneously to compare reasoning, style, latency, and tokens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
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
              placeholder="Enter academic question to benchmark across Gemini and Groq Llama..."
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-2xl pl-4 pr-32 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>Benchmark</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-2xl">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Dispatching concurrent queries to Gemini and Groq...</p>
          <p className="text-xs text-slate-500 mt-0.5">Recording execution latency and response quality...</p>
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
              const isGemini = res.provider === 'gemini';
              return (
                <div
                  key={res.provider}
                  className="bg-white rounded-3xl border border-slate-200/90 flex flex-col justify-between shadow-sm overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {isGemini ? 'Google Gemini 3.8 Flash' : 'Groq Llama 3.3 Versatile'}
                      </span>
                      {res.success ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          <AlertCircle className="w-3.5 h-3.5" /> Notice
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-blue-600">
                      Model: {res.model}
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Latency: <strong className="text-slate-900">{res.latencyMs}ms</strong>
                      </span>
                      {res.usage?.totalTokens && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Tokens: <strong className="text-slate-900">{res.usage.totalTokens}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto font-sans">
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
