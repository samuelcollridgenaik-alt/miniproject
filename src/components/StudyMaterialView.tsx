import React, { useState, useEffect } from 'react';
import { DocumentMeta, FlashcardItem, SummaryData } from '../types.js';
import {
  Layers,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Bookmark,
  FileText,
  Lightbulb,
  BookOpen,
  Zap,
} from 'lucide-react';

interface StudyMaterialViewProps {
  documents: DocumentMeta[];
}

export const StudyMaterialView: React.FC<StudyMaterialViewProps> = ({ documents }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'flashcards' | 'summary'>('flashcards');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([
    {
      id: 'fc_1',
      front: 'What are the 4 Coffman conditions required for deadlock to occur?',
      back: 'Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If any one condition is broken, deadlock cannot occur.',
      topicTag: 'Deadlock Characterization',
      citation: 'Operating Systems & Distributed Architectures (Section 4.1)',
    },
    {
      id: 'fc_2',
      front: 'How does the Raft consensus algorithm handle leader crash?',
      back: 'Heartbeat timeout triggers a follower to become Candidate, increments currentTerm, votes for itself, and requests votes from peers. The first to gain majority quorum becomes the new leader.',
      topicTag: 'Distributed Consensus',
      citation: 'Operating Systems & Distributed Architectures (Section 7.2)',
    },
    {
      id: 'fc_3',
      front: 'What is the fundamental difference between Paging and Segmentation?',
      back: 'Paging divides memory into fixed-size physical blocks (frames) invisible to the programmer, eliminating external fragmentation. Segmentation divides memory into variable-sized logical blocks reflecting user program structure.',
      topicTag: 'Memory Management',
      citation: 'Operating Systems & Distributed Architectures (Section 3.2)',
    },
    {
      id: 'fc_4',
      front: 'What does the CAP Theorem state for distributed storage systems?',
      back: 'It is impossible for a distributed data store to simultaneously provide more than two out of three guarantees: Consistency, Availability, and Partition Tolerance.',
      topicTag: 'Distributed Storage',
      citation: 'Operating Systems & Distributed Architectures (Section 6.4)',
    },
  ]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidenceRatings, setConfidenceRatings] = useState<Record<number, 'hard' | 'good' | 'easy'>>({});

  useEffect(() => {
    if (!selectedDocId && documents.length > 0) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && activeTab === 'flashcards' && flashcards.length > 0) {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === 'ArrowRight' && activeTab === 'flashcards' && flashcards.length > 0) {
        handleNextCard();
      } else if (e.code === 'ArrowLeft' && activeTab === 'flashcards' && flashcards.length > 0) {
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, flashcards.length, isFlipped, currentCardIndex]);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    const customGeminiKey = localStorage.getItem('cognify_gemini_key') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customGeminiKey) headers['x-gemini-key'] = customGeminiKey;

    try {
      const res = await fetch('/api/study/summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({ documentId: selectedDocId || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSummary(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate study summary');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setLoading(true);
    setError(null);
    const customGeminiKey = localStorage.getItem('cognify_gemini_key') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (customGeminiKey) headers['x-gemini-key'] = customGeminiKey;

    try {
      const res = await fetch('/api/study/flashcards', {
        method: 'POST',
        headers,
        body: JSON.stringify({ documentId: selectedDocId || undefined, count: 6 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.data && data.data.length > 0) {
        setFlashcards(data.data);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const handleRate = (rating: 'hard' | 'good' | 'easy') => {
    setConfidenceRatings((prev) => ({ ...prev, [currentCardIndex]: rating }));
    handleNextCard();
  };

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header with clean unboxed metadata */}
      <div className="border-b border-slate-200/80 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mb-2">
          <span>Cognify Workspace</span>
          <span aria-hidden="true">·</span>
          <span>Adaptive Recall</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-800 dark:text-white font-medium">Flashcards Hub</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Active Recall & Flashcards Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Spaced repetition grounded in lecture materials & verified MCA curriculum citations.
              </p>
            </div>
          </div>

          {/* Document Picker & Segmented Controls */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="">All Uploaded Notes</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>

            <div className="flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5 border border-slate-200/80 dark:border-zinc-700/80 text-xs">
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  activeTab === 'flashcards'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                Cards ({flashcards.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('summary');
                  if (!summary) handleGenerateSummary();
                }}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  activeTab === 'summary'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                Executive Digest
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Google Study Tip Callout */}
      <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-zinc-800/60 border border-indigo-100/80 dark:border-zinc-700/60 text-xs flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-slate-700 dark:text-zinc-300 leading-relaxed">
          <span className="font-semibold text-slate-900 dark:text-white">Active Recall Tip:</span> Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">Space</kbd> to flip the card, and <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">→</kbd> to navigate. Rating cards tunes your spaced repetition retention schedule.
        </div>
      </div>

      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          <div className="w-full max-w-2xl mx-auto">
            {flashcards.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#1e1f20]">
                <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 dark:text-zinc-400">No flashcards generated yet for this module.</p>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={loading}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
                >
                  {loading ? 'Synthesizing Cards...' : '⚡ Generate New Cards with Gemini'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Progress bar and card tracker */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                  <span className="font-mono font-medium">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </span>
                  <div className="flex items-center gap-1">
                    {flashcards.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentCardIndex
                            ? 'w-5 bg-indigo-600 dark:bg-indigo-400'
                            : confidenceRatings[idx]
                            ? 'w-2 bg-emerald-500'
                            : 'w-2 bg-slate-200 dark:bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={loading}
                    className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium transition"
                  >
                    <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>

                {/* Flip Card Stage */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="cursor-pointer select-none min-h-[260px] p-8 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#1e1f20] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {currentCard?.topicTag || 'Active Recall'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition duration-300" />
                      {isFlipped ? 'Click to show question' : 'Click or Space to flip'}
                    </span>
                  </div>

                  <div className="my-6 text-center">
                    {!isFlipped ? (
                      <div className="space-y-3">
                        <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                          CONCEPT CHALLENGE
                        </span>
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                          {currentCard?.front}
                        </h3>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-150">
                        <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          ACADEMIC EXPLANATION
                        </span>
                        <p className="text-base text-slate-800 dark:text-zinc-200 leading-relaxed font-normal">
                          {currentCard?.back}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-zinc-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                    <span className="truncate max-w-[80%] font-mono">
                      📖 {currentCard?.citation || 'Verified Lecture Notes'}
                    </span>
                    {confidenceRatings[currentCardIndex] && (
                      <span className="capitalize font-semibold text-emerald-600 dark:text-emerald-400">
                        Rated: {confidenceRatings[currentCardIndex]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Spaced Repetition Confidence Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={handlePrevCard}
                    className="p-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition"
                    title="Previous Card"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleRate('hard')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 hover:bg-red-100 transition shadow-2xs"
                    >
                      Hard (1 Day)
                    </button>
                    <button
                      onClick={() => handleRate('good')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition shadow-2xs"
                    >
                      Good (3 Days)
                    </button>
                    <button
                      onClick={() => handleRate('easy')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-2xs"
                    >
                      Easy (7 Days)
                    </button>
                  </div>

                  <button
                    onClick={handleNextCard}
                    className="p-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition"
                    title="Next Card"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chapter Digest / Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {loading && !summary ? (
            <div className="p-12 text-center bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-xs">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Synthesizing chapter overview...</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Extracting theorems, definitions, and exam priorities...</p>
            </div>
          ) : summary ? (
            <div className="bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200/90 dark:border-zinc-800 p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  EXECUTIVE ACADEMIC BRIEFING
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {summary.title || 'Course Digest'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Source: {summary.documentTitle}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-750 text-xs text-slate-800 dark:text-zinc-200 leading-relaxed">
                {summary.overview}
              </div>

              {/* Core Concepts */}
              {summary.coreConcepts && summary.coreConcepts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Foundational Invariants & Theorems</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.coreConcepts.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 space-y-1.5"
                      >
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.concept}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                          {item.explanation}
                        </p>
                        {item.citation && (
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono block pt-1">
                            {item.citation}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulas & Exam Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {summary.formulasOrRules && summary.formulasOrRules.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      📐 Mathematical Invariants
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-zinc-300 font-mono">
                      {summary.formulasOrRules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-indigo-600 dark:text-indigo-400">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.examFocusPoints && summary.examFocusPoints.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      🎯 High-Yield Exam Questions
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
                      {summary.examFocusPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#1e1f20] rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-xs">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 dark:text-zinc-400">No executive digest compiled yet.</p>
              <button
                onClick={handleGenerateSummary}
                disabled={loading}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
              >
                Compile Executive Digest
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
