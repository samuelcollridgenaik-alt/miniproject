import { LLMProvider, LLMProviderId, LLMRequestOptions, LLMResponse, ProviderConfig } from '../types.js';
import { geminiAdapter } from './geminiAdapter.js';
import { groqAdapter } from './groqAdapter.js';
import { CONFIG } from '../config.js';

export type AcademicTaskType = 'tutor' | 'summary' | 'flashcards' | 'quiz' | 'review' | 'comparison' | 'planner' | 'evaluation';

export class TaskRouter {
  private providers: Record<LLMProviderId, LLMProvider> = {
    gemini: geminiAdapter,
    groq: groqAdapter,
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
        return 'gemini'; // Provider A: Gemini
      case 'summary':
      case 'flashcards':
      case 'quiz':
        return 'groq'; // Provider B: Groq Llama
      case 'planner':
        return 'gemini'; // Provider A with mathematical validator
      case 'comparison':
        return 'gemini';
      default:
        return 'gemini';
    }
  }

  public async getDiagnostics(userKeys?: { gemini?: string; groq?: string }): Promise<ProviderConfig[]> {
    const providerIds: LLMProviderId[] = ['gemini', 'groq'];
    const results: ProviderConfig[] = [];

    for (const id of providerIds) {
      const p = this.providers[id];
      const customKey = userKeys?.[id];
      const effectiveKey = customKey || (id === 'gemini' ? CONFIG.gemini.apiKey : CONFIG.groq.apiKey);
      const isConfigured = p.isConfigured(effectiveKey);

      if (!isConfigured) {
        results.push({
          id,
          name: p.name,
          family: p.family,
          defaultModel: p.defaultModel,
          isConfigured: false,
          status: 'unconfigured',
          apiKeyPresent: false,
          isCustomKey: !!customKey,
          lastError: customKey ? 'Custom key provided is invalid' : 'API key not configured in environment',
        });
        continue;
      }

      // Ping to verify connectivity with effective key
      const pingRes = await p.ping(effectiveKey);
      results.push({
        id,
        name: p.name,
        family: p.family,
        defaultModel: p.defaultModel,
        isConfigured: true,
        status: pingRes.ok ? 'online' : 'error',
        lastPingMs: pingRes.latencyMs,
        lastError: pingRes.ok ? undefined : pingRes.message,
        apiKeyPresent: true,
        isCustomKey: !!customKey,
      });
    }

    return results;
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
      const candidates: LLMProviderId[] = (['gemini', 'groq'] as LLMProviderId[]).filter(
        (id) => id !== preferredId && this.providers[id].isConfigured()
      );

      if (candidates.length === 0) {
        throw new Error(
          `Provider '${preferredId}' failed (${primaryErr.message}), and no alternate providers are configured to handle task '${task}'.`
        );
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

      throw new Error(
        `Task '${task}' failed on primary provider '${preferredId}' (${primaryErr.message}) and all fallback attempts failed.`
      );
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
