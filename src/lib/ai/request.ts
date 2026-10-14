/*
 * The one way a request reaches the provider. Before anything is sent it
 * checks that AI is enabled, the privacy notice was accepted and today's
 * local request limit is not used up. Every request that was actually sent
 * is logged (with token counts when the provider reports them), whatever
 * the outcome. Nothing is retried automatically, and no other provider or
 * model is ever tried in its place.
 */

import { AIError, toAIError } from "./errors";
import { nativeAIAvailable } from "./native";
import { loadAISettings, type AISettings } from "./settings";
import { countRequestsToday, recordUsage, type UsageOutcome } from "./store";
import type { AIFeature, ProviderResult } from "./types";

/** Errors raised before the request left the Mac: they don't count as usage. */
const NOT_SENT = new Set(["no_key", "keychain", "model_not_allowed", "unavailable"]);

export async function checkCanSend(settings: AISettings, now = new Date()): Promise<void> {
  if (!nativeAIAvailable()) throw new AIError("unavailable");
  if (!settings.enabled) throw new AIError("disabled");
  if (!settings.consentedAt) throw new AIError("consent_required");

  const used = await countRequestsToday(now);
  if (used >= settings.dailyRequestLimit) {
    throw new AIError("daily_limit", `You have used ${used} of ${settings.dailyRequestLimit} AI requests today.`);
  }
}

export async function runAIRequest<T>(input: {
  feature: AIFeature;
  model: string;
  send: () => Promise<ProviderResult>;
  /** Turns the raw result into validated data; throwing marks the output invalid. */
  validate: (result: ProviderResult) => T;
  settings?: AISettings;
}): Promise<{ value: T; result: ProviderResult }> {
  const settings = input.settings ?? (await loadAISettings());
  await checkCanSend(settings);

  let result: ProviderResult;
  try {
    result = await input.send();
  } catch (raw) {
    const error = toAIError(raw);
    if (!NOT_SENT.has(error.kind)) {
      await log(input, error.kind === "rate_limited" ? "rate_limited" : "error", null, error.kind);
    }
    throw error;
  }

  try {
    const value = input.validate(result);
    await log(input, "ok", result);
    return { value, result };
  } catch (raw) {
    const error = raw instanceof AIError ? raw : new AIError("invalid_output", String(raw));
    await log(input, "invalid_output", result, error.kind);
    throw error;
  }
}

async function log(
  input: { feature: AIFeature; model: string },
  outcome: UsageOutcome,
  result: ProviderResult | null,
  errorKind: string | null = null,
) {
  try {
    await recordUsage({
      feature: input.feature,
      model: input.model,
      outcome,
      errorKind,
      inputTokens: result?.inputTokens ?? null,
      outputTokens: result?.outputTokens ?? null,
    });
  } catch (error) {
    // Usage logging must never break the feature itself.
    console.error("Failed to record AI usage:", error);
  }
}
