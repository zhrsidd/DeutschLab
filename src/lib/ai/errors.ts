/*
 * Every AI failure becomes an AIError with a kind the UI can explain.
 * Native errors arrive as `{ kind, ... }` from src-tauri/src/ai.rs; the rest
 * are raised here (limits, consent, validation).
 */

export type AIErrorKind =
  // native (ai.rs)
  | "no_key"
  | "invalid_key"
  | "keychain"
  | "invalid_request"
  | "model_not_allowed"
  | "model_unavailable"
  | "rate_limited"
  | "network"
  | "timeout"
  | "server"
  | "bad_response"
  // app
  | "unavailable"
  | "disabled"
  | "consent_required"
  | "daily_limit"
  | "session_limit"
  | "too_long"
  | "too_short"
  | "invalid_output"
  | "empty_transcript"
  | "unknown";

export class AIError extends Error {
  kind: AIErrorKind;
  retryAfterSeconds: number | null;

  constructor(kind: AIErrorKind, message = "", retryAfterSeconds: number | null = null) {
    super(message || kind);
    this.name = "AIError";
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const NATIVE_KINDS = new Set<AIErrorKind>([
  "no_key",
  "invalid_key",
  "keychain",
  "invalid_request",
  "model_not_allowed",
  "model_unavailable",
  "rate_limited",
  "network",
  "timeout",
  "server",
  "bad_response",
]);

/** Converts whatever `invoke` rejected with into an AIError. */
export function toAIError(error: unknown): AIError {
  if (error instanceof AIError) return error;

  if (typeof error === "object" && error !== null && "kind" in error) {
    const raw = error as { kind: unknown; message?: unknown; retry_after_seconds?: unknown };
    const kind = typeof raw.kind === "string" && NATIVE_KINDS.has(raw.kind as AIErrorKind)
      ? (raw.kind as AIErrorKind)
      : "unknown";
    const retry = typeof raw.retry_after_seconds === "number" ? raw.retry_after_seconds : null;
    return new AIError(kind, typeof raw.message === "string" ? raw.message : "", retry);
  }

  return new AIError("unknown", error instanceof Error ? error.message : String(error));
}

export interface ErrorExplanation {
  title: string;
  detail: string;
  /** Whether trying again (unchanged) can help. */
  retryable: boolean;
  /** Where to fix it, if anywhere. */
  fixInSettings: boolean;
}

/** Words for the learner. The work they submitted is always kept. */
export function explainAIError(error: AIError): ErrorExplanation {
  switch (error.kind) {
    case "unavailable":
      return { title: "AI feedback needs the DeutschLab app", detail: "It runs through the native app, not a browser.", retryable: false, fixInSettings: false };
    case "disabled":
      return { title: "AI feedback is turned off", detail: "You can turn it on in Settings → AI feedback.", retryable: false, fixInSettings: true };
    case "consent_required":
      return { title: "Please confirm first", detail: "Read how your work is sent to Google, then confirm.", retryable: false, fixInSettings: false };
    case "no_key":
      return { title: "No Gemini API key yet", detail: "Add your key in Settings → AI feedback.", retryable: false, fixInSettings: true };
    case "invalid_key":
      return { title: "Gemini did not accept the API key", detail: "Check or replace the key in Settings → AI feedback.", retryable: false, fixInSettings: true };
    case "keychain":
      return { title: "The Keychain could not be read", detail: error.message, retryable: true, fixInSettings: true };
    case "model_not_allowed":
    case "model_unavailable":
      return { title: "That model is not available", detail: "Choose another model in Settings → AI feedback.", retryable: false, fixInSettings: true };
    case "rate_limited":
      return {
        title: "Gemini's rate limit was reached",
        detail: error.retryAfterSeconds
          ? `Google asks to wait about ${error.retryAfterSeconds} s. Your work is kept; nothing is retried automatically.`
          : "Wait a minute and try again. Daily free-tier limits reset at midnight Pacific time. Your work is kept.",
        retryable: true,
        fixInSettings: false,
      };
    case "daily_limit":
      return { title: "Today's AI request limit is used up", detail: "You set this limit in Settings. Your work is kept, and lessons work as normal.", retryable: false, fixInSettings: true };
    case "session_limit":
      return { title: "This conversation has reached its turn limit", detail: "Finish it for a summary, or start a new one.", retryable: false, fixInSettings: false };
    case "network":
      return { title: "No connection to Gemini", detail: "Check your internet connection. Your work is kept.", retryable: true, fixInSettings: false };
    case "timeout":
      return { title: "Gemini took too long to answer", detail: "Try again in a moment. Your work is kept.", retryable: true, fixInSettings: false };
    case "server":
      return { title: "Gemini had a problem", detail: "This is on Google's side. Try again later.", retryable: true, fixInSettings: false };
    case "too_long":
    case "too_short":
    case "empty_transcript":
    case "invalid_request":
      return { title: "This can't be sent as it is", detail: error.message, retryable: false, fixInSettings: false };
    case "bad_response":
    case "invalid_output":
      return {
        title: "The AI answer could not be used",
        detail: "It did not pass DeutschLab's checks, so no score was saved. You can try again.",
        retryable: true,
        fixInSettings: false,
      };
    default:
      return { title: "Something went wrong", detail: error.message, retryable: true, fixInSettings: false };
  }
}
