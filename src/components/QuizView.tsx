import React, { useState } from 'react';
import { DocumentMeta, QuizQuestionData, QuizAttemptData } from '../types.js';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Award, ChevronRight, Bookmark, Check } from 'lucide-react';

interface QuizViewProps {
  documents: DocumentMeta[];
  onQuizCompleted: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ documents, onQuizCompleted }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [submittedAttempt, setSubmittedAttempt] = useState<QuizAttemptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setError(null);
    setSubmittedAttempt(null);
    setUserAnswers({});

    try {
      const res = await fetch('/api/study/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocId || undefined,
          count: questionCount,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setQuestions(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (submittedAttempt) return; // Locked once submitted
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      if (!confirm('You have unanswered questions. Are you sure you want to submit?')) return;
    }

    setLoading(true);
    setError(null);

    const items = questions.map((q) => ({
      questionId: q.id,
      topicTag: q.topicTag,
      selectedAnswer: userAnswers[q.id] || 'A',
      correctAnswer: q.correctAnswer,
    }));

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizTitle: selectedDocId
            ? documents.find((d) => d.id === selectedDocId)?.title || 'Course Quiz'
            : 'Comprehensive Course Assessment',
          documentId: selectedDocId || undefined,
          items,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSubmittedAttempt(data.data);
      onQuizCompleted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quiz Configuration Bar (Google Forms style) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Course Assessment & Quizzes (Google Forms Format)
              </h2>
              <p className="text-xs text-slate-500">
                Multiple-choice questions strictly grounded in lecture materials. Updates real-time topic mastery.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="">All Uploaded Course Documents</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>

            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={8}>8 Questions</option>
            </select>

            <button
              onClick={handleGenerateQuiz}
              disabled={loading || documents.length === 0}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Generate Quiz
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-2xl">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Generating grounded assessment questions...</p>
          <p className="text-xs text-slate-500 mt-0.5">Validating options schema and verified answer keys...</p>
        </div>
      )}

      {/* QUIZ SCORE BANNER */}
      {submittedAttempt && (
        <div className="bg-gradient-to-r from-purple-50 via-white to-blue-50 border border-purple-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                Graded Assessment Result
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                Score: {submittedAttempt.score} / {submittedAttempt.totalQuestions} ({submittedAttempt.percentage}%)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Results recorded in persistent learning analytics database.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(submittedAttempt.topicBreakdown).map(([topic, stat]) => (
                <div
                  key={topic}
                  className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 shadow-2xs text-xs"
                >
                  <div className="text-[11px] text-slate-500 font-medium">{topic}</div>
                  <div className="font-bold text-slate-900">
                    {stat.correct}/{stat.total} ({stat.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QUESTIONS LIST (Google Forms Layout) */}
      {!loading && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isAnswered = !!userAnswers[q.id];
            const isSubmitted = !!submittedAttempt;
            const isCorrect = isSubmitted && userAnswers[q.id] === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-3xl border p-6 transition-all shadow-xs ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-red-300 bg-red-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                      {idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200">
                      {q.topicTag}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {q.difficulty}
                    </span>
                  </div>

                  {isSubmitted && (
                    <div>
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Text */}
                <h4 className="text-sm font-semibold text-slate-900 mb-4 leading-relaxed">
                  {q.question}
                </h4>

                {/* Options Grid */}
                <div className="space-y-2 mb-4">
                  {q.options.map((opt) => {
                    const isSelected = userAnswers[q.id] === opt.key;
                    const isCorrectAnswer = opt.key === q.correctAnswer;

                    let optionClasses = 'border-slate-200 hover:bg-slate-50 text-slate-800 bg-white';
                    if (isSelected && !isSubmitted) {
                      optionClasses = 'border-blue-500 bg-blue-50/60 text-blue-900 font-medium ring-1 ring-blue-500/20';
                    } else if (isSubmitted) {
                      if (isCorrectAnswer) {
                        optionClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500/20';
                      } else if (isSelected && !isCorrectAnswer) {
                        optionClasses = 'border-red-400 bg-red-50 text-red-950';
                      } else {
                        optionClasses = 'border-slate-200 opacity-60 text-slate-500 bg-slate-50';
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt.key)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-center gap-3 transition ${optionClasses}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Academic Explanation */}
                {isSubmitted && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Academic Solution:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
                    {q.citation && (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        Source Citation: {q.citation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!submittedAttempt && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmitQuiz}
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-full shadow-md transition flex items-center gap-2"
              >
                <span>Submit Quiz for Grading</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No active quiz</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Choose a course document above and click "Generate Quiz" to test your conceptual understanding.
          </p>
        </div>
      )}
    </div>
  );
};
