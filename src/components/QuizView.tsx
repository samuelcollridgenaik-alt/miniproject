import { PageHeading } from "./ui/Primitives.js";
import { scorePracticeQuiz } from "../lib/quiz.js";
import { LoadingState, StatusMessage } from "./ui/Primitives.js";
import React, { useState } from "react";
import {
  DocumentMeta,
  QuizQuestionData,
  QuizAttemptData,
  LLMProviderId,
} from "../types.js";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  Bookmark,
  Check,
  Sparkles,
  ArrowRight,
  Zap,
  Play,
  Settings2,
} from "lucide-react";

interface QuizViewProps {
  documents: DocumentMeta[];
  onQuizCompleted: () => void;
  onOpenModelSettings?: () => void;
}

const PRESET_QUIZZES: {
  title: string;
  subtitle: string;
  tag: string;
  questions: QuizQuestionData[];
}[] = [
  {
    title: "Virtual Memory & Demand Paging Assessment",
    subtitle:
      "Page replacement algorithms, TLB reach, and Belady's anomaly invariants.",
    tag: "Memory Architecture",
    questions: [
      {
        id: "q_preset_1",
        question:
          "Which of the following page replacement algorithms is strictly immune to Belady's Anomaly?",
        options: [
          { key: "A", text: "First-In, First-Out (FIFO)" },
          { key: "B", text: "Least Recently Used (LRU)" },
          { key: "C", text: "Second-Chance Clock Algorithm" },
          { key: "D", text: "Random Page Replacement" },
        ],
        correctAnswer: "B",
        explanation:
          "LRU is a stack algorithm where the set of pages in memory for n frames is always a subset of pages in memory for n+1 frames, mathematically preventing Belady's Anomaly.",
        topicTag: "Page Replacement",
        difficulty: "medium",
        citation: "MCA OS Module 3, Section 3.6",
      },
      {
        id: "q_preset_2",
        question:
          "In a demand-paged system with 98% TLB hit ratio (TLB access = 10ns, RAM access = 100ns), what is the effective memory access time without page faults?",
        options: [
          { key: "A", text: "12ns" },
          { key: "B", text: "112ns" },
          { key: "C", text: "210ns" },
          { key: "D", text: "100ns" },
        ],
        correctAnswer: "B",
        explanation:
          "EAT = 0.98 * (10 + 100) + 0.02 * (10 + 100 + 100) = 0.98 * 110 + 0.02 * 210 = 107.8 + 4.2 = 112ns.",
        topicTag: "Memory Metrics",
        difficulty: "hard",
        citation: "MCA OS Module 3, Section 3.4",
      },
      {
        id: "q_preset_3",
        question:
          "What is the primary advantage of Inverted Page Tables over Multi-Level Hierarchical Paging in 64-bit architectures?",
        options: [
          { key: "A", text: "Completely eliminates page faults" },
          {
            key: "B",
            text: "Table memory overhead scales with physical frames rather than the massive virtual address space",
          },
          { key: "C", text: "Removes the need for MMU hardware" },
          { key: "D", text: "Eliminates hash bucket collisions" },
        ],
        correctAnswer: "B",
        explanation:
          "Inverted page tables allocate one entry per physical frame in RAM, bounding table overhead regardless of the 64-bit sparse address range.",
        topicTag: "Page Tables",
        difficulty: "hard",
        citation: "MCA OS Module 3, Section 3.5",
      },
    ],
  },
  {
    title: "Distributed Consensus & Raft Protocol Assessment",
    subtitle:
      "Quorum calculations, randomized election timeouts, and commit safety.",
    tag: "Distributed Systems",
    questions: [
      {
        id: "q_preset_4",
        question:
          "In the Raft consensus protocol, what condition must a follower verify before granting its vote to a candidate in an RequestVote RPC?",
        options: [
          { key: "A", text: "The candidate has been active the longest" },
          {
            key: "B",
            text: "The candidate's log is at least as up-to-date as the follower's own log (term and length)",
          },
          {
            key: "C",
            text: "The candidate possesses the lowest IP address in the cluster",
          },
          {
            key: "D",
            text: "The candidate already received votes from all other followers",
          },
        ],
        correctAnswer: "B",
        explanation:
          "Raft safety guarantees that a candidate's log must be at least as up-to-date as the voter's log; otherwise the vote is denied, preserving committed log safety.",
        topicTag: "Leader Election",
        difficulty: "medium",
        citation: "Distributed Systems Module 5, Section 5.2",
      },
      {
        id: "q_preset_5",
        question:
          "If a 7-node distributed cluster experiences a network partition splitting nodes into 4 and 3, which partition can continue committing write transactions?",
        options: [
          { key: "A", text: "The 3-node partition" },
          { key: "B", text: "Both partitions independently" },
          {
            key: "C",
            text: "The 4-node partition, because it holds majority quorum (4 > 7/2)",
          },
          {
            key: "D",
            text: "Neither partition can commit writes until reconnected",
          },
        ],
        correctAnswer: "C",
        explanation:
          "Majority quorum is floor(7/2) + 1 = 4 nodes. The 4-node sub-cluster forms a valid quorum and can continue committing; the 3-node partition rejects writes.",
        topicTag: "Network Partitions",
        difficulty: "medium",
        citation: "Distributed Systems Module 5, Section 5.4",
      },
    ],
  },
];

export const QuizView: React.FC<QuizViewProps> = ({
  documents,
  onQuizCompleted,
  onOpenModelSettings,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [loadingLabel, setLoadingLabel] = useState(
    "Preparing assessment questions…",
  );
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [userAnswers, setUserAnswers] = useState<
    Record<string, "A" | "B" | "C" | "D">
  >({});
  const [savedToServer, setSavedToServer] = useState(false);
  const [submittedAttempt, setSubmittedAttempt] =
    useState<QuizAttemptData | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const handleLaunchPreset = (preset: (typeof PRESET_QUIZZES)[0]) => {
    setQuestions(preset.questions);
    setUserAnswers({});
    setSubmittedAttempt(null);
    setInfoNotice(null);
  };

  const handleGenerateQuiz = async () => {
    setLoadingLabel("Preparing assessment questions…");
    setLoading(true);
    setInfoNotice(null);
    setSubmittedAttempt(null);
    setUserAnswers({});

    // Read client-side saved keys from localStorage if available
    const customGeminiKey = localStorage.getItem("cognify_gemini_key") || "";
    const customGroqKey = localStorage.getItem("cognify_groq_key") || "";
    const preferredProvider =
      localStorage.getItem("cognify_preferred_provider") || "";

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (customGeminiKey) headers["x-gemini-key"] = customGeminiKey;
      if (customGroqKey) headers["x-groq-key"] = customGroqKey;
      if (preferredProvider)
        headers["x-preferred-provider"] = preferredProvider;

      const res = await fetch("/api/study/quiz", {
        method: "POST",
        headers,
        body: JSON.stringify({
          documentId: selectedDocId || undefined,
          count: questionCount,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        // Instead of hard error, fallback smoothly to preset curriculum
        console.warn("Live generation fell back:", data.error);
        setQuestions(PRESET_QUIZZES[0].questions);
        setInfoNotice(
          "Live generation was unavailable. Showing bundled practice questions, not questions generated from your document.",
        );
        return;
      }

      setQuestions(data.data);
    } catch (err: any) {
      console.warn("Network error during quiz gen:", err.message);
      setQuestions(PRESET_QUIZZES[0].questions);
      setInfoNotice(
        "Could not reach quiz generation. Showing bundled practice questions.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (
    questionId: string,
    optionKey: "A" | "B" | "C" | "D",
  ) => {
    if (submittedAttempt) return; // Locked once submitted
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      setInfoNotice(
        "Answer each question before submitting. Unanswered questions are never automatically assigned an option.",
      );
      return;
    }

    setLoadingLabel("Saving assessment results…");
    setLoading(true);
    setInfoNotice(null);

    const items = questions.map((q) => ({
      questionId: q.id,
      topicTag: q.topicTag,
      selectedAnswer: userAnswers[q.id],
      correctAnswer: q.correctAnswer,
    }));

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizTitle: selectedDocId
            ? documents.find((d) => d.id === selectedDocId)?.title ||
              "Course Quiz"
            : "Comprehensive Course Assessment",
          documentId: selectedDocId || undefined,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.data)
        throw new Error("Results could not be saved.");
      setSubmittedAttempt(data.data);
      setSavedToServer(true);
      onQuizCompleted();
    } catch {
      setSubmittedAttempt(scorePracticeQuiz(questions, userAnswers));
      setSavedToServer(false);
      setInfoNotice(
        "Your score was calculated locally. It was not saved to learning analytics. You can retry saving below.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page">
      {/* Quiz Configuration Bar (Google Forms / NotebookLM style) */}
      <div className="bg-surface rounded-2xl border border-default p-6  transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeading
            icon={Award}
            title="Adaptive Quizzer"
            description="Practice with bundled questions or generate an assessment from your course notes."
          />

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Course context"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="ui-field bg-subtle border border-default text-xs text-primary rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="">All Uploaded Course Documents</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>

            <select
              aria-label="Question count"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              className="ui-field bg-subtle border border-default text-xs text-primary rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={8}>8 Questions</option>
            </select>

            <button
              onClick={handleGenerateQuiz}
              disabled={loading}
              className="ui-control px-4 py-2 bg-accent-solid hover:bg-accent-hover disabled:bg-elevated text-on-accent rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>{loading ? "Generating..." : "Generate New Quiz"}</span>
            </button>
          </div>
        </div>

        {infoNotice && (
          <div
            role="status"
            className="mt-4 p-3 bg-accent-soft border border-accent text-xs text-accent rounded-xl flex items-center justify-between gap-2"
          >
            <span>{infoNotice}</span>
            {onOpenModelSettings && (
              <button
                onClick={onOpenModelSettings}
                className="ui-control underline font-semibold hover:text-accent shrink-0"
              >
                Model Settings
              </button>
            )}
          </div>
        )}
      </div>

      {loading && <LoadingState label={loadingLabel} />}

      {/* QUIZ SCORE BANNER (When Submitted) */}
      {submittedAttempt && (
        <div className="bg-surface border border-accent rounded-2xl p-6 ">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-accent">
                  Assessment Completed
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {savedToServer
                    ? "Learning analytics updated"
                    : "Local result only"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-primary mt-1">
                Score: {submittedAttempt.score} /{" "}
                {submittedAttempt.totalQuestions} ({submittedAttempt.percentage}
                %)
              </h2>
              <p className="text-xs text-secondary text-muted mt-0.5">
                {savedToServer
                  ? "Results saved to learning analytics."
                  : "Results are not saved to the server."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(submittedAttempt.topicBreakdown).map(
                ([topic, stat]) => (
                  <div
                    key={topic}
                    className="bg-subtle border border-default rounded-xl px-3.5 py-2 text-xs"
                  >
                    <div className="text-[11px] text-muted font-medium">
                      {topic}
                    </div>
                    <div className="font-bold text-primary">
                      {stat.correct}/{stat.total} ({stat.percentage}%)
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {submittedAttempt && !savedToServer && (
        <StatusMessage
          action={
            <button
              className="ui-control ui-button"
              disabled={loading}
              onClick={handleSubmitQuiz}
            >
              Retry saving results
            </button>
          }
        >
          Your answers and local score are retained in this view.
        </StatusMessage>
      )}
      {/* QUESTIONS LIST (Google Forms Layout) */}
      {!loading && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isAnswered = !!userAnswers[q.id];
            const isSubmitted = !!submittedAttempt;
            const isCorrect =
              isSubmitted && userAnswers[q.id] === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`bg-surface rounded-2xl border p-6 transition-all  ${
                  isSubmitted
                    ? isCorrect
                      ? "border-success bg-success-soft"
                      : "border-danger bg-danger-soft"
                    : "border-default"
                }`}
              >
                {/* Header with clean unboxed metadata */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="w-5 h-5 rounded-md bg-subtle flex items-center justify-center font-bold text-secondary text-primary text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-secondary text-primary">
                      {q.topicTag}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase text-[10px] font-mono">
                      {q.difficulty}
                    </span>
                  </div>

                  {isSubmitted && (
                    <div>
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-success">
                          <CheckCircle2 className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-danger">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Text */}
                <h2 className="text-sm font-semibold text-primary mb-4 leading-relaxed">
                  {q.question}
                </h2>

                {/* Options Grid */}
                <div
                  className="space-y-2 mb-4"
                  role="radiogroup"
                  aria-label={q.question}
                  onKeyDown={(e) => {
                    if (
                      submittedAttempt ||
                      ![
                        "ArrowDown",
                        "ArrowUp",
                        "ArrowLeft",
                        "ArrowRight",
                        "Home",
                        "End",
                      ].includes(e.key)
                    )
                      return;
                    e.preventDefault();
                    const radios = Array.from(
                      e.currentTarget.querySelectorAll<HTMLButtonElement>(
                        "[role=radio]",
                      ),
                    );
                    const focused = radios.indexOf(
                      document.activeElement as HTMLButtonElement,
                    );
                    const index =
                      focused >= 0
                        ? focused
                        : q.options.findIndex(
                            (option) => option.key === userAnswers[q.id],
                          );
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? q.options.length - 1
                          : (index +
                              (["ArrowDown", "ArrowRight"].includes(e.key)
                                ? 1
                                : q.options.length - 1)) %
                            q.options.length;
                    handleSelectOption(q.id, q.options[next].key);
                    e.currentTarget
                      .querySelectorAll<HTMLButtonElement>("[role=radio]")
                      [next]?.focus();
                  }}
                >
                  {q.options.map((opt) => {
                    const isSelected = userAnswers[q.id] === opt.key;
                    const isCorrectAnswer = opt.key === q.correctAnswer;

                    let optionBorder =
                      "border-default hover:border-default hover:border-default";
                    let optionBg = "bg-surface bg-subtle";

                    if (isSubmitted) {
                      if (isCorrectAnswer) {
                        optionBorder = "border-success";
                        optionBg = "bg-success-soft text-success font-medium";
                      } else if (isSelected && !isCorrectAnswer) {
                        optionBorder = "border-danger";
                        optionBg = "bg-danger-soft text-danger";
                      }
                    } else if (isSelected) {
                      optionBorder = "border-accent";
                      optionBg = "bg-accent-soft text-accent";
                    }

                    return (
                      <button
                        key={opt.key}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${opt.key}. ${opt.text}`}
                        tabIndex={
                          isSelected ||
                          (!userAnswers[q.id] && opt.key === q.options[0].key)
                            ? 0
                            : -1
                        }
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt.key)}
                        disabled={isSubmitted}
                        className={`ui-control w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${optionBorder} ${optionBg}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? "border-accent bg-accent-solid text-on-accent"
                              : "border-default text-secondary text-muted"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="text-xs leading-relaxed flex-1 text-primary">
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Citation (Upon Submission) */}
                {isSubmitted && (
                  <div className="pt-3 border-t border-default text-xs text-secondary text-muted space-y-1">
                    <p>
                      <strong className="text-primary">Explanation:</strong>{" "}
                      {q.explanation}
                    </p>
                    {q.citation && (
                      <p className="text-[11px] text-muted">
                        Citation: {q.citation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Action Bar */}
          {!submittedAttempt && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted">
                Answered {Object.keys(userAnswers).length} of {questions.length}{" "}
                questions
              </span>
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={loading}
                className="ui-control px-6 py-2.5 bg-accent-solid hover:bg-accent-hover text-on-accent font-semibold text-xs rounded-xl transition flex items-center gap-2"
              >
                <span>Submit & View Mastery</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUICK LAUNCH CURRICULUM PRESETS (When no quiz is active) */}
      {!loading && questions.length === 0 && (
        <div className="space-y-4">
          <div className="p-8 text-center bg-surface rounded-2xl border border-default ">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-primary">
              Ready for an Academic Knowledge Check?
            </h2>
            <p className="text-xs text-muted max-w-md mx-auto mt-1 mb-6">
              Launch a bundled practice assessment or choose an uploaded lecture
              document to generate fresh questions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              {PRESET_QUIZZES.map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => handleLaunchPreset(preset)}
                  className="ui-control p-4 rounded-xl border border-default hover:border-accent bg-subtle hover:bg-elevated transition group text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-accent">
                      {preset.tag}
                    </span>
                    <Play className="w-3.5 h-3.5 text-muted group-hover:text-accent transition" />
                  </div>
                  <h2 className="text-xs font-bold text-primary mb-1">
                    {preset.title}
                  </h2>
                  <p className="text-[11px] text-muted leading-snug">
                    {preset.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
