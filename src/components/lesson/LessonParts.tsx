import { type ReactNode } from "react";

import { ArrowLeft } from "lucide-react";

import { Wordmark } from "../shell/Brand";

/**
 * Thin lesson progress rule (DESIGN.md §12): a violet fill that springs
 * forward by transform as real work is completed. It shows progress through
 * the questions, never proficiency.
 */
export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className="h-[3px] overflow-hidden rounded-full bg-surface"
      role="progressbar"
      aria-label="Lesson progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
    >
      <div
        className="dl-progress-fill h-full rounded-full bg-accent shadow-[0_0_10px_rgb(167_139_250/0.6)]"
        style={{ transform: `scaleX(${safeValue / 100})` }}
      />
    </div>
  );
}

/** A labelled figure under a hairline rule (Swiss key–value, not a card). */
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-line-strong pt-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">
        {label}
      </p>

      <p className="tabular mt-1.5 font-display text-xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="mt-6 rounded-md border border-error/20 bg-error-soft px-5 py-4 text-left text-sm leading-6 text-error"
    >
      {children}
    </div>
  );
}

/*
 * Frame for every lesson: a quiet top bar with the way back, then the task.
 * Lessons are deliberately calmer than Home: no editorial decoration here.
 */
export function LessonShell({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-canvas/90 px-5 py-3.5 backdrop-blur-md md:px-8">
        <button
          type="button"
          onClick={onBack}
          className="dl-press -ml-2 flex items-center gap-2 rounded-md px-2 py-1 text-sm text-fg-2 hover:text-fg"
        >
          <ArrowLeft size={16} />
          Back to today
        </button>

        <span aria-hidden="true" className="text-sm text-fg-3">
          <Wordmark />
        </span>
      </header>

      <main className="dl-enter">{children}</main>
    </div>
  );
}
