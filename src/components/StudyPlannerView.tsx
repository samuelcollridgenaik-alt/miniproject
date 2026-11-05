import { PageHeading } from "./ui/Primitives.js";
import React, { useState } from "react";
import { StudyPlanData } from "../types.js";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  ChevronDown,
  Award,
} from "lucide-react";

export const StudyPlannerView: React.FC = () => {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 10);
  const defaultDateStr = defaultDate.toLocaleDateString("en-CA");

  const [examDate, setExamDate] = useState<string>(defaultDateStr);
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [subjectGoal, setSubjectGoal] = useState<string>(
    "Master MCA Core Curriculum & Distributed Algorithms",
  );
  const [loading, setLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlanData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (
      !examDate ||
      examDate <= new Date().toLocaleDateString("en-CA") ||
      !Number.isFinite(dailyHours) ||
      dailyHours < 0.5 ||
      dailyHours > 12 ||
      !subjectGoal.trim()
    ) {
      setError(
        "Choose a future exam date, a course focus, and between 0.5 and 12 study hours per day.",
      );
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/study-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examDate,
          dailyAvailableHours: dailyHours,
          subjectGoal,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setStudyPlan(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to generate study plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-page">
      {/* Top Banner and Form (Google Calendar Style) */}
      <div className="bg-surface rounded-xl border border-default p-6 ">
        <PageHeading
          icon={Calendar}
          title={<> Exam Revision Planner </>}
          description={
            <>
              {" "}
              Synthesizes daily study allocations targeting measured weak areas
              with strict mathematical feasibility checks.{" "}
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Target Exam Date
            </label>
            <input
              aria-label="Target Exam Date"
              type="date"
              min={new Date(Date.now() + 86400000).toLocaleDateString("en-CA")}
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="ui-field w-full bg-subtle border border-default rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-accent font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Daily Study Capacity (Hours)
            </label>
            <input
              aria-label="Daily Study Capacity (Hours)"
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              value={Number.isNaN(dailyHours) ? "" : dailyHours}
              onChange={(e) =>
                setDailyHours(
                  e.target.value === "" ? Number.NaN : Number(e.target.value),
                )
              }
              className="ui-field w-full bg-subtle border border-default rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-accent font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Course Focus
            </label>
            <input
              aria-label="Course Focus"
              type="text"
              value={subjectGoal}
              onChange={(e) => setSubjectGoal(e.target.value)}
              placeholder="e.g. MCA Operating Systems & Databases"
              className="ui-field w-full bg-subtle border border-default rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-accent font-medium"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="ui-control px-5 py-2.5 bg-accent-solid hover:bg-accent-hover disabled:bg-elevated text-on-accent font-semibold text-xs rounded-full flex items-center gap-2 transition"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-default border-t-transparent rounded-full animate-spin" />
                <span>Computing Schedule...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate study schedule</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 p-3 bg-danger-soft border border-danger text-xs text-danger rounded-2xl"
          >
            {error}
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        When no assessment history is available, planning uses unassessed topic
        weights rather than measured mastery.
      </p>
      {studyPlan && studyPlan.dailySchedule.length < studyPlan.totalDays && (
        <p role="status" className="ui-status ui-status-info">
          Showing the first {studyPlan.dailySchedule.length} of{" "}
          {studyPlan.totalDays} days. Allocated hours cover only the displayed
          schedule.
        </p>
      )}
      {/* PLAN OUTPUT */}
      {studyPlan && (
        <div className="space-y-5">
          {/* Overview */}
          <div className="bg-surface rounded-xl border border-default p-8  space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-default">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft px-3 py-1 rounded-full">
                  Targeted Revision Calendar
                </span>
                <h2 className="text-xl font-bold text-primary mt-2">
                  {studyPlan.totalDays} Days until Exam (
                  {studyPlan.totalStudyHoursAllocated} Total Study Hours)
                </h2>
              </div>

              <div>
                {studyPlan.isScheduleMathematicallyFeasible ? (
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-success-soft border border-success text-success text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Mathematically Feasible
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-warning-soft border border-warning text-warning text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    Schedule Adjusted
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-success font-mono bg-success-soft p-3 rounded-2xl border border-success">
              {studyPlan.scheduleValidationMessage}
            </p>

            <div className="p-4 rounded-2xl bg-subtle border border-default">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-warning" /> Cognitive
                Strategy
              </h3>
              <p className="text-xs text-secondary leading-relaxed">
                {studyPlan.strategicAdvice}
              </p>
            </div>
          </div>

          {/* Day by Day Schedule Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>Day-by-Day Calendar Plan</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {studyPlan.dailySchedule.map((day) => (
                <div
                  key={day.dayNumber}
                  className="bg-surface rounded-xl border border-default p-5  text-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-default">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-accent-soft border border-accent text-accent font-bold flex items-center justify-center text-xs">
                        D{day.dayNumber}
                      </span>
                      <span className="font-bold text-primary">{day.date}</span>
                    </div>

                    <span className="text-[11px] text-secondary font-mono bg-subtle px-2.5 py-0.5 rounded-full border border-default">
                      {(day.dailyStudyMinutes / 60).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      hrs ({day.dailyStudyMinutes} min)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {day.focusTopics.map((topic, i) => (
                      <div
                        key={i}
                        className="bg-subtle p-3 rounded-2xl border border-default flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-primary">
                            {topic.topic}
                          </div>
                          <div className="text-[10px] text-muted capitalize">
                            Activity: {topic.activityType.replace("_", " ")}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-accent font-bold font-mono">
                            {topic.allocatedMinutes} min
                          </span>
                          <div className="text-[10px] text-muted">
                            Target: {topic.targetMastery}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {day.reviewMilestone && (
                    <div className="pt-2 border-t border-default text-[11px] text-warning font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-warning" />
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
