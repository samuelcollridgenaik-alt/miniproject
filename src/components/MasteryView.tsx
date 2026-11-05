import { StatusMessage, LoadingState } from "./ui/Primitives.js";
import { PageHeading } from "./ui/Primitives.js";
import React, { useEffect, useState } from "react";
import { TopicMasteryData, QuizAttemptData } from "../types.js";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Clock,
  ArrowRight,
  Award,
} from "lucide-react";

interface MasteryViewProps {
  onNavigateToPlanner?: () => void;
}

export const MasteryView: React.FC<MasteryViewProps> = ({
  onNavigateToPlanner,
}) => {
  const [masteries, setMasteries] = useState<TopicMasteryData[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicMasteryData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMastery = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/mastery");
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Unable to load learning analytics.");
      if (data.success) {
        setMasteries(data.data.topicMasteries || []);
        setWeakTopics(data.data.weakTopics || []);
        setStats(data.data.overall || null);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load learning analytics.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMastery();
  }, []);

  return (
    <div className="ui-page">
      {/* Top Banner (Google Analytics Style) */}
      <div className="bg-surface rounded-xl border border-default p-6 ">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeading
            icon={TrendingUp}
            title={<> Cognitive Mastery & Curriculum Analytics </>}
            description={
              <>
                {" "}
                Computed deterministically from recorded assessment
                attempts.{" "}
              </>
            }
          />

          <div className="px-3.5 py-1.5 rounded-full bg-subtle border border-default text-secondary text-xs font-mono font-medium">
            Formula: (Σ Correct / Σ Attempted) × 100
          </div>
        </div>

        {/* Global KPI Cards */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-default">
            <div className="bg-subtle p-4 rounded-2xl border border-default">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Total Quizzes
              </div>
              <div className="text-2xl font-bold text-primary mt-1">
                {stats.totalQuizzes}
              </div>
            </div>
            <div className="bg-subtle p-4 rounded-2xl border border-default">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Questions Answered
              </div>
              <div className="text-2xl font-bold text-primary mt-1">
                {stats.totalQuestionsAttempted}
              </div>
            </div>
            <div className="bg-subtle p-4 rounded-2xl border border-default">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Overall Accuracy
              </div>
              <div className="text-2xl font-bold text-success mt-1">
                {stats.totalQuestionsAttempted > 0
                  ? `${stats.overallAccuracy}%`
                  : "—"}
              </div>
              {stats.totalQuestionsAttempted === 0 && (
                <p className="text-xs text-muted mt-1">No recorded answers</p>
              )}
            </div>
            <div className="bg-subtle p-4 rounded-2xl border border-default">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Weak Topics Found
              </div>
              <div className="text-2xl font-bold text-warning mt-1">
                {stats.weakTopicsCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <StatusMessage
          tone="error"
          action={
            <button onClick={fetchMastery} className="ui-control underline">
              Retry analytics
            </button>
          }
        >
          {error}
        </StatusMessage>
      )}
      {loading && (
        <LoadingState label="Loading your recorded learning progress…" />
      )}
      {/* WEAK TOPICS INTERVENTION PANEL */}
      {!loading && weakTopics.length > 0 && (
        <div className="bg-warning-soft border border-warning rounded-xl p-6 ">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-bold text-warning">
                Priority Weak Topics Identified (&lt; 60% Measured Mastery)
              </h3>
            </div>
            {onNavigateToPlanner && (
              <button
                onClick={onNavigateToPlanner}
                className="ui-control text-xs text-warning hover:text-warning font-bold flex items-center gap-1 transition bg-warning-soft hover:bg-warning-soft px-3 py-1 rounded-full"
              >
                Generate Revision Schedule{" "}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {weakTopics.map((wt, i) => (
              <div
                key={i}
                className="bg-surface border border-warning rounded-2xl p-4 text-xs "
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-primary">{wt.topic}</span>
                  <span className="text-warning font-bold bg-warning-soft px-2.5 py-0.5 rounded-full">
                    {wt.masteryPercentage}% ({wt.correctAnswers}/
                    {wt.totalQuestions})
                  </span>
                </div>
                <p className="text-secondary text-[11px] leading-relaxed">
                  {wt.recommendedAction}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOPIC MASTERY BREAKDOWN */}
      {!loading && !error && (
        <div className="bg-surface rounded-xl border border-default p-6 ">
          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span>Mastery Progress per Topic</span>
          </h3>

          {masteries.length === 0 ? (
            <p className="text-xs text-muted py-8 text-center">
              No quiz attempts recorded yet. Take an assessment quiz in the
              Assessments tab to measure mastery.
            </p>
          ) : (
            <div className="space-y-3">
              {masteries.map((m) => {
                const isWeak = m.classification === "weak";
                const isMastered = m.classification === "mastered";

                return (
                  <div
                    key={m.topic}
                    className="bg-subtle border border-default rounded-2xl p-4 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary text-sm">
                          {m.topic}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isMastered
                              ? "bg-success-soft text-success"
                              : isWeak
                                ? "bg-danger-soft text-danger"
                                : "bg-warning-soft text-warning"
                          }`}
                        >
                          {m.classification}
                        </span>
                      </div>

                      <div className="text-secondary text-xs">
                        Correct:{" "}
                        <strong className="text-primary">
                          {m.correctAnswers}
                        </strong>{" "}
                        of{" "}
                        <strong className="text-primary">
                          {m.totalQuestions}
                        </strong>{" "}
                        questions (
                        <strong className="text-accent font-bold">
                          {m.masteryPercentage}%
                        </strong>
                        )
                      </div>
                    </div>

                    {/* Progress Bar (Google Clean style) */}
                    <div
                      role="progressbar"
                      aria-label={`${m.topic} mastery`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={m.masteryPercentage}
                      className="w-full bg-elevated h-2 rounded-full overflow-hidden mb-2"
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMastered
                            ? "bg-success-solid"
                            : isWeak
                              ? "bg-danger-solid"
                              : "bg-warning-solid"
                        }`}
                        style={{ width: `${m.masteryPercentage}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-muted italic">
                      Action: {m.recommendedAction}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
