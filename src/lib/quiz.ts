import type { QuizAttemptData, QuizQuestionData } from "../types.js";
export function scorePracticeQuiz(
  questions: QuizQuestionData[],
  answers: Record<string, "A" | "B" | "C" | "D">,
): QuizAttemptData {
  const topicBreakdown: QuizAttemptData["topicBreakdown"] = {};
  const items = questions.map((q) => {
    const correct = answers[q.id] === q.correctAnswer;
    const topic = q.topicTag || "General";
    const stat = (topicBreakdown[topic] ??= {
      correct: 0,
      total: 0,
      percentage: 0,
    });
    stat.total++;
    if (correct) stat.correct++;
    return {
      questionId: q.id,
      topicTag: topic,
      selectedAnswer: answers[q.id],
      correctAnswer: q.correctAnswer,
      isCorrect: correct,
    };
  });
  for (const stat of Object.values(topicBreakdown))
    stat.percentage = Math.round((stat.correct / stat.total) * 100);
  const score = items.filter((i) => i.isCorrect).length;
  return {
    id: `local_attempt_${crypto.randomUUID()}`,
    quizTitle: "Practice assessment",
    submittedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    score,
    percentage: questions.length
      ? Math.round((score / questions.length) * 100)
      : 0,
    items,
    topicBreakdown,
  };
}
