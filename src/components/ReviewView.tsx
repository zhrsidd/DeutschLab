import { useCallback, useEffect, useState } from "react";

import { Check, Eye, RotateCcw, Volume2 } from "lucide-react";

import type {
  MistakeRow,
  ReviewItem,
  ReviewStats,
} from "../data/reviewTypes";

import { useGermanSpeech } from "../hooks/useGermanSpeech";

import {
  applyReviewResult,
  getDueReviewItems,
  getMistakes,
  getReviewStats,
} from "../lib/db";

import { ErrorMessage, ProgressBar } from "./lesson/LessonParts";
import { shuffleArray } from "./lesson/shuffle";

interface ReviewViewProps {
  /** Lets the app refresh its due-count after reviews change. */
  onChange: () => void;
}

const sourceLabel: Record<string, string> = {
  vocabulary: "Vocabulary",
  pronunciation: "Pronunciation",
  grammar: "Grammar",
  listening: "Listening",
};

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ReviewView({ onChange }: ReviewViewProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [mistakes, setMistakes] = useState<MistakeRow[]>([]);
  const [session, setSession] = useState<ReviewItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextStats, nextMistakes] = await Promise.all([
        getReviewStats(),
        getMistakes(),
      ]);

      setStats(nextStats);
      setMistakes(nextMistakes);
    } catch (loadError) {
      console.error("Failed to load review data:", loadError);
      setError("Review data could not be loaded.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startSession = async () => {
    try {
      setError(null);
      const due = await getDueReviewItems();
      setSession(shuffleArray(due));
    } catch (startError) {
      console.error("Failed to start review:", startError);
      setError("The review session could not be started.");
    }
  };

  const endSession = () => {
    setSession(null);
    void load();
    onChange();
  };

  if (session) {
    return <ReviewSession items={session} onEnd={endSession} />;
  }

  const unresolved = mistakes.filter((mistake) => !mistake.resolved);

  return (
    <div className="px-10 py-9">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-neutral-400">
            Spaced review
          </p>

          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Review
          </h1>

          <p className="mt-2 max-w-xl text-neutral-500">
            Items you miss come back here at growing intervals until you
            recall them reliably.
          </p>
        </header>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        <section className="rounded-2xl border border-black/5 bg-white p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Due today
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {stats?.dueToday ?? "–"}
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Unresolved mistakes
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {stats?.unresolvedMistakes ?? "–"}
              </p>
            </div>
          </div>

          {stats && stats.dueToday > 0 ? (
            <button
              type="button"
              onClick={() => void startSession()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Start Review
            </button>
          ) : stats ? (
            <p className="mt-6 text-sm text-neutral-500">
              {stats.nextDueAt
                ? `Nothing due. Next review: ${formatReviewDate(stats.nextDueAt)}.`
                : "Nothing to review yet. Items appear here after you complete lessons."}
            </p>
          ) : null}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-semibold tracking-tight">Mistakes</h2>

          {mistakes.length === 0 ? (
            <p className="rounded-2xl border border-black/5 bg-white p-6 text-sm text-neutral-500">
              No mistakes recorded yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
              {mistakes.map((mistake, index) => (
                <div
                  key={mistake.id}
                  className={[
                    "flex items-start justify-between gap-4 px-5 py-4",
                    index !== mistakes.length - 1
                      ? "border-b border-black/5"
                      : "",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{mistake.prompt}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {mistake.expected}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {mistake.category} · missed {mistake.timesMissed}×
                    </p>
                  </div>

                  <span
                    className={[
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                      mistake.resolved
                        ? "bg-neutral-100 text-neutral-500"
                        : "bg-neutral-900 text-white",
                    ].join(" ")}
                  >
                    {mistake.resolved ? "Resolved" : "Unresolved"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {unresolved.length > 0 ? (
            <p className="mt-3 text-sm text-neutral-400">
              A mistake is resolved after two correct reviews in a row.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ReviewSession({
  items,
  onEnd,
}: {
  items: ReviewItem[];
  onEnd: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speech = useGermanSpeech();

  const done = index >= items.length;
  const item = items[index];

  const answer = async (correct: boolean) => {
    if (saving) return;

    try {
      setSaving(true);
      setError(null);
      speech.stop();

      await applyReviewResult(item, correct);

      if (correct) setCorrectCount((current) => current + 1);
      setIndex((current) => current + 1);
      setRevealed(false);
    } catch (saveError) {
      console.error("Failed to save review result:", saveError);
      setError("That result could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="px-10 py-9">
        <div className="mx-auto max-w-xl py-12 text-center">
          <p className="text-sm font-medium text-neutral-400">
            Review complete
          </p>

          <div className="mt-6 text-6xl font-semibold tracking-tighter">
            {correctCount}/{items.length}
          </div>

          <p className="mt-4 text-neutral-500">
            Items you got right come back later; the rest return tomorrow.
          </p>

          <button
            type="button"
            onClick={onEnd}
            className="mx-auto mt-8 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 py-9">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onEnd}
            className="text-sm text-neutral-500 transition hover:text-neutral-900"
          >
            End review
          </button>

          <p className="text-sm text-neutral-400">
            {index + 1} of {items.length}
          </p>
        </div>

        <div className="mb-6 overflow-hidden rounded-full">
          <ProgressBar value={(index / items.length) * 100} />
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-8">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            {sourceLabel[item.sourceType] ?? item.sourceType}
          </p>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            {item.prompt}
          </h2>

          {item.audioText ? (
            <button
              type="button"
              disabled={!speech.available}
              onClick={() => speech.speak(item.audioText ?? "")}
              className="mt-5 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Volume2 size={16} />
              Play
            </button>
          ) : null}

          {revealed ? (
            <div className="mt-6 rounded-xl bg-neutral-50 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Answer
              </p>
              <p className="mt-2 text-lg font-medium">{item.answer}</p>
            </div>
          ) : null}
        </div>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        {revealed ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void answer(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-50 disabled:opacity-40"
            >
              <RotateCcw size={16} />
              Again
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void answer(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:opacity-40"
            >
              <Check size={16} />
              Correct
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            <Eye size={16} />
            Reveal answer
          </button>
        )}
      </div>
    </div>
  );
}
