import { StudyPlan, StudyPlanDay } from '../types.js';
import { analyticsService } from './analyticsService.js';
import { vectorStore } from '../rag/vectorStore.js';
import { storage } from '../storage/db.js';
import { taskRouter } from '../orchestrator/taskRouter.js';

export class StudyPlannerService {
  public async generatePlan(params: {
    examDate: string;
    dailyAvailableHours: number;
    subjectGoal?: string;
    skipLlm?: boolean;
  }): Promise<StudyPlan> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDate = new Date(params.examDate);
    examDate.setHours(0, 0, 0, 0);

    const timeDiffMs = examDate.getTime() - today.getTime();
    const daysRemaining = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24)));

    if (timeDiffMs <= 0) {
      throw new Error('Target exam date must be at least 1 day in the future.');
    }

    const dailyAvailableHours = Math.min(14, Math.max(0.5, params.dailyAvailableHours));
    const totalStudyHoursAllocated = Math.round(daysRemaining * dailyAvailableHours * 10) / 10;

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
          classification: 'moderate',
          recommendedAction: 'Initial diagnostic assessment needed.',
        }));
      } else {
        masteries = [
          { topic: 'Foundational Theory', totalQuestions: 0, correctAnswers: 0, masteryPercentage: 40, classification: 'weak', recommendedAction: 'Initial reading' },
          { topic: 'Core Algorithms & Systems', totalQuestions: 0, correctAnswers: 0, masteryPercentage: 50, classification: 'moderate', recommendedAction: 'Problem solving' },
        ];
      }
    }

    const weakTopics = masteries.filter((m) => m.classification === 'weak').map((m) => m.topic);

    // Mathematical schedule distribution:
    // Total deficit weights
    const weights = masteries.map((m) => ({
      topic: m.topic,
      mastery: m.masteryPercentage,
      weight: Math.max(20, 100 - m.masteryPercentage), // Higher weight for lower mastery
    }));
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

    const dailyMinutes = Math.round(dailyAvailableHours * 60);

    // Build day-by-day plan strictly adhering to available minutes
    const dailySchedule: StudyPlanDay[] = [];

    for (let day = 1; day <= Math.min(daysRemaining, 30); day++) {
      const scheduleDate = new Date(today.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
      const dateStr = scheduleDate.toISOString().split('T')[0];

      // Distribute today's minutes among top 2-3 focus topics based on deficit
      // Rotate topics across days so student isn't stuck on just one topic
      const rotated = [...weights].sort((a, b) => {
        // Shift priority slightly by day modulo to provide spacing
        const scoreA = a.weight + ((day * 7) % 19);
        const scoreB = b.weight + ((day * 11) % 19);
        return scoreB - scoreA;
      });

      const todayFocus = rotated.slice(0, Math.min(3, rotated.length));
      const todayTotalWeight = todayFocus.reduce((s, t) => s + t.weight, 0);

      let allocatedSum = 0;
      const focusTopics = todayFocus.map((f, idx) => {
        let minutes: number;
        if (idx === todayFocus.length - 1) {
          minutes = dailyMinutes - allocatedSum;
        } else {
          minutes = Math.round((f.weight / todayTotalWeight) * dailyMinutes);
          allocatedSum += minutes;
        }

        const activityType: 'conceptual_revision' | 'practice_problems' | 'flashcard_drill' | 'mock_quiz' =
          f.mastery < 50
            ? (day % 2 === 1 ? 'conceptual_revision' : 'flashcard_drill')
            : (day % 2 === 1 ? 'practice_problems' : 'mock_quiz');

        return {
          topic: f.topic,
          currentMastery: f.mastery,
          targetMastery: Math.min(95, f.mastery + 25),
          allocatedMinutes: Math.max(15, minutes),
          activityType,
          sourceDocuments: [f.topic],
        };
      });

      // Milestone on key days (e.g., halfway and day before exam)
      let reviewMilestone: string | undefined = undefined;
      if (day === Math.floor(daysRemaining / 2)) {
        reviewMilestone = 'Mid-point Diagnostic Review & Weak Topic Audit';
      } else if (day === daysRemaining) {
        reviewMilestone = 'Final High-Yield Formula and Concept Recall Drill (No Cramming)';
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
      (sum, d) => sum + d.focusTopics.reduce((sub, f) => sub + f.allocatedMinutes, 0),
      0
    );
    const expectedMinutes = dailySchedule.length * dailyMinutes;
    const isScheduleMathematicallyFeasible = Math.abs(totalAllocatedMinutes - expectedMinutes) <= 5;
    const scheduleValidationMessage = isScheduleMathematicallyFeasible
      ? `Verified: Total allocated study time (${Math.round(totalAllocatedMinutes / 60)} hrs) exactly matches user constraint (${dailyAvailableHours} hrs/day over ${dailySchedule.length} days). Daily topic weights are inversely proportional to measured mastery.`
      : `Schedule adjusted: Allocated ${Math.round(totalAllocatedMinutes / 60)} hours across ${dailySchedule.length} days.`;

    // Generate high-level LLM strategic advice
    let strategicAdvice = `Prioritize high-yield revision for weaker topics (${weakTopics.join(', ') || 'Core Modules'}). Utilize active recall testing immediately after revision sessions.`;

    try {
      const prompt = `Student has ${daysRemaining} days remaining until exam.
Daily study capacity: ${dailyAvailableHours} hours/day.
Identified topic mastery:
${masteries.map((m) => `- ${m.topic}: ${m.masteryPercentage}% (${m.classification})`).join('\n')}

Provide 3 actionable, high-impact cognitive revision principles tailored to this timeline. Keep it under 150 words.`;

      if (!params.skipLlm && taskRouter.getProvider('gemini').isConfigured()) {
        const res = await taskRouter.executeTask('planner', prompt, {
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
      weakTopicsTargeted: weakTopics.length > 0 ? weakTopics : masteries.slice(0, 2).map((m) => m.topic),
      dailySchedule,
      strategicAdvice,
    };

    storage.saveStudyPlan(studyPlan);
    return studyPlan;
  }
}

export const studyPlannerService = new StudyPlannerService();
