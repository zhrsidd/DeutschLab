import { useEffect, useState, type ReactNode } from "react";

import { explainAIError, type AIError } from "../../lib/ai/errors";
import type { AIStatus } from "./useAIStatus";

/*
 * Shared pieces for the AI examiner and tutor. Schwarzrot rules apply: AI
 * actions are secondary buttons (a lesson's primary action stays the one
 * crimson button), errors use the error tint, nothing animates while the
 * learner is writing or speaking.
 */

export const secondaryButton =
  "dl-press inline-flex items-center justify-center gap-2 rounded-md border border-line-strong bg-elevated px-4 py-2.5 text-sm font-medium text-fg transition enabled:hover:border-accent disabled:cursor-not-allowed disabled:opacity-40";

export const primaryButton =
  "dl-press inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition enabled:hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40";

export const tertiaryButton =
  "dl-press text-sm text-fg-2 underline underline-offset-4 transition enabled:hover:text-fg disabled:opacity-40";

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">{children}</p>;
}

/** Explains why AI is not offered here, quietly, without blocking the lesson. */
export function AIStatusNote({ status }: { status: AIStatus }) {
  let text: string | null = null;

  if (!status.native) text = "AI feedback is available in the DeutschLab app.";
  else if (!status.checked) text = null;
  else if (!status.settings?.enabled) text = "Optional AI feedback is off. You can turn it on in Settings → AI feedback.";
  else if (!status.keyStored) text = "Add your Gemini API key in Settings → AI feedback to use it.";

  return text ? <p className="text-sm leading-6 text-fg-3">{text}</p> : null;
}

/** Shown once, before the first cloud request. */
export function ConsentNotice({
  audio = false,
  onAccept,
  onCancel,
}: {
  audio?: boolean;
  onAccept: () => void;
  onCancel: () => void;
}) {
  return (
    <div role="region" aria-label="Before you send" className="dl-feedback mt-4 rounded-lg border border-line bg-elevated p-5">
      <Kicker>Before you send</Kicker>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-fg-2">
        <li>What you submit{audio ? ", including your audio recording," : ""} is sent to Google's Gemini API with a short summary of the lessons you have reached. Nothing else from your records is sent.</li>
        <li>On Google's free tier, Google may use submitted content to improve its products. Don't include personal details you wouldn't want shared.</li>
        <li>DeutschLab asks Google not to store the request for later retrieval, but it cannot delete anything from Google's systems.</li>
        <li>Lessons, checkpoints and Review work without AI. AI feedback is advisory and never changes your scores or progress.</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onAccept} className={secondaryButton}>
          I understand, continue
        </button>
        <button type="button" onClick={onCancel} className={tertiaryButton}>
          Not now
        </button>
      </div>
    </div>
  );
}

/** A recoverable error with an optional, learner-triggered retry. */
export function AIErrorPanel({ error, onRetry }: { error: AIError; onRetry?: () => void }) {
  const explanation = explainAIError(error);
  const [wait, setWait] = useState(error.retryAfterSeconds ?? 0);

  useEffect(() => {
    setWait(error.retryAfterSeconds ?? 0);
  }, [error]);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  return (
    <div role="alert" className="mt-4 rounded-md border border-error/20 bg-error-soft px-5 py-4 text-sm leading-6 text-error">
      <p className="font-semibold">{explanation.title}</p>
      {explanation.detail ? <p className="mt-1">{explanation.detail}</p> : null}
      {explanation.retryable && onRetry ? (
        <button type="button" onClick={onRetry} disabled={wait > 0} className="dl-press mt-3 rounded-md border border-error/40 px-3 py-1.5 font-medium text-error enabled:hover:bg-error/10 disabled:opacity-50">
          {wait > 0 ? `Try again in ${wait} s` : "Try again"}
        </button>
      ) : null}
    </div>
  );
}
