/*
 * AI preferences, persisted in app_state (and so in backups). No secret is
 * ever stored here: the API key lives only in the macOS Keychain.
 *
 * The limits are DeutschLab's own safeguards, not Google's quotas. The
 * primary protection against charges is keeping the Google project on the
 * free tier (no billing account linked).
 */

import { getDatabase } from "../db";

import { DEFAULT_MODELS, isEligible, type ModelRole } from "./models";

export const SETTINGS_KEY = "ai_settings";

/** Upper bounds; the learner can only lower them. */
export const LIMITS = {
  dailyRequests: { min: 1, max: 20, default: 20 },
  tutorTurns: { min: 3, max: 15, default: 15 },
  recordingSeconds: { min: 30, max: 180, default: 180 },
} as const;

export const MAX_WRITING_WORDS = 1000;

export interface AISettings {
  enabled: boolean;
  /** When the learner agreed to the cloud privacy notice, or null. */
  consentedAt: string | null;
  models: Record<ModelRole, string>;
  dailyRequestLimit: number;
  tutorTurnLimit: number;
  maxRecordingSeconds: number;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  consentedAt: null,
  models: { ...DEFAULT_MODELS },
  dailyRequestLimit: LIMITS.dailyRequests.default,
  tutorTurnLimit: LIMITS.tutorTurns.default,
  maxRecordingSeconds: LIMITS.recordingSeconds.default,
};

const clamp = (value: unknown, range: { min: number; max: number; default: number }) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(range.max, Math.max(range.min, Math.round(value)))
    : range.default;

/** Accepts anything (an old or hand-edited value) and returns valid settings. */
export function sanitiseSettings(raw: unknown): AISettings {
  const input = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<AISettings>;
  const models = { ...DEFAULT_MODELS };

  for (const role of Object.keys(models) as ModelRole[]) {
    const chosen = input.models?.[role];
    if (typeof chosen === "string" && isEligible(role, chosen)) models[role] = chosen;
  }

  return {
    enabled: input.enabled === true,
    consentedAt:
      typeof input.consentedAt === "string" && !Number.isNaN(Date.parse(input.consentedAt))
        ? input.consentedAt
        : null,
    models,
    dailyRequestLimit: clamp(input.dailyRequestLimit, LIMITS.dailyRequests),
    tutorTurnLimit: clamp(input.tutorTurnLimit, LIMITS.tutorTurns),
    maxRecordingSeconds: clamp(input.maxRecordingSeconds, LIMITS.recordingSeconds),
  };
}

export async function loadAISettings(): Promise<AISettings> {
  const db = await getDatabase();
  const rows = await db.select<{ value: string }[]>(`SELECT value FROM app_state WHERE key = ?`, [
    SETTINGS_KEY,
  ]);

  if (rows.length === 0) return { ...DEFAULT_AI_SETTINGS, models: { ...DEFAULT_MODELS } };

  try {
    return sanitiseSettings(JSON.parse(rows[0].value));
  } catch {
    return { ...DEFAULT_AI_SETTINGS, models: { ...DEFAULT_MODELS } };
  }
}

export async function saveAISettings(next: AISettings): Promise<AISettings> {
  const clean = sanitiseSettings(next);
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO app_state (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    [SETTINGS_KEY, JSON.stringify(clean)],
  );

  return clean;
}

export async function updateAISettings(patch: Partial<AISettings>): Promise<AISettings> {
  const current = await loadAISettings();
  return saveAISettings({ ...current, ...patch, models: { ...current.models, ...patch.models } });
}
