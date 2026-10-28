import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  // Model Providers
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    embeddingModel: 'gemini-embedding-2-preview',
    timeoutMs: 25000,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    fallbackModel: 'llama-3.1-8b-instant',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    timeoutMs: 20000,
  },

  // RAG Ingestion & Chunking
  rag: {
    chunkSize: 600, // characters
    chunkOverlap: 120, // characters
    minSimilarityThreshold: 0.20,
    topK: 4,
  },

  // System
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    maxRetries: 2,
    retryDelayMs: 1000,
  },

  // Python FastAPI Microservice (Vercel Service Binding)
  pythonBackend: {
    url: process.env.BACKEND_PYTHON_URL || 'http://localhost:8000',
  },
};
