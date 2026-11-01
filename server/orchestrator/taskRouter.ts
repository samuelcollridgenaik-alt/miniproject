import { LLMProvider, LLMProviderId, LLMRequestOptions, LLMResponse, ProviderConfig } from '../types.js';
import { geminiAdapter, geminiLiteAdapter } from './geminiAdapter.js';
import { groqAdapter } from './groqAdapter.js';
import { cognifyCurriculumAdapter } from './cognifyCurriculumAdapter.js';
import { CONFIG } from '../config.js';

export type AcademicTaskType = 'tutor' | 'summary' | 'flashcards' | 'quiz' | 'review' | 'comparison' | 'planner' | 'evaluation';

export class TaskRouter {
  private providers: Record<LLMProviderId, LLMProvider> = {
    gemini: geminiAdapter,
    'gemini-lite': geminiLiteAdapter,
    groq: groqAdapter,
    'cognify-curriculum': cognifyCurriculumAdapter,
  };

  public getProvider(id: LLMProviderId): LLMProvider {
    const provider = this.providers[id];
    if (!provider) {
      throw new Error(`Unknown provider ID: ${id}`);
    }
    return provider;
  }

  public getPrimaryProviderForTask(task: AcademicTaskType): LLMProviderId {
    switch (task) {
      case 'tutor':
      case 'evaluation':
      case 'review':
        return 'gemini'; // Gemini 3.8 Flash
      case 'summary':
      case 'flashcards':
      case 'quiz':
        return 'gemini'; // Gemini 3.8 Flash (Structured Academic Synthesis)
      case 'planner':
        return 'gemini'; // Gemini 3.8 Flash
      case 'comparison':
        return 'gemini';
      default:
        return 'gemini';
    }
  }

  public async getDiagnostics(userKeys?: { gemini?: string; groq?: string }): Promise<ProviderConfig[]> {
    const providerIds: LLMProviderId[] = ['gemini', 'gemini-lite', 'groq', 'cognify-curriculum'];

    const promises = providerIds.map(async (id) => {
      const p = this.providers[id];
      const customKey = id === 'groq' ? userKeys?.groq : userKeys?.gemini;
      const effectiveKey = customKey || (id === 'groq' ? CONFIG.groq.apiKey : CONFIG.gemini.apiKey);
      const isConfigured = p.isConfigured(effectiveKey);

      if (!isConfigured) {
        return {
          id,
          name: p.name,
          family: p.family,
          defaultModel: p.defaultModel,
          isConfigured: false,
          status: 'unconfigured' as const,
          apiKeyPresent: false,
          isCustomKey: !!customKey,
          lastError: customKey ? 'Custom key provided is invalid' : 'API key not configured in environment',
        };
      }

      try {
        const pingPromise = p.ping(effectiveKey);
        const timeoutPromise = new Promise<{ ok: boolean; latencyMs: number; message: string }>((resolve) =>
          setTimeout(() => resolve({ ok: false, latencyMs: 3500, message: 'Ping timed out after 3500ms' }), 3500)
        );
        const pingRes = await Promise.race([pingPromise, timeoutPromise]);

        return {
          id,
          name: p.name,
          family: p.family,
          defaultModel: p.defaultModel,
          isConfigured: true,
          status: (pingRes.ok ? 'online' : 'error') as 'online' | 'error',
          lastPingMs: pingRes.latencyMs,
          lastError: pingRes.ok ? undefined : pingRes.message,
          apiKeyPresent: true,
          isCustomKey: !!customKey,
        };
      } catch (err: any) {
        return {
          id,
          name: p.name,
          family: p.family,
          defaultModel: p.defaultModel,
          isConfigured: true,
          status: 'error' as const,
          lastError: err.message,
          apiKeyPresent: true,
          isCustomKey: !!customKey,
        };
      }
    });

    return await Promise.all(promises);
  }


  /**
   * Execute with retry and fallback handling
   */
  public async executeTask(
    task: AcademicTaskType,
    prompt: string,
    options?: LLMRequestOptions & { preferredProvider?: LLMProviderId; allowFallback?: boolean }
  ): Promise<LLMResponse> {
    const preferredId = options?.preferredProvider || this.getPrimaryProviderForTask(task);
    const allowFallback = options?.allowFallback ?? true;

    // First attempt preferred provider
    try {
      return await this.executeWithRetry(preferredId, prompt, options);
    } catch (primaryErr: any) {
      console.warn(`Primary provider [${preferredId}] failed for task [${task}]:`, primaryErr.message);

      if (!allowFallback) {
        throw primaryErr;
      }

      // Determine fallback order: check configured providers
      const candidates: LLMProviderId[] = (['gemini', 'gemini-lite', 'groq'] as LLMProviderId[]).filter(
        (id) => id !== preferredId && this.providers[id].isConfigured(id === 'groq' ? undefined : (options?.apiKeyOverride || CONFIG.gemini.apiKey))
      );

      if (candidates.length === 0) {
        console.log(`[TaskRouter] Primary provider '${preferredId}' unavailable for '${task}'. Activating Cognify Curriculum Engine...`);
        return await this.providers['cognify-curriculum'].generate(prompt, options);
      }

      for (const fallbackId of candidates) {
        try {
          console.log(`Attempting fallback to provider [${fallbackId}] for task [${task}]...`);
          const response = await this.executeWithRetry(fallbackId, prompt, options);
          return {
            ...response,
            text: `[Note: Executed via fallback provider '${fallbackId}' due to primary '${preferredId}' unavailability]\n\n${response.text}`,
          };
        } catch (fallbackErr: any) {
          console.warn(`Fallback provider [${fallbackId}] also failed:`, fallbackErr.message);
        }
      }

      console.log(`[TaskRouter] All remote candidate providers failed for task '${task}'. Activating Cognify Curriculum Engine...`);
      return await this.providers['cognify-curriculum'].generate(prompt, options);
    }
  }

  private async executeWithRetry(
    providerId: LLMProviderId,
    prompt: string,
    options?: LLMRequestOptions
  ): Promise<LLMResponse> {
    const provider = this.getProvider(providerId);
    let attempt = 0;
    const maxRetries = CONFIG.server.maxRetries;

    while (attempt <= maxRetries) {
      try {
        return await provider.generate(prompt, options);
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          throw err;
        }
        const delay = CONFIG.server.retryDelayMs * Math.pow(2, attempt - 1);
        console.log(`Retry ${attempt}/${maxRetries} for ${providerId} after ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw new Error(`Exceeded max retries for provider ${providerId}`);
  }
}

export const taskRouter = new TaskRouter();
