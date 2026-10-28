import React, { useState } from 'react';
import { StudyPlanData } from '../types.js';
import { Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, BookOpen, ChevronDown, Award } from 'lucide-react';

export const StudyPlannerView: React.FC = () => {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 10);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const [examDate, setExamDate] = useState<string>(defaultDateStr);
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [subjectGoal, setSubjectGoal] = useState<string>('Master MCA Core Curriculum & Distributed Algorithms');
  const [loading, setLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlanData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/study-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examDate,
          dailyAvailableHours: dailyHours,
          subjectGoal,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setStudyPlan(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate study plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Form (Google Calendar Style) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Personalized Revision Planner (Google Calendar Style)
            </h2>
            <p className="text-xs text-slate-500">
              Synthesizes daily study allocations targeting measured weak areas with strict mathematical feasibility checks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Daily Study Capacity (Hours)
            </label>
            <input
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value) || 3)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course Focus</label>
            <input
              type="text"
              value={subjectGoal}
              onChange={(e) => setSubjectGoal(e.target.value)}
              placeholder="e.g. MCA Operating Systems & Databases"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-full flex items-center gap-2 transition shadow-xs"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Computing Schedule...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Verified Study Schedule</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-2xl">
            {error}
          </div>
        )}
      </div>

      {/* PLAN OUTPUT */}
      {studyPlan && (
        <div className="space-y-5">
          {/* Overview */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  Targeted Revision Calendar
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {studyPlan.totalDays} Days until Exam ({studyPlan.totalStudyHoursAllocated} Total Study Hours)
                </h3>
              </div>

              <div>
                {studyPlan.isScheduleMathematicallyFeasible ? (
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Mathematically Feasible
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Schedule Adjusted
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-emerald-900 font-mono bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
              {studyPlan.scheduleValidationMessage}
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" /> Cognitive Strategy
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{studyPlan.strategicAdvice}</p>
            </div>
          </div>

          {/* Day by Day Schedule Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Day-by-Day Calendar Plan</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {studyPlan.dailySchedule.map((day) => (
                <div
                  key={day.dayNumber}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs text-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs">
                        D{day.dayNumber}
                      </span>
                      <span className="font-bold text-slate-900">{day.date}</span>
                    </div>

                    <span className="text-[11px] text-slate-600 font-mono bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {Math.round(day.dailyStudyMinutes / 60)} hrs ({day.dailyStudyMinutes} min)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {day.focusTopics.map((topic, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{topic.topic}</div>
                          <div className="text-[10px] text-slate-500 capitalize">
                            Activity: {topic.activityType.replace('_', ' ')}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-blue-700 font-bold font-mono">
                            {topic.allocatedMinutes} min
                          </span>
                          <div className="text-[10px] text-slate-500">
                            Target: {topic.targetMastery}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {day.reviewMilestone && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      Milestone: {day.reviewMilestone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
