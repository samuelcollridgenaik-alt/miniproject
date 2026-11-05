import { PageHeading } from "./ui/Primitives.js";
import React, { useState, useEffect } from "react";
import { DocumentMeta, FlashcardItem, SummaryData } from "../types.js";
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
} from "lucide-react";

interface StudyMaterialViewProps {
  documents: DocumentMeta[];
}

export const StudyMaterialView: React.FC<StudyMaterialViewProps> = ({
  documents,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    documents[0]?.id || "",
  );
  const [activeTab, setActiveTab] = useState<"flashcards" | "summary">(
    "flashcards",
  );
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([
    {
      id: "fc_1",
      front:
        "What are the 4 Coffman conditions required for deadlock to occur?",
      back: "Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If any one condition is broken, deadlock cannot occur.",
      topicTag: "Deadlock Characterization",
      citation: "Operating Systems & Distributed Architectures (Section 4.1)",
    },
    {
      id: "fc_2",
      front: "How does the Raft consensus algorithm handle leader crash?",
      back: "Heartbeat timeout triggers a follower to become Candidate, increments currentTerm, votes for itself, and requests votes from peers. The first to gain majority quorum becomes the new leader.",
      topicTag: "Distributed Consensus",
      citation: "Operating Systems & Distributed Architectures (Section 7.2)",
    },
    {
      id: "fc_3",
      front:
        "What is the fundamental difference between Paging and Segmentation?",
      back: "Paging divides memory into fixed-size physical blocks (frames) invisible to the programmer, eliminating external fragmentation. Segmentation divides memory into variable-sized logical blocks reflecting user program structure.",
      topicTag: "Memory Management",
      citation: "Operating Systems & Distributed Architectures (Section 3.2)",
    },
    {
      id: "fc_4",
      front: "What does the CAP Theorem state for distributed storage systems?",
      back: "It is impossible for a distributed data store to simultaneously provide more than two out of three guarantees: Consistency, Availability, and Partition Tolerance.",
      topicTag: "Distributed Storage",
      citation: "Operating Systems & Distributed Architectures (Section 6.4)",
    },
  ]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidenceRatings, setConfidenceRatings] = useState<
    Record<number, "hard" | "good" | "easy">
  >({});

  useEffect(() => {
    if (!selectedDocId && documents.length > 0) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "input, textarea, select, button, a, [contenteditable=true], [role=dialog]",
        )
      )
        return;
      if (
        e.code === "Space" &&
        activeTab === "flashcards" &&
        flashcards.length > 0
      ) {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (
        e.code === "ArrowRight" &&
        activeTab === "flashcards" &&
        flashcards.length > 0
      ) {
        handleNextCard();
      } else if (
        e.code === "ArrowLeft" &&
        activeTab === "flashcards" &&
        flashcards.length > 0
      ) {
        handlePrevCard();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeTab, flashcards.length, isFlipped, currentCardIndex]);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    const customGeminiKey = localStorage.getItem("cognify_gemini_key") || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (customGeminiKey) headers["x-gemini-key"] = customGeminiKey;

    try {
      const res = await fetch("/api/study/summary", {
        method: "POST",
        headers,
        body: JSON.stringify({ documentId: selectedDocId || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSummary(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to generate study summary");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setLoading(true);
    setError(null);
    const customGeminiKey = localStorage.getItem("cognify_gemini_key") || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (customGeminiKey) headers["x-gemini-key"] = customGeminiKey;

    try {
      const res = await fetch("/api/study/flashcards", {
        method: "POST",
        headers,
        body: JSON.stringify({
          documentId: selectedDocId || undefined,
          count: 6,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (!Array.isArray(data.data) || !data.data.length)
        throw new Error("No flashcards returned. Try another document.");
      if (data.data.length > 0) {
        setConfidenceRatings({});
        setFlashcards(data.data);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate flashcards");
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
      setCurrentCardIndex(
        (prev) => (prev - 1 + flashcards.length) % flashcards.length,
      );
    }, 150);
  };

  const handleRate = (rating: "hard" | "good" | "easy") => {
    setConfidenceRatings((prev) => ({ ...prev, [currentCardIndex]: rating }));
    handleNextCard();
  };

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="ui-page max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header with clean unboxed metadata */}
      <div className="border-b border-default pb-4">
        <div className="flex items-center gap-2 text-xs text-muted mb-2">
          <span>Cognify Workspace</span>
          <span aria-hidden="true">·</span>
          <span>Adaptive Recall</span>
          <span aria-hidden="true">·</span>
          <span className="text-primary font-medium">Flashcards Hub</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeading
            icon={Zap}
            title="Active Recall & Cards"
            description="Review practice cards or generate material from your course notes. Ratings apply to this session."
          />

          {/* Document Picker & Segmented Controls */}
          <div className="flex items-center gap-2">
            <select
              aria-label="Course context"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="ui-field text-xs rounded-lg border border-default bg-surface bg-subtle text-primary px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="">All Uploaded Notes</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>

            <div className="flex rounded-lg bg-subtle p-0.5 border border-default text-xs">
              <button
                onClick={() => setActiveTab("flashcards")}
                className={`ui-control px-3 py-1 rounded-md font-semibold transition ${
                  activeTab === "flashcards"
                    ? "bg-surface bg-elevated text-accent "
                    : "text-secondary text-muted hover:text-primary"
                }`}
              >
                Cards ({flashcards.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("summary");
                  if (!summary) handleGenerateSummary();
                }}
                className={`ui-control px-3 py-1 rounded-md font-semibold transition ${
                  activeTab === "summary"
                    ? "bg-surface bg-elevated text-accent "
                    : "text-secondary text-muted hover:text-primary"
                }`}
              >
                Executive Digest
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-danger-soft border border-danger text-xs text-danger"
        >
          {error}
        </div>
      )}

      <p className="text-xs text-muted">
        Initial cards are bundled practice material. Generate cards to use the
        selected course notes. Reference labels are not independent
        verification.
      </p>
      {flashcards.length > 0 &&
        Object.keys(confidenceRatings).length === flashcards.length && (
          <div role="status" className="ui-status ui-status-success">
            All {flashcards.length} cards rated in this session. You can keep
            reviewing or generate another set.
          </div>
        )}
      {/* Google Study Tip Callout */}
      <div className="p-3.5 rounded-xl bg-accent-soft bg-subtle border border-accent border-default text-xs flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="text-secondary text-primary leading-relaxed">
          <span className="font-semibold text-primary">Active Recall Tip:</span>{" "}
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-black/5 bg-surface font-mono text-[10px]">
            Space
          </kbd>{" "}
          to flip the card, and{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-black/5 bg-surface font-mono text-[10px]">
            ←
          </kbd>{" "}
          /{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-black/5 bg-surface font-mono text-[10px]">
            →
          </kbd>{" "}
          to navigate. Ratings track confidence for this session; they do not
          save a future review schedule.
        </div>
      </div>

      {activeTab === "flashcards" && (
        <div className="space-y-4">
          <div className="w-full max-w-2xl mx-auto">
            {flashcards.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-default bg-surface">
                <Layers className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-xs text-secondary text-muted">
                  No flashcards generated yet for this module.
                </p>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={loading}
                  className="ui-control mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-accent-solid hover:bg-accent-hover text-on-accent transition"
                >
                  {loading
                    ? "Synthesizing Cards..."
                    : "⚡ Generate New Cards with Gemini"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Progress bar and card tracker */}
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-mono font-medium">
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </span>
                  <div className="flex items-center gap-1">
                    {flashcards.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentCardIndex
                            ? "w-5 bg-accent-solid bg-accent-soft"
                            : confidenceRatings[idx]
                              ? "w-2 bg-success-solid"
                              : "w-2 bg-elevated bg-elevated"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={loading}
                    className="ui-control hover:text-primary flex items-center gap-1 font-medium transition"
                  >
                    <RotateCcw
                      className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                    />
                    <span>Regenerate</span>
                  </button>
                </div>

                {/* Flip Card Stage */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Flip flashcard"
                  aria-pressed={isFlipped}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFlipped((value) => !value);
                    }
                  }}
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="ui-flashcard cursor-pointer select-none min-h-[260px] p-8 rounded-2xl border border-default bg-surface  hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] font-bold text-accent">
                      {currentCard?.topicTag || "Active Recall"}
                    </span>
                    <span className="text-[11px] font-medium text-muted flex items-center gap-1">
                      <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition duration-300" />
                      {isFlipped
                        ? "Click to show question"
                        : "Click or Space to flip"}
                    </span>
                  </div>

                  <div className="my-6 text-center">
                    {!isFlipped ? (
                      <div className="space-y-3">
                        <span className="text-[11px] font-mono font-bold text-accent uppercase tracking-widest">
                          CONCEPT CHALLENGE
                        </span>
                        <h3 className="text-lg md:text-xl font-bold text-primary leading-snug">
                          {currentCard?.front}
                        </h3>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-150">
                        <span className="text-[11px] font-mono font-bold text-success uppercase tracking-widest">
                          ACADEMIC EXPLANATION
                        </span>
                        <p className="text-base text-primary leading-relaxed font-normal">
                          {currentCard?.back}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-default pt-3 flex items-center justify-between text-[11px] text-muted">
                    <span className="truncate max-w-[80%] font-mono">
                      📖 {currentCard?.citation || "Course reference"}
                    </span>
                    {confidenceRatings[currentCardIndex] && (
                      <span className="capitalize font-semibold text-success">
                        Rated: {confidenceRatings[currentCardIndex]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Spaced Repetition Confidence Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    aria-label="Previous Card"
                    onClick={handlePrevCard}
                    className="ui-control p-2.5 rounded-xl border border-default bg-surface bg-subtle hover:bg-elevated text-secondary text-primary transition"
                    title="Previous Card"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleRate("hard")}
                      className="ui-control px-3.5 py-1.5 rounded-xl text-xs font-medium border border-danger bg-danger-soft text-danger hover:bg-danger-soft transition"
                    >
                      Hard
                    </button>
                    <button
                      onClick={() => handleRate("good")}
                      className="ui-control px-3.5 py-1.5 rounded-xl text-xs font-medium border border-accent bg-accent-soft text-accent hover:bg-accent-soft transition"
                    >
                      Good
                    </button>
                    <button
                      onClick={() => handleRate("easy")}
                      className="ui-control px-3.5 py-1.5 rounded-xl text-xs font-medium border border-success bg-success-soft text-success hover:bg-success-soft transition"
                    >
                      Easy
                    </button>
                  </div>

                  <button
                    aria-label="Next Card"
                    onClick={handleNextCard}
                    className="ui-control p-2.5 rounded-xl border border-default bg-surface bg-subtle hover:bg-elevated text-secondary text-primary transition"
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
      {activeTab === "summary" && (
        <div className="ui-page">
          {loading && !summary ? (
            <div className="p-12 text-center bg-surface rounded-2xl border border-default ">
              <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-primary">
                Synthesizing chapter overview...
              </p>
              <p className="text-xs text-muted mt-0.5">
                Extracting theorems, definitions, and exam priorities...
              </p>
            </div>
          ) : summary ? (
            <div className="bg-surface rounded-2xl border border-default p-8  space-y-6">
              <div>
                <span className="text-[11px] font-mono font-bold text-accent">
                  EXECUTIVE ACADEMIC BRIEFING
                </span>
                <h2 className="text-xl font-bold text-primary mt-1">
                  {summary.title || "Course Digest"}
                </h2>
                <p className="text-xs text-muted mt-1">
                  Source: {summary.documentTitle}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-default text-xs text-primary leading-relaxed">
                {summary.overview}
              </div>

              {/* Core Concepts */}
              {summary.coreConcepts && summary.coreConcepts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <span>Foundational Invariants & Theorems</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.coreConcepts.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-subtle border border-default space-y-1.5"
                      >
                        <h4 className="text-xs font-bold text-primary">
                          {item.concept}
                        </h4>
                        <p className="text-xs text-secondary text-primary leading-relaxed">
                          {item.explanation}
                        </p>
                        {item.citation && (
                          <span className="text-[10px] text-muted font-mono block pt-1">
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
                {summary.formulasOrRules &&
                  summary.formulasOrRules.length > 0 && (
                    <div className="p-4 rounded-xl bg-subtle border border-default space-y-2">
                      <h4 className="text-xs font-bold text-primary">
                        📐 Mathematical Invariants
                      </h4>
                      <ul className="space-y-1.5 text-xs text-secondary text-primary font-mono">
                        {summary.formulasOrRules.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-accent">•</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {summary.examFocusPoints &&
                  summary.examFocusPoints.length > 0 && (
                    <div className="p-4 rounded-xl bg-subtle border border-default space-y-2">
                      <h4 className="text-xs font-bold text-primary">
                        🎯 High-Yield Exam Questions
                      </h4>
                      <ul className="space-y-1.5 text-xs text-secondary text-primary">
                        {summary.examFocusPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-surface rounded-2xl border border-default ">
              <FileText className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-xs text-secondary text-muted">
                No executive digest compiled yet.
              </p>
              <button
                onClick={handleGenerateSummary}
                disabled={loading}
                className="ui-control mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-accent-solid hover:bg-accent-hover text-on-accent transition"
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
