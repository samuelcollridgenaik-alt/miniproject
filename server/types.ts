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
  password?: string;
  geminiApiKey?: string;
  groqApiKey?: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}

export interface ProviderConfig {
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

export interface LLMRequestOptions {
  requestId?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  jsonMode?: boolean;
  timeoutMs?: number;
  apiKeyOverride?: string;
}

export interface LLMUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface LLMResponse {
  requestId: string;
  provider: LLMProviderId;
  model: string;
  text: string;
  latencyMs: number;
  usage?: LLMUsage;
  cached?: boolean;
}

export interface LLMProvider {
  id: LLMProviderId;
  name: string;
  family: string;
  defaultModel: string;
  isConfigured(apiKeyOverride?: string): boolean;
  ping(apiKeyOverride?: string): Promise<{ ok: boolean; latencyMs: number; message?: string }>;
  generate(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse>;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  taskType: 'tutor' | 'summary' | 'flashcards' | 'quiz' | 'review' | 'comparison' | 'planner' | 'evaluation' | 'ping';
  provider: LLMProviderId;
  model: string;
  latencyMs: number;
  success: boolean;
  promptSnippet: string;
  responseSnippet?: string;
  error?: string;
  usage?: LLMUsage;
}

export interface DocumentMetadata {
  id: string;
  userId?: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'pptx' | 'txt';
  fileSizeBytes: number;
  uploadedAt: string;
  totalChunks: number;
  totalCharacters: number;
  pageOrSlideCount?: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  text: string;
  pageOrSlideNumber?: number;
  sectionHeader?: string;
  characterCount: number;
  embedding?: number[];
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  similarityScore: number;
  citation: string;
}

export interface GroundedAnswer {
  requestId: string;
  provider: LLMProviderId;
  model: string;
  latencyMs: number;
  question: string;
  answer: string;
  isSufficientlyGrounded: boolean;
  groundingConfidence: number; // 0.0 to 1.0
  citations: {
    source: string;
    pageOrSlide?: number;
    quoteSnippet: string;
    relevanceScore: number;
  }[];
  retrievedChunksCount: number;
  usage?: LLMUsage;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topicTag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  citation?: string;
}

export interface QuizAttemptItem {
  questionId: string;
  topicTag: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  userId?: string;
  quizTitle: string;
  documentId?: string;
  submittedAt: string;
  totalQuestions: number;
  score: number;
  percentage: number;
  items: QuizAttemptItem[];
  topicBreakdown: Record<string, { correct: number; total: number; percentage: number }>;
}

export interface TopicMastery {
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  masteryPercentage: number;
  classification: 'mastered' | 'moderate' | 'weak';
  recommendedAction: string;
}

export interface ContentAuditReview {
  requestId: string;
  auditorProvider: LLMProviderId;
  auditorModel: string;
  latencyMs: number;
  verdict: 'PASS' | 'FLAGGED' | 'FAIL';
  consistencyScore: number; // 0 to 100
  unsupportedClaims: string[];
  factualDiscrepancies: string[];
  ambiguousQuestions: string[];
  recommendations: string[];
}

export interface ModelComparisonResult {
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
    usage?: LLMUsage;
  }[];
}

export interface StudyPlanDay {
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
}

export interface StudyPlan {
  id: string;
  userId?: string;
  createdAt: string;
  examDate: string;
  totalDays: number;
  dailyAvailableHours: number;
  totalStudyHoursAllocated: number;
  isScheduleMathematicallyFeasible: boolean;
  scheduleValidationMessage: string;
  weakTopicsTargeted: string[];
  dailySchedule: StudyPlanDay[];
  strategicAdvice: string;
}

export interface EvaluationBenchmarkItem {
  id: string;
  question: string;
  referencePassage: string;
  sourceDoc: string;
  referenceAnswer: string;
  referenceTopic: string;
}

export interface BenchmarkMetrics {
  totalEvaluated: number;
  recallAt1: number;
  recallAt3: number;
  averageLatencyMs: Record<LLMProviderId, number>;
  faithfulnessRate: number; // % grounded without hallucination
  citationAccuracyRate: number; // % verified citation matches
  providerFailureRate: Record<LLMProviderId, number>;
  timestamp: string;
}
