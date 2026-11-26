/** Per-request guardrails. These do not replace provider-side spending limits. */
export const MAX_PROMPT_CHARACTERS = 24000;
export const MAX_OUTPUT_TOKENS = 2048;

export function checkedOutputLimit(prompt: string, systemInstruction?: string, requested?: number): number {
  if (prompt.length + (systemInstruction?.length || 0) > MAX_PROMPT_CHARACTERS) {
    throw new Error('The request is too long. Shorten the question or source material and try again.');
  }
  return Number.isFinite(requested) && requested! > 0 ? Math.min(Math.floor(requested!), MAX_OUTPUT_TOKENS) : MAX_OUTPUT_TOKENS;
}
