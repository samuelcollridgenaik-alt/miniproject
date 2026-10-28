import React, { useState } from 'react';
import { DocumentMeta, GroundedAnswerData } from '../types.js';
import { Send, BookOpen, AlertCircle, CheckCircle2, FileText, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

interface TutorViewProps {
  documents: DocumentMeta[];
  onSeedSample: () => void;
  onNavigateToDocuments?: () => void;
}

export const TutorView: React.FC<TutorViewProps> = ({
  documents,
  onSeedSample,
  onNavigateToDocuments,
}) => {
  const [question, setQuestion] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<GroundedAnswerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQuestions = [
    'What is the difference between paging and segmentation in memory management?',
    'Explain the ACID properties of database transactions with examples.',
    'How does the Raft consensus algorithm handle leader election?',
    'What causes external fragmentation and how can compaction resolve it?',
  ];

  const handleAsk = async (queryToAsk?: string) => {
    const q = queryToAsk || question;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          documentIdFilter: selectedDocId || undefined,
          preferredProvider: 'gemini',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get grounded answer');
      }

      setAnswer(data.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during retrieval');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google NotebookLM Style Prompt Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Academic Tutor & Grounded Q&A
              </h2>
              <p className="text-xs text-slate-500">
                Powered by Google Gemini 3.8 Flash • Strictly citations-grounded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Source Document:</label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="">All Uploaded Course Notes</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({doc.fileType.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Guided banner if no documents uploaded */}
        {documents.length === 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
            <div>
              <span className="font-semibold text-blue-950">Quick Start for Evaluation:</span>{' '}
              Load standard MCA Operating Systems & Distributed Architecture notes to immediately test grounded Q&A with real citations.
            </div>
            <button
              onClick={onSeedSample}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-xs whitespace-nowrap"
            >
              Load Sample Notes
            </button>
          </div>
        )}

        {/* Query Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask an academic question (e.g. 'Explain the ACID properties' or 'Contrast paging vs segmentation')..."
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
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>Ask Gemini</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick sample prompt chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" /> Syllabus Prompts:
          </span>
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuestion(sq);
                handleAsk(sq);
              }}
              className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 border border-slate-200 rounded-full px-3 py-1 transition"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Retrieval Notice</p>
            <p className="text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Answer Output (Google Doc Style) */}
      {answer && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {answer.isSufficientlyGrounded ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Grounded ({Math.round(answer.groundingConfidence * 100)}% Confidence)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Insufficient Context in Uploaded Materials
                </span>
              )}

              <span className="text-xs text-slate-500">
                Model: <strong className="text-slate-800">{answer.model}</strong>
              </span>
              <span className="text-xs text-slate-500">
                Latency: <strong className="text-slate-800">{answer.latencyMs}ms</strong>
              </span>
            </div>

            <div className="text-xs text-slate-500">
              Retrieved Chunks: <strong className="text-blue-600 font-semibold">{answer.retrievedChunksCount}</strong>
            </div>
          </div>

          {/* Answer Body */}
          <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {answer.answer}
          </div>

          {/* Verified Citations Section */}
          {answer.citations.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Verified Citations & Excerpt Evidence ({answer.citations.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {answer.citations.map((cite, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span className="flex items-center gap-1.5 text-blue-700">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        [Doc: "{cite.source}", {cite.pageOrSlide ? `Page/Slide ${cite.pageOrSlide}` : 'Section'}]
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full">
                        {(cite.relevanceScore * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] leading-relaxed">
                      "{cite.quoteSnippet}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
