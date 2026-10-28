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
      back: 'Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If any one is broken, deadlock cannot occur.',
      topicTag: 'Deadlock Characterization',
      citation: 'Operating Systems & Distributed Architectures (Section 4.1)',
    },
    {
      id: 'fc_2',
      front: 'How does the Raft consensus algorithm handle leader crash?',
      back: 'Heartbeat timeout triggers a follower to become Candidate, increments currentTerm, votes for itself, and requests votes from peers. First to gain majority quorum becomes the new leader.',
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
    if (!selectedDocId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/study/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: selectedDocId }),
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
    if (!selectedDocId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/study/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: selectedDocId, count: 8 }),
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
      {/* Notion Page Breadcrumb & Header */}
      <div className="border-b border-[#e9e9e7] dark:border-[#2f2f2f] pb-4">
        <div className="flex items-center gap-2 text-xs text-[#787774] dark:text-[#9b9a97] mb-2 font-mono">
          <span>Samuel's Brain</span>
          <span>/</span>
          <span>Learning & Recall</span>
          <span>/</span>
          <span className="text-[#37352f] dark:text-[#e3e2e0] font-medium">Active Recall Hub</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#37352f] dark:text-white">
                Active Recall & Flashcard Hub
              </h1>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
                Evidence-based spaced repetition powered by Groq Llama 3.3 and verified course citations.
              </p>
            </div>
          </div>

          {/* Document Picker & Tab Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="text-xs rounded-md border border-[#e9e9e7] dark:border-[#333333] bg-[#fbfbfa] dark:bg-[#202020] text-[#37352f] dark:text-[#e3e2e0] px-2.5 py-1.5 focus:outline-none"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>

            <div className="flex rounded-md bg-[#f1f1ef] dark:bg-[#252525] p-0.5 border border-[#e9e9e7] dark:border-[#333333]">
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  activeTab === 'flashcards'
                    ? 'bg-white dark:bg-[#333333] text-[#37352f] dark:text-white shadow-2xs'
                    : 'text-[#787774] hover:text-[#37352f] dark:hover:text-white'
                }`}
              >
                Cards ({flashcards.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('summary');
                  if (!summary) handleGenerateSummary();
                }}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  activeTab === 'summary'
                    ? 'bg-white dark:bg-[#333333] text-[#37352f] dark:text-white shadow-2xs'
                    : 'text-[#787774] hover:text-[#37352f] dark:hover:text-white'
                }`}
              >
                Chapter Digest
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Notion Callout Box */}
      <div className="p-3.5 rounded-lg bg-[#f7f6f3] dark:bg-[#202020] border-l-4 border-amber-400 text-xs flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[#37352f] dark:text-[#e3e2e0] leading-relaxed">
          <span className="font-semibold">Notion Study Tip:</span> Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">Space</kbd> to flip the card, and <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">→</kbd> to navigate. Rating cards tunes your spaced repetition cycle.
        </div>
      </div>

      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          <div className="w-full max-w-2xl mx-auto">
            {flashcards.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-dashed border-[#e9e9e7] dark:border-[#333333]">
                <Layers className="w-8 h-8 text-[#9b9a97] mx-auto mb-2" />
                <p className="text-xs text-[#787774] dark:text-[#9b9a97]">No flashcards generated yet for this module.</p>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={loading}
                  className="mt-3 px-4 py-2 rounded-md text-xs font-semibold bg-[#2383e2] text-white hover:bg-[#1d6fc2] transition shadow-2xs"
                >
                  {loading ? 'Synthesizing Cards...' : '⚡ Generate New Cards with Groq'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Progress bar and card tracker */}
                <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
                  <span className="font-mono font-medium">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </span>
                  <div className="flex items-center gap-1">
                    {flashcards.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentCardIndex
                            ? 'w-5 bg-[#2383e2]'
                            : confidenceRatings[idx]
                            ? 'bg-emerald-500'
                            : 'bg-black/10 dark:bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={loading}
                    className="hover:text-[#37352f] dark:hover:text-white flex items-center gap-1 font-medium transition"
                  >
                    <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>

                {/* Flip Card Stage */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="cursor-pointer select-none min-h-[260px] p-8 rounded-2xl border border-[#e9e9e7] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-[#f1f1ef] dark:bg-[#2c2c2c] text-[#787774] dark:text-[#9b9a97]">
                      {currentCard?.topicTag || 'Active Recall'}
                    </span>
                    <span className="text-[11px] font-medium text-[#9b9a97] flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition duration-300" />
                      {isFlipped ? 'Click to show question' : 'Click or Space to reveal'}
                    </span>
                  </div>

                  <div className="my-6 text-center">
                    {!isFlipped ? (
                      <div className="space-y-3">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                          QUESTION
                        </span>
                        <h3 className="text-lg md:text-xl font-bold text-[#37352f] dark:text-white leading-snug">
                          {currentCard?.front}
                        </h3>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-150">
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          ANSWER EXPLANATION
                        </span>
                        <p className="text-base text-[#37352f] dark:text-[#e3e2e0] leading-relaxed font-normal">
                          {currentCard?.back}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#f1f1ef] dark:border-[#2a2a2a] pt-3 flex items-center justify-between text-[11px] text-[#9b9a97]">
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
                    className="p-2 rounded-md border border-[#e9e9e7] dark:border-[#333333] hover:bg-black/5 dark:hover:bg-white/5 text-[#787774] dark:text-[#9b9a97]"
                    title="Previous Card"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleRate('hard')}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 hover:bg-red-100 transition shadow-2xs"
                    >
                      Hard (1 Day)
                    </button>
                    <button
                      onClick={() => handleRate('good')}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition shadow-2xs"
                    >
                      Good (3 Days)
                    </button>
                    <button
                      onClick={() => handleRate('easy')}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-2xs"
                    >
                      Easy (7 Days)
                    </button>
                  </div>

                  <button
                    onClick={handleNextCard}
                    className="p-2 rounded-md border border-[#e9e9e7] dark:border-[#333333] hover:bg-black/5 dark:hover:bg-white/5 text-[#787774] dark:text-[#9b9a97]"
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

      {activeTab === 'summary' && (
        <div className="space-y-4">
          {!summary && !loading ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-[#e9e9e7] dark:border-[#333333]">
              <FileText className="w-8 h-8 text-[#9b9a97] mx-auto mb-2" />
              <p className="text-xs text-[#787774] dark:text-[#9b9a97]">Generate an executive chapter summary from your uploaded materials.</p>
              <button
                onClick={handleGenerateSummary}
                className="mt-3 px-4 py-2 rounded-md text-xs font-semibold bg-[#2383e2] text-white hover:bg-[#1d6fc2] shadow-2xs"
              >
                Synthesize Chapter Summary
              </button>
            </div>
          ) : loading ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-[#2383e2] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#787774] dark:text-[#9b9a97]">Groq Llama 3.3 is reading and condensing the course material...</p>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-[#e9e9e7] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">
                  CHAPTER DIGEST
                </span>
                <h3 className="text-lg font-bold text-[#37352f] dark:text-white mt-1">
                  {summary?.title || summary?.documentTitle || 'Course Notes Breakdown'}
                </h3>
              </div>

              <div className="p-3.5 rounded-lg bg-[#f7f6f3] dark:bg-[#252525] text-xs leading-relaxed text-[#37352f] dark:text-[#e3e2e0]">
                {summary?.overview}
              </div>

              {summary?.coreConcepts && summary.coreConcepts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#9b9a97] font-mono">
                    High-Yield Concepts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {summary.coreConcepts.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-[#e9e9e7] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1f1f1f] text-xs"
                      >
                        <div className="font-semibold text-[#37352f] dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.concept}</span>
                        </div>
                        <p className="text-[#787774] dark:text-[#9b9a97] mt-1 text-[11px] leading-relaxed">
                          {item.explanation}
                        </p>
                        {item.citation && (
                          <div className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                            📖 {item.citation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
