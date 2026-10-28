import { QuizAttempt, TopicMastery } from '../types.js';
import { storage } from '../storage/db.js';

export class AnalyticsService {
  /**
   * Calculate deterministic topic mastery from persistent quiz attempts
   */
  public calculateTopicMastery(userId?: string): TopicMastery[] {
    const attempts = storage.getQuizAttempts(userId);
    if (attempts.length === 0) {
      return [];
    }

    const topicStats: Record<string, { total: number; correct: number }> = {};

    for (const attempt of attempts) {
      for (const item of attempt.items) {
        const topic = item.topicTag.trim() || 'General';
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0 };
        }
        topicStats[topic].total += 1;
        if (item.isCorrect) {
          topicStats[topic].correct += 1;
        }
      }
    }

    const masteries: TopicMastery[] = [];

    for (const [topic, stats] of Object.entries(topicStats)) {
      const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      let classification: 'mastered' | 'moderate' | 'weak' = 'moderate';
      let recommendedAction = '';

      if (percentage < 60) {
        classification = 'weak';
        recommendedAction = 'Immediate conceptual review and flashcard reinforcement required.';
      } else if (percentage < 80) {
        classification = 'moderate';
        recommendedAction = 'Targeted problem solving and spaced repetition drills.';
      } else {
        classification = 'mastered';
        recommendedAction = 'Periodic retrieval practice to maintain long-term retention.';
      }

      masteries.push({
        topic,
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        masteryPercentage: percentage,
        classification,
        recommendedAction,
      });
    }

    // Sort: weakest first for immediate study prioritization
    return masteries.sort((a, b) => a.masteryPercentage - b.masteryPercentage);
  }

  public getWeakTopics(): TopicMastery[] {
    return this.calculateTopicMastery().filter((m) => m.classification === 'weak');
  }

  public getOverallStatistics() {
    const attempts = storage.getQuizAttempts();
    const totalQuizzes = attempts.length;
    let totalQuestionsAttempted = 0;
    let totalCorrect = 0;

    for (const a of attempts) {
      totalQuestionsAttempted += a.totalQuestions;
      totalCorrect += a.score;
    }

    const overallAccuracy = totalQuestionsAttempted > 0
      ? Math.round((totalCorrect / totalQuestionsAttempted) * 100)
      : 0;

    const topicMasteries = this.calculateTopicMastery();
    const weakCount = topicMasteries.filter((t) => t.classification === 'weak').length;
    const masteredCount = topicMasteries.filter((t) => t.classification === 'mastered').length;

    return {
      totalQuizzes,
      totalQuestionsAttempted,
      totalCorrect,
      overallAccuracy,
      totalTopicsTracked: topicMasteries.length,
      weakTopicsCount: weakCount,
      masteredTopicsCount: masteredCount,
      attempts: attempts.slice(0, 10),
    };
  }
}

export const analyticsService = new AnalyticsService();
