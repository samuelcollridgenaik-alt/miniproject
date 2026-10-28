export type LLMProviderId = 'gemini' | 'groq';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  studentId?: string;
  institution?: string;
  program?: string;
  semester?: string;
  role: 'student' | 'evaluator' | 'faculty';
  createdAt: string;
  hasGeminiKey?: boolean;
  geminiKeyMasked?: string;
  hasGroqKey?: boolean;
  groqKeyMasked?: string;
  geminiApiKey?: string;
  groqApiKey?: string;
}

export interface ProviderDiagnostic {
  id: LLMProviderId;
  name: string;
  family: string;
  defaultModel: string;
  isConfigured: boolean;
  status: 'online' | 'offline' | 'unconfigured' | 'error';
  lastPingMs?: number;
  lastError?: string;
  apiKeyPresent: boolean;
  isCustomKey?: boolean;
}

export interface DocumentMeta {
  id: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'pptx' | 'txt';
  fileSizeBytes: number;
  uploadedAt: string;
  totalChunks: number;
  totalCharacters: number;
  pageOrSlideCount?: number;
}

export interface GroundedAnswerData {
  requestId: string;
  provider: LLMProviderId;
  model: string;
  latencyMs: number;
  question: string;
  answer: string;
  isSufficientlyGrounded: boolean;
  groundingConfidence: number;
  citations: {
    source: string;
    pageOrSlide?: number;
    quoteSnippet: string;
    relevanceScore: number;
  }[];
  retrievedChunksCount: number;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  topicTag: string;
  citation?: string;
}

export interface SummaryData {
  title: string;
  documentTitle: string;
  overview: string;
  coreConcepts: Array<{ concept: string; explanation: string; citation: string }>;
  formulasOrRules: string[];
  examFocusPoints: string[];
}

export interface QuizQuestionData {
  id: string;
  question: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topicTag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  citation?: string;
}

export interface TopicMasteryData {
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  masteryPercentage: number;
  classification: 'mastered' | 'moderate' | 'weak';
  recommendedAction: string;
}

export interface QuizAttemptData {
  id: string;
  quizTitle: string;
  submittedAt: string;
  totalQuestions: number;
  score: number;
  percentage: number;
  items: {
    questionId: string;
    topicTag: string;
    selectedAnswer: 'A' | 'B' | 'C' | 'D';
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
  }[];
  topicBreakdown: Record<string, { correct: number; total: number; percentage: number }>;
}

export interface ContentAuditData {
  requestId: string;
  auditorProvider: LLMProviderId;
  auditorModel: string;
  latencyMs: number;
  verdict: 'PASS' | 'FLAGGED' | 'FAIL';
  consistencyScore: number;
  unsupportedClaims: string[];
  factualDiscrepancies: string[];
  ambiguousQuestions: string[];
  recommendations: string[];
}

export interface ModelComparisonData {
  requestId: string;
  prompt: string;
  contextSummary: string;
  results: {
    provider: LLMProviderId;
    model: string;
    response: string;
    latencyMs: number;
    success: boolean;
    error?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  }[];
}

export interface StudyPlanData {
  id: string;
  createdAt: string;
  examDate: string;
  totalDays: number;
  dailyAvailableHours: number;
  totalStudyHoursAllocated: number;
  isScheduleMathematicallyFeasible: boolean;
  scheduleValidationMessage: string;
  weakTopicsTargeted: string[];
  dailySchedule: {
    dayNumber: number;
    date: string;
    dailyStudyMinutes: number;
    focusTopics: {
      topic: string;
      currentMastery: number;
      targetMastery: number;
      allocatedMinutes: number;
      activityType: 'conceptual_revision' | 'practice_problems' | 'flashcard_drill' | 'mock_quiz';
      sourceDocuments: string[];
    }[];
    reviewMilestone?: string;
  }[];
  strategicAdvice: string;
}
