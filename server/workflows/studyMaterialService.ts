import { QuizQuestion } from '../types.js';
import { vectorStore } from '../rag/vectorStore.js';
import { taskRouter } from '../orchestrator/taskRouter.js';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topicTag: string;
  citation?: string;
}

export interface AcademicSummary {
  title: string;
  documentTitle: string;
  overview: string;
  coreConcepts: Array<{ concept: string; explanation: string; citation: string }>;
  formulasOrRules: string[];
  examFocusPoints: string[];
}

export class StudyMaterialService {
  /**
   * Generate comprehensive academic summary using Groq/Llama
   */
  public async generateSummary(documentId: string, apiKeyOverride?: string): Promise<AcademicSummary> {
    const chunks = vectorStore.getDocumentChunks(documentId);
    if (chunks.length === 0) {
      throw new Error(`No indexed content found for document ID '${documentId}'.`);
    }

    // Take representative chunks across the document
    const sampleChunks = chunks.slice(0, 10);
    const docTitle = chunks[0].documentTitle;

    const excerpts = sampleChunks
      .map((c) => `[Page/Slide ${c.pageOrSlideNumber || c.chunkIndex + 1}]: ${c.text}`)
      .join('\n\n');

    const prompt = `You are an academic learning synthesizer. Based STRICTLY on the document excerpts below, produce an exhaustive, well-structured academic study summary.
Document Title: "${docTitle}"

EXCERPTS:
${excerpts}

Respond ONLY with valid JSON in this exact structure:
{
  "title": "Comprehensive Summary: ${docTitle}",
  "documentTitle": "${docTitle}",
  "overview": "A clear 3-4 sentence academic synopsis of the subject matter.",
  "coreConcepts": [
    {
      "concept": "Concept Name",
      "explanation": "Thorough technical explanation grounded in the text",
      "citation": "[Doc: ${docTitle}, Page/Slide X]"
    }
  ],
  "formulasOrRules": ["Rule or equation 1", "Rule or equation 2"],
  "examFocusPoints": ["High-yield exam topic 1", "High-yield exam topic 2"]
}`;

    const response = await taskRouter.executeTask('summary', prompt, {
      systemInstruction: 'You are an academic study assistant. Return ONLY valid JSON format.',
      jsonMode: true,
      preferredProvider: 'groq',
      temperature: 0.2,
      apiKeyOverride,
    });

    try {
      const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: AcademicSummary = JSON.parse(cleaned);
      return parsed;
    } catch (err: any) {
      // Fallback structured summary if parsing fails
      return {
        title: `Summary of ${docTitle}`,
        documentTitle: docTitle,
        overview: response.text.substring(0, 500),
        coreConcepts: [
          { concept: 'Key Subject Overview', explanation: response.text, citation: `[Doc: ${docTitle}]` },
        ],
        formulasOrRules: [],
        examFocusPoints: ['Review full document text and quiz topics.'],
      };
    }
  }

  /**
   * Generate flashcards using Groq/Llama
   */
  public async generateFlashcards(documentId: string, count: number = 8, apiKeyOverride?: string): Promise<Flashcard[]> {
    const chunks = vectorStore.getDocumentChunks(documentId);
    if (chunks.length === 0) {
      throw new Error(`No indexed content found for document ID '${documentId}'.`);
    }

    const sampleChunks = chunks.slice(0, 10);
    const docTitle = chunks[0].documentTitle;

    const excerpts = sampleChunks
      .map((c) => `[Location: Page/Slide ${c.pageOrSlideNumber || c.chunkIndex + 1}]: ${c.text}`)
      .join('\n\n');

    const prompt = `Create exactly ${count} high-yield academic flashcards from the course material below.
Document: "${docTitle}"

EXCERPTS:
${excerpts}

Format each card with a targeted question/prompt on the front and a concise, rigorous explanation on the back, with a relevant topic tag and authentic page citation.

Respond ONLY with valid JSON in this exact structure:
{
  "flashcards": [
    {
      "front": "What is ...?",
      "back": "Detailed definition and explanation ...",
      "topicTag": "Topic Name",
      "citation": "[Doc: ${docTitle}, Page/Slide X]"
    }
  ]
}`;

    const response = await taskRouter.executeTask('flashcards', prompt, {
      systemInstruction: 'You are a study card generator. Return valid JSON only.',
      jsonMode: true,
      preferredProvider: 'groq',
      temperature: 0.2,
      apiKeyOverride,
    });

    try {
      const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleaned);
      const cards: Flashcard[] = (data.flashcards || []).map((c: any, idx: number) => ({
        id: `card_${Date.now()}_${idx}`,
        front: c.front || 'Question',
        back: c.back || 'Answer',
        topicTag: c.topicTag || 'General',
        citation: c.citation || `[Doc: ${docTitle}]`,
      }));
      return cards;
    } catch (err: any) {
      throw new Error(`Failed to parse generated flashcards: ${err.message}`);
    }
  }

  /**
   * Generate structured quiz with schema validation
   */
  public async generateQuiz(documentId?: string, count: number = 5, apiKeyOverride?: string): Promise<QuizQuestion[]> {
    let chunks = documentId ? vectorStore.getDocumentChunks(documentId) : vectorStore.getAllChunks();
    if (chunks.length === 0) {
      throw new Error('Cannot generate quiz: No uploaded documents are currently indexed.');
    }

    const sampleChunks = chunks.slice(0, 8);
    const docTitle = chunks[0]?.documentTitle || 'Course Material';

    const excerpts = sampleChunks
      .map((c) => `[Doc: ${c.documentTitle}, Page/Slide ${c.pageOrSlideNumber || c.chunkIndex + 1}]: ${c.text}`)
      .join('\n\n');

    const prompt = `Generate an assessment quiz containing exactly ${count} multiple-choice academic questions grounded in the following course material.
Material excerpts:
${excerpts}

RULES:
1. Every question must test deep conceptual understanding or problem solving.
2. Provide exactly 4 options labeled A, B, C, D.
3. Clearly mark the single correct option ('A', 'B', 'C', or 'D').
4. Include a thorough academic explanation why that option is correct.
5. Provide a specific topic tag (e.g., "Memory Architecture", "Data Structures", "Transaction Management").
6. Set difficulty to "easy", "medium", or "hard".
7. Cite the exact source passage.

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "What is the primary function of ...?",
      "options": [
        { "key": "A", "text": "Option A explanation" },
        { "key": "B", "text": "Option B explanation" },
        { "key": "C", "text": "Option C explanation" },
        { "key": "D", "text": "Option D explanation" }
      ],
      "correctAnswer": "B",
      "explanation": "Option B is correct because ...",
      "topicTag": "Topic Name",
      "difficulty": "medium",
      "citation": "[Doc: ${docTitle}, Page/Slide 1]"
    }
  ]
}`;

    const response = await taskRouter.executeTask('quiz', prompt, {
      systemInstruction: 'You are an academic assessment engineer. Return ONLY a valid JSON object matching the requested schema.',
      jsonMode: true,
      preferredProvider: 'groq',
      temperature: 0.2,
      apiKeyOverride,
    });

    try {
      const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

      // Validate each question according to strict schema
      const validated: QuizQuestion[] = [];

      for (let i = 0; i < rawQuestions.length; i++) {
        const q = rawQuestions[i];
        if (!q.question || !Array.isArray(q.options) || q.options.length < 2) continue;

        // Ensure 4 options with keys A, B, C, D
        const formattedOptions = ['A', 'B', 'C', 'D'].map((key, optIdx) => {
          const opt = q.options[optIdx];
          const text = opt ? (typeof opt === 'string' ? opt : opt.text || `Option ${key}`) : `Option ${key}`;
          return {
            key: key as 'A' | 'B' | 'C' | 'D',
            text: text.replace(/^[A-D][.):\s]+/, '').trim(),
          };
        });

        const validAnswer = ['A', 'B', 'C', 'D'].includes(q.correctAnswer) ? q.correctAnswer : 'A';

        validated.push({
          id: `q_${Date.now()}_${i}`,
          question: q.question,
          options: formattedOptions,
          correctAnswer: validAnswer,
          explanation: q.explanation || 'Verified from course reading material.',
          topicTag: q.topicTag || 'Core Subject',
          difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium'),
          citation: q.citation || `[Doc: ${docTitle}]`,
        });
      }

      if (validated.length === 0) {
        throw new Error('Generated quiz questions failed schema validation.');
      }

      return validated;
    } catch (err: any) {
      throw new Error(`Quiz generation parsing error: ${err.message}`);
    }
  }
}

export const studyMaterialService = new StudyMaterialService();
