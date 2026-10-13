import { useCallback, useEffect, useState } from "react";

import { ArrowRight } from "lucide-react";

import type {
  MistakeRow,
  ReviewItem,
  ReviewStats,
} from "../data/reviewTypes";

import { resolveReviewLimit } from "../lib/dailyPlanner";

import { useGermanSpeech } from "../hooks/useGermanSpeech";

import { Page, PageHeader, Section } from "./shell/AppShell";

import {
  applyReviewResult,
  getDueReviewItems,
  getMistakes,
  MISTAKE_LIST_LIMIT,
  getReviewStats,
} from "../lib/db";

import { ErrorMessage, ProgressBar } from "./lesson/LessonParts";
import ReviewCard from "./review/ReviewCard";
import { shuffleArray } from "./lesson/shuffle";

interface ReviewViewProps {
  /** Items planned by Today; omit/null to use the default maximum. */
  sessionLimit?: number | null;
  /** Lets the app refresh its due-count after reviews change. */
  onChange: () => void;
}

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ReviewView({
  sessionLimit,
  onChange,
}: ReviewViewProps) {
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
      const due = await getDueReviewItems(resolveReviewLimit(sessionLimit));

      if (due.length === 0) {
        // Nothing is due after all (e.g. data changed); just refresh.
        await load();
        onChange();
        return;
      }

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
    <Page narrow>
      <PageHeader kicker="Spaced review" title="Review">
        Items you miss come back here at growing intervals until you recall them reliably.
      </PageHeader>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <section aria-label="Due now" className="mt-8">
        <dl className="grid grid-cols-2 gap-6">
          <ReviewStat label="Due today" value={stats?.dueToday ?? "–"} highlight={Boolean(stats && stats.dueToday > 0)} />
          <ReviewStat label="Unresolved mistakes" value={stats?.unresolvedMistakes ?? "–"} />
        </dl>

        {stats && stats.dueToday > 0 ? (
          <button
            type="button"
            onClick={() => void startSession()}
            className="dl-press mt-7 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3.5 text-sm font-semibold text-on-accent hover:bg-accent-hover sm:w-auto sm:px-6"
          >
            Start Review
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : stats ? (
          <p className="mt-6 text-sm text-fg-2">
            {stats.nextDueAt
              ? `Nothing due. Next review: ${formatReviewDate(stats.nextDueAt)}.`
              : "Nothing to review yet. Items appear here after you complete lessons."}
          </p>
        ) : null}
      </section>

      <Section title="Mistakes" aside={unresolved.length > 0 ? <span className="tabular text-sm text-fg-2">{unresolved.length} open</span> : undefined}>
        {mistakes.length === 0 ? (
          <p className="text-sm text-fg-2">No mistakes recorded yet.</p>
        ) : (
          <ul>
            {mistakes.map((mistake) => (
              <li key={mistake.id} className="flex items-start justify-between gap-4 border-b border-line py-4 last:border-b-0">
                <div className="min-w-0">
                  <p className="font-medium">{mistake.prompt}</p>
                  <p lang="de" className="mt-1 text-sm text-fg-2">
                    {mistake.expected}
                  </p>
                  <p className="mt-1 text-xs text-fg-3">
                    {mistake.category} · missed {mistake.timesMissed}×
                  </p>
                </div>

                <span
                  className={[
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                    mistake.resolved ? "bg-success-soft text-success" : "text-accent ring-1 ring-accent/60",
                  ].join(" ")}
                >
                  {mistake.resolved ? "Resolved" : "Unresolved"}
                </span>
              </li>
            ))}
          </ul>
        )}

        {mistakes.length >= MISTAKE_LIST_LIMIT ? (
          <p className="mt-3 text-sm text-fg-3">
            Showing the {MISTAKE_LIST_LIMIT} most important: unresolved and most-missed first.
          </p>
        ) : null}

        {unresolved.length > 0 ? (
          <p className="mt-3 text-sm text-fg-3">A mistake is resolved after two correct reviews in a row.</p>
        ) : null}
      </Section>
    </Page>
  );
}

function ReviewStat({ label, value, highlight = false }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={["border-t pt-3", highlight ? "border-accent" : "border-line-strong"].join(" ")}>
      <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">{label}</dt>
      <dd className={["tabular m-0 mt-2 font-display text-stat font-semibold", highlight ? "text-accent" : ""].join(" ")}>
        {value}
      </dd>
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
  const [correctCount, setCorrectCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const speech = useGermanSpeech();

  const done = index >= items.length;
  const item = items[index];

  // Exercises grade themselves; this only records the result.
  const grade = async (correct: boolean) => {
    try {
      setError(null);
      await applyReviewResult(item, correct);

      if (correct) setCorrectCount((current) => current + 1);
    } catch (saveError) {
      console.error("Failed to save review result:", saveError);
      setError(
        "That result could not be saved, so this item will come back later.",
      );
    }
  };

  const next = () => {
    speech.stop();
    setIndex((current) => current + 1);
  };

  if (done) {
    return (
      <div className="px-5 py-9 md:px-10">
        <div className="dl-enter mx-auto max-w-xl py-12 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">Review complete</p>

          <div className="tabular mt-6 font-display text-[5rem] leading-none font-extralight tracking-tight text-accent">
            {correctCount}/{items.length}
          </div>

          <p className="mt-5 text-fg-2">
            Items you got right come back later; the rest return tomorrow.
          </p>

          <button
            type="button"
            onClick={onEnd}
            className="dl-press mx-auto mt-8 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Assessment energy: focused, no atmosphere, only the question.
  return (
    <div className="px-5 py-9 md:px-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onEnd}
            className="dl-press rounded-md text-sm text-fg-2 hover:text-fg"
          >
            End review
          </button>

          <p className="tabular text-sm text-fg-3" aria-live="polite">
            {index + 1} of {items.length}
          </p>
        </div>

        <div className="mb-8 overflow-hidden rounded-full">
          <ProgressBar value={(index / items.length) * 100} />
        </div>

        <ReviewCard
          key={item.id}
          item={item}
          speech={speech}
          isLast={index === items.length - 1}
          onGraded={grade}
          onNext={next}
        />

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      </div>
    </div>
  );
}
