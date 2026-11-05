import { allocateStudyMinutes, planCalendar } from "./planningMath.js";
import { StudyPlan, StudyPlanDay } from "../types.js";
import { analyticsService } from "./analyticsService.js";
import { vectorStore } from "../rag/vectorStore.js";
import { storage } from "../storage/db.js";
import { taskRouter } from "../orchestrator/taskRouter.js";

export class StudyPlannerService {
  public async generatePlan(params: {
    examDate: string;
    timeZone?: string;
    dailyAvailableHours: number;
    subjectGoal?: string;
    skipLlm?: boolean;
  }): Promise<StudyPlan> {
    const { daysRemaining, dates } = planCalendar(
      params.examDate,
      new Date(),
      params.timeZone,
    );
    if (!Number.isFinite(params.dailyAvailableHours))
      throw new Error("Daily study hours must be a number.");
    const dailyAvailableHours = Math.min(
      14,
      Math.max(0.5, params.dailyAvailableHours),
    );
    const totalStudyHoursAllocated =
      Math.round(
        ((dates.length * Math.round(dailyAvailableHours * 60)) / 60) * 10,
      ) / 10;

    // Retrieve topic masteries from quiz attempts
    let masteries = analyticsService.calculateTopicMastery();

    // If no quizzes taken yet, extract topics from uploaded documents
    if (masteries.length === 0) {
      const allChunks = vectorStore.getAllChunks();
      const docs = Array.from(new Set(allChunks.map((c) => c.documentTitle)));
      if (docs.length > 0) {
        masteries = docs.map((doc, idx) => ({
          topic: doc,
          totalQuestions: 0,
          correctAnswers: 0,
          masteryPercentage: 50, // Baseline unassessed
          classification: "moderate",
          recommendedAction: "Initial diagnostic assessment needed.",
        }));
      } else {
        masteries = [
          {
            topic: "Foundational Theory",
            totalQuestions: 0,
            correctAnswers: 0,
            masteryPercentage: 40,
            classification: "weak",
            recommendedAction: "Initial reading",
          },
          {
            topic: "Core Algorithms & Systems",
            totalQuestions: 0,
            correctAnswers: 0,
            masteryPercentage: 50,
            classification: "moderate",
            recommendedAction: "Problem solving",
          },
        ];
      }
    }

    const weakTopics = masteries
      .filter((m) => m.classification === "weak")
      .map((m) => m.topic);

    // Mathematical schedule distribution:
    // Total deficit weights
    const weights = masteries.map((m) => ({
      topic: m.topic,
      mastery: m.masteryPercentage,
      weight: Math.max(20, 100 - m.masteryPercentage), // Higher weight for lower mastery
    }));

    const dailyMinutes = Math.round(dailyAvailableHours * 60);

    // Build day-by-day plan strictly adhering to available minutes
    const dailySchedule: StudyPlanDay[] = [];

    for (let day = 1; day <= Math.min(daysRemaining, 30); day++) {
      const dateStr = dates[day - 1];

      // Distribute today's minutes among top 2-3 focus topics based on deficit
      // Rotate topics across days so student isn't stuck on just one topic
      const rotated = [...weights].sort((a, b) => {
        // Shift priority slightly by day modulo to provide spacing
        const scoreA = a.weight + ((day * 7) % 19);
        const scoreB = b.weight + ((day * 11) % 19);
        return scoreB - scoreA;
      });

      const todayFocus = rotated.slice(0, Math.min(3, rotated.length));

      const allocations = allocateStudyMinutes(
        dailyMinutes,
        todayFocus.map((topic) => topic.weight),
      );
      const focusTopics = todayFocus.map((f, idx) => {
        const minutes = allocations[idx];
        const activityType:
          | "conceptual_revision"
          | "practice_problems"
          | "flashcard_drill"
          | "mock_quiz" =
          f.mastery < 50
            ? day % 2 === 1
              ? "conceptual_revision"
              : "flashcard_drill"
            : day % 2 === 1
              ? "practice_problems"
              : "mock_quiz";

        return {
          topic: f.topic,
          currentMastery: f.mastery,
          targetMastery: Math.min(95, f.mastery + 25),
          allocatedMinutes: minutes,
          activityType,
          sourceDocuments: [f.topic],
        };
      });

      // Milestone on key days (e.g., halfway and day before exam)
      let reviewMilestone: string | undefined = undefined;
      if (day === Math.floor(daysRemaining / 2)) {
        reviewMilestone = "Mid-point Diagnostic Review & Weak Topic Audit";
      } else if (day === daysRemaining) {
        reviewMilestone =
          "Final High-Yield Formula and Concept Recall Drill (No Cramming)";
      }

      dailySchedule.push({
        dayNumber: day,
        date: dateStr,
        dailyStudyMinutes: dailyMinutes,
        focusTopics,
        reviewMilestone,
      });
    }

    // Mathematical feasibility validation
    const totalAllocatedMinutes = dailySchedule.reduce(
      (sum, d) =>
        sum + d.focusTopics.reduce((sub, f) => sub + f.allocatedMinutes, 0),
      0,
    );
    const expectedMinutes = dailySchedule.length * dailyMinutes;
    const isScheduleMathematicallyFeasible =
      totalAllocatedMinutes === expectedMinutes;
    const scheduleValidationMessage = isScheduleMathematicallyFeasible
      ? `Daily topic allocations match the ${dailyMinutes}-minute budget across ${dailySchedule.length} days. Topic weights use recorded mastery where available, otherwise unassessed baseline values.`
      : `Schedule adjusted: Allocated ${Math.round(totalAllocatedMinutes / 60)} hours across ${dailySchedule.length} days.`;

    // Generate high-level LLM strategic advice
    const goal = typeof params.subjectGoal === 'string' && params.subjectGoal.trim() ? params.subjectGoal.trim() : 'your available course material';
    let strategicAdvice = `For ${goal}, prioritize high-yield revision for weaker topics (${weakTopics.join(", ") || "Core Modules"}). Utilize active recall testing immediately after revision sessions.`;

    try {
      const prompt = `Student revision goal: ${goal}.
Student has ${daysRemaining} days remaining until exam.
Daily study capacity: ${dailyAvailableHours} hours/day.
Identified topic mastery:
${masteries.map((m) => `- ${m.topic}: ${m.masteryPercentage}% (${m.classification})`).join("\n")}

Provide 3 actionable, high-impact cognitive revision principles tailored to this timeline. Keep it under 150 words.`;

      if (!params.skipLlm && taskRouter.getProvider("gemini").isConfigured()) {
        const res = await taskRouter.executeTask("planner", prompt, {
          temperature: 0.3,
          maxTokens: 250,
          timeoutMs: 4000,
          allowFallback: false,
        });
        strategicAdvice = res.text.trim();
      }
    } catch (e) {
      // Keep deterministic default
    }

    const studyPlan: StudyPlan = {
      id: `plan_${Date.now()}`,
      createdAt: new Date().toISOString(),
      examDate: params.examDate,
      totalDays: daysRemaining,
      dailyAvailableHours,
      totalStudyHoursAllocated,
      isScheduleMathematicallyFeasible,
      scheduleValidationMessage,
      weakTopicsTargeted:
        weakTopics.length > 0
          ? weakTopics
          : masteries.slice(0, 2).map((m) => m.topic),
      dailySchedule,
      strategicAdvice,
    };

    storage.saveStudyPlan(studyPlan);
    return studyPlan;
  }
}

export const studyPlannerService = new StudyPlannerService();
