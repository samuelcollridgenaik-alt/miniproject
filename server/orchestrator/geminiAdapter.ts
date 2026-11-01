import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { LLMProvider, LLMProviderId, LLMRequestOptions, LLMResponse } from '../types.js';
import { CONFIG } from '../config.js';
import { executionLogger } from './executionLogger.js';

export class GeminiAdapter implements LLMProvider {
  public id: LLMProviderId;
  public name: string;
  public family: string;
  public defaultModel: string;

  constructor(
    id: LLMProviderId = 'gemini',
    name = 'Google Gemini 3.8 Flash',
    family = 'Gemini 3.8',
    defaultModel = CONFIG.gemini.model
  ) {
    this.id = id;
    this.name = name;
    this.family = family;
    this.defaultModel = defaultModel;
  }

  private getClient(apiKeyOverride?: string): GoogleGenAI | null {
    const key = apiKeyOverride || CONFIG.gemini.apiKey;
    if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
      return null;
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  public isConfigured(apiKeyOverride?: string): boolean {
    const key = apiKeyOverride || CONFIG.gemini.apiKey;
    return !!key && key !== 'MY_GEMINI_API_KEY' && key.trim() !== '';
  }

  public async ping(apiKeyOverride?: string): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    const startTime = Date.now();
    if (!this.isConfigured(apiKeyOverride)) {
      return { ok: false, latencyMs: 0, message: 'Gemini API key is not configured.' };
    }

    try {
      const client = this.getClient(apiKeyOverride);
      if (!client) throw new Error('Client initialization failed');

      const config: any = {};
      if (this.defaultModel === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const pingPromise = client.models.generateContent({
        model: this.defaultModel,
        contents: 'Ping test. Reply with: PONG',
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini ping timed out after 14000ms')), 14000)
      );

      const response = await Promise.race([pingPromise, timeoutPromise]);

      const latencyMs = Date.now() - startTime;
      const text = response.text || '';
      return {
        ok: true,
        latencyMs,
        message: `Gemini reachable (${this.defaultModel}): ${text.trim().substring(0, 50)}`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        ok: false,
        latencyMs,
        message: err?.message || 'Gemini ping failed',
      };
    }
  }

  public async generate(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const requestId = options?.requestId || executionLogger.generateRequestId('gemini');

    if (!this.isConfigured(options?.apiKeyOverride)) {
      const err = 'Gemini API is unconfigured: Valid Gemini API key is missing.';
      executionLogger.log({
        taskType: 'tutor',
        provider: 'gemini',
        model: this.defaultModel,
        latencyMs: 0,
        success: false,
        promptSnippet: prompt.substring(0, 100),
        error: err,
      });
      throw new Error(err);
    }

    const client = this.getClient(options?.apiKeyOverride);
    if (!client) {
      throw new Error('Gemini client unavailable');
    }

    try {
      const config: any = {};
      if (options?.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options?.jsonMode) {
        config.responseMimeType = 'application/json';
      }
      if (this.defaultModel === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const timeoutMs = options?.timeoutMs || CONFIG.gemini.timeoutMs || 25000;
      const generatePromise = client.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini ${this.defaultModel} request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const latencyMs = Date.now() - startTime;
      const outputText = response.text || '';

      // Usage metadata if provided by SDK
      const usageMetadata = (response as any).usageMetadata;
      const usage = usageMetadata ? {
        promptTokens: usageMetadata.promptTokenCount,
        completionTokens: usageMetadata.candidatesTokenCount,
        totalTokens: usageMetadata.totalTokenCount,
      } : undefined;

      executionLogger.log({
        taskType: 'tutor',
        provider: 'gemini',
        model: this.defaultModel,
        latencyMs,
        success: true,
        promptSnippet: prompt.substring(0, 100),
        responseSnippet: outputText.substring(0, 100),
        usage,
      });

      return {
        requestId,
        provider: 'gemini',
        model: this.defaultModel,
        text: outputText,
        latencyMs,
        usage,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      executionLogger.log({
        taskType: 'tutor',
        provider: 'gemini',
        model: this.defaultModel,
        latencyMs,
        success: false,
        promptSnippet: prompt.substring(0, 100),
        error: err?.message || String(err),
      });
      throw new Error(`Gemini generation failed: ${err?.message || err}`);
    }
  }

  public async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const client = this.getClient();
      if (!client) return null;

      const embedPromise = client.models.embedContent({
        model: CONFIG.gemini.embeddingModel,
        contents: text,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Embedding timeout')), 4000)
      );

      const response = await Promise.race([embedPromise, timeoutPromise]);

      const embeddingValues = (response as any)?.embedding?.values;
      if (Array.isArray(embeddingValues) && embeddingValues.length > 0) {
        return embeddingValues;
      }
      return null;
    } catch (err) {
      console.warn('Gemini embedContent failed/timed out, using fast term vectorizer');
      return null;
    }
  }
}

export const geminiAdapter = new GeminiAdapter('gemini', 'Google Gemini 3.8 Flash', 'Gemini 3.8', CONFIG.gemini.model);
export const geminiLiteAdapter = new GeminiAdapter('gemini-lite', 'Google Gemini 3.1 Flash-Lite', 'Gemini Lite', CONFIG.geminiLite.model);

