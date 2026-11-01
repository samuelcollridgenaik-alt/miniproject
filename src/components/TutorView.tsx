import React, { useState } from 'react';
import { DocumentMeta, GroundedAnswerData } from '../types.js';
import {
  Send,
  Sparkles,
  BookOpen,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  GraduationCap,
  Smile,
} from 'lucide-react';

interface TutorViewProps {
  documents: DocumentMeta[];
  onSeedSample: () => void;
  onNavigateToDocuments: () => void;
}

export const TutorView: React.FC<TutorViewProps> = ({
  documents,
  onSeedSample,
  onNavigateToDocuments,
}) => {
  const [question, setQuestion] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [tutorMode, setTutorMode] = useState<'kid' | 'scholar'>('kid');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<GroundedAnswerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleQuestions = [
    {
      title: 'Paging & Memory',
      icon: '📖',
      prompt: 'Explain paging vs segmentation and how it solves fragmentation.',
    },
    {
      title: 'ACID Guarantees',
      icon: '🔐',
      prompt: 'Why are ACID properties essential for transactional databases?',
    },
    {
      title: 'Raft Consensus',
      icon: '⛵',
      prompt: 'How does the Raft leader election algorithm prevent split votes?',
    },
    {
      title: 'Cache Hierarchies',
      icon: '⚡',
      prompt: 'How do L1, L2, and L3 CPU cache hierarchies minimize memory stall cycles?',
    },
  ];

  const handleCopy = () => {
    if (!answer?.answer) return;
    navigator.clipboard.writeText(answer.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAsk = async (queryToAsk?: string) => {
    const rawQ = queryToAsk || question;
    if (!rawQ.trim()) return;

    setLoading(true);
    setError(null);

    const formattedQuestion = tutorMode === 'kid'
      ? `${rawQ}\n\n[Persona: Explain this simply and cheerfully with everyday analogies that even a 10-year-old or beginner student can instantly understand! Break down tough terms into friendly concepts.]`
      : rawQ;

    const customGeminiKey = localStorage.getItem('cognify_gemini_key') || '';
    const preferredProvider = localStorage.getItem('cognify_preferred_provider') || 'gemini';

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customGeminiKey) headers['x-gemini-key'] = customGeminiKey;
    if (preferredProvider) headers['x-preferred-provider'] = preferredProvider;

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: formattedQuestion,
          documentIdFilter: selectedDocId || undefined,
          preferredProvider,
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
      {/* Cognify Tutor Input Card */}
      <div className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200/90 dark:border-zinc-800 p-6 shadow-xs transition-colors">
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
                className={`px-3 py-1 font-medium rounded-md transition flex items-center gap-1.5 ${
                  tutorMode === 'kid'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <span>🧸</span>
                <span>Simple & Fun</span>
              </button>
              <button
                type="button"
                onClick={() => setTutorMode('scholar')}
                className={`px-3 py-1 font-medium rounded-md transition flex items-center gap-1.5 ${
                  tutorMode === 'scholar'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <span>🎓</span>
                <span>Academic Pro</span>
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
                ? "Ask anything! (e.g. 'Explain how computer memory works like a kitchen' or 'Why do transactions need ACID?')..."
                : "Ask an academic question (e.g. 'Explain ACID properties' or 'Contrast paging vs segmentation')..."
            }
            className="w-full bg-slate-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl pl-4 pr-32 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-inner"
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
              className="text-[11px] bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700 rounded-lg px-2.5 py-1 transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>{sq.icon}</span>
              <span>{sq.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Retrieval Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Answer Output (Google NotebookLM Clean Reader Style) */}
      {answer && (
        <div className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200/90 dark:border-zinc-800 p-6 md:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          {/* Header Bar with Persona Badge & Copy Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-2.5">
              <span className="text-base">
                {tutorMode === 'kid' ? '🧸' : '🎓'}
              </span>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {tutorMode === 'kid' ? 'Cognify Junior' : 'Cognify Scholar'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 ml-1.5">
                  ({tutorMode === 'kid' ? 'Everyday Analogies' : 'MCA Rigor & Citations'})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 text-xs shadow-2xs"
                title="Copy Explanation"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            {answer.isSufficientlyGrounded ? (
              <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Citations ({Math.round(answer.groundingConfidence * 100)}% match)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Curriculum Synthesis</span>
              </span>
            )}

            <span aria-hidden="true">·</span>
            <span>Model: <strong className="text-slate-800 dark:text-zinc-200 font-mono text-[11px]">{answer.model}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Response: <strong className="text-slate-800 dark:text-zinc-200 font-mono text-[11px]">{answer.latencyMs}ms</strong></span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px]">{answer.retrievedChunksCount} sources checked</span>
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
                    className="bg-slate-50 dark:bg-zinc-850 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-3.5 text-xs space-y-1.5"
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
