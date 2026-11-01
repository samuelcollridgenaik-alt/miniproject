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
  const [tutorMode, setTutorMode] = useState<'kid' | 'scholar'>('scholar');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<GroundedAnswerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQuestions = [
    { title: 'Paging vs Segmentation', prompt: 'What is the difference between paging and segmentation in memory management?', icon: '🍕' },
    { title: 'ACID Properties', prompt: 'Explain the ACID properties of database transactions with simple examples.', icon: '🏦' },
    { title: 'Raft Consensus', prompt: 'How does the Raft consensus algorithm handle leader election like a classroom vote?', icon: '🤝' },
    { title: 'Cache & Memory', prompt: 'How does CPU cache memory speed up programs like a kitchen pantry?', icon: '⚡' },
  ];

  const handleAsk = async (queryToAsk?: string) => {
    const rawQ = queryToAsk || question;
    if (!rawQ.trim()) return;

    setLoading(true);
    setError(null);

    const formattedQuestion = tutorMode === 'kid'
      ? `${rawQ}\n\n[Persona: Explain this simply and cheerfully with everyday analogies that even a 10-year-old or beginner student can instantly understand! Break down tough terms into friendly concepts.]`
      : rawQ;

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formattedQuestion,
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
      {/* Cognify Tutor Card */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-zinc-800 p-6 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cognify Academic Tutor
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Powered by Google Gemini AI · Grounded in verified course citations
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Persona Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setTutorMode('kid')}
                className={`px-3 py-1 font-medium rounded-md transition ${
                  tutorMode === 'kid'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                🧸 Simple & Fun
              </button>
              <button
                type="button"
                onClick={() => setTutorMode('scholar')}
                className={`px-3 py-1 font-medium rounded-md transition ${
                  tutorMode === 'scholar'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                🎓 Academic Pro
              </button>
            </div>

            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
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
          <div className="mb-4 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950 dark:text-indigo-200">
            <div>
              <span className="font-semibold text-indigo-950 dark:text-white">Quick Start:</span>{' '}
              Load standard MCA Operating Systems & Distributed Architecture notes to test grounded Q&A with real citations.
            </div>
            <button
              onClick={onSeedSample}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition shadow-xs whitespace-nowrap"
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
            placeholder={
              tutorMode === 'kid'
                ? "Ask anything! (e.g. 'Explain how computer memory works like a pizza box' or 'Why do transactions need ACID?')..."
                : "Ask an academic question (e.g. 'Explain ACID properties' or 'Contrast paging vs segmentation')..."
            }
            className="w-full bg-slate-50 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl pl-4 pr-32 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-zinc-700 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition shadow-xs"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Ask Cognify</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick sample prompt chips with icons */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400 dark:text-zinc-500" /> Quick Starters:
          </span>
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuestion(sq.prompt);
                handleAsk(sq.prompt);
              }}
              className="text-[11px] bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-md px-2.5 py-1 transition flex items-center gap-1"
            >
              <span>{sq.icon}</span>
              <span>{sq.title}</span>
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

      {/* Answer Output (Cognify Clean Reader Style) */}
      {answer && (
        <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-zinc-800 p-6 md:p-8 shadow-xs space-y-6">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-3">
              {answer.isSufficientlyGrounded ? (
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Citations ({Math.round(answer.groundingConfidence * 100)}% match)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>General Knowledge Synthesis</span>
                </span>
              )}

              <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
              <span>Model: <strong className="text-slate-800 dark:text-zinc-200 font-mono text-[11px]">{answer.model}</strong></span>
              <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">·</span>
              <span>Response: <strong className="text-slate-800 dark:text-zinc-200 font-mono text-[11px]">{answer.latencyMs}ms</strong></span>
            </div>

            <div className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
              {answer.retrievedChunksCount} sources checked
            </div>
          </div>

          {/* Answer Body */}
          <div className="text-slate-800 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {answer.answer}
          </div>

          {/* Verified Citations Section */}
          {answer.citations.length > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Verified Course Excerpts ({answer.citations.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {answer.citations.map((cite, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-medium text-slate-900 dark:text-white">
                      <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 truncate">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cite.source}</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                        {(cite.relevanceScore * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-zinc-400 italic bg-white dark:bg-zinc-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-700/60 text-[11px] leading-relaxed">
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
