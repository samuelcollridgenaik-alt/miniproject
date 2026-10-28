import React, { useEffect, useState } from 'react';
import { TopicMasteryData, QuizAttemptData } from '../types.js';
import { TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Clock, ArrowRight, Award } from 'lucide-react';

interface MasteryViewProps {
  onNavigateToPlanner?: () => void;
}

export const MasteryView: React.FC<MasteryViewProps> = ({ onNavigateToPlanner }) => {
  const [masteries, setMasteries] = useState<TopicMasteryData[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicMasteryData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMastery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/mastery');
      const data = await res.json();
      if (data.success) {
        setMasteries(data.data.topicMasteries || []);
        setWeakTopics(data.data.weakTopics || []);
        setStats(data.data.overall || null);
      }
    } catch (e) {
      console.error('Failed to load mastery data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMastery();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner (Google Analytics Style) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cognitive Mastery & Curriculum Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Computed deterministically from recorded assessment attempts.
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-medium">
            Formula: (Σ Correct / Σ Attempted) × 100
          </div>
        </div>

        {/* Global KPI Cards */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Quizzes</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalQuizzes}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Questions Answered</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalQuestionsAttempted}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Accuracy</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.overallAccuracy}%</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Weak Topics Found</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{stats.weakTopicsCount}</div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Calculating topic mastery analytics...</p>
        </div>
      )}

      {/* WEAK TOPICS INTERVENTION PANEL */}
      {!loading && weakTopics.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-950">
                Priority Weak Topics Identified (&lt; 60% Measured Mastery)
              </h3>
            </div>
            {onNavigateToPlanner && (
              <button
                onClick={onNavigateToPlanner}
                className="text-xs text-amber-900 hover:text-amber-950 font-bold flex items-center gap-1 transition bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full"
              >
                Generate Revision Schedule <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {weakTopics.map((wt, i) => (
              <div
                key={i}
                className="bg-white border border-amber-200 rounded-2xl p-4 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900">{wt.topic}</span>
                  <span className="text-amber-800 font-bold bg-amber-100 px-2.5 py-0.5 rounded-full">
                    {wt.masteryPercentage}% ({wt.correctAnswers}/{wt.totalQuestions})
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{wt.recommendedAction}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOPIC MASTERY BREAKDOWN */}
      {!loading && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Mastery Progress per Topic</span>
          </h3>

          {masteries.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No quiz attempts recorded yet. Take an assessment quiz in the Assessments tab to measure mastery.
            </p>
          ) : (
            <div className="space-y-3">
              {masteries.map((m) => {
                const isWeak = m.classification === 'weak';
                const isMastered = m.classification === 'mastered';

                return (
                  <div
                    key={m.topic}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{m.topic}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isMastered
                              ? 'bg-emerald-100 text-emerald-800'
                              : isWeak
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.classification}
                        </span>
                      </div>

                      <div className="text-slate-600 text-xs">
                        Correct: <strong className="text-slate-900">{m.correctAnswers}</strong> of{' '}
                        <strong className="text-slate-900">{m.totalQuestions}</strong> questions (
                        <strong className="text-blue-600 font-bold">{m.masteryPercentage}%</strong>)
                      </div>
                    </div>

                    {/* Progress Bar (Google Clean style) */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMastered
                            ? 'bg-emerald-500'
                            : isWeak
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${m.masteryPercentage}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 italic">
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
