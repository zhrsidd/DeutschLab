import { useEffect, useRef } from "react";

import { UmlautMark } from "../shell/Brand";

/*
 * Completion moments (DESIGN.md §13). App shows one only after the
 * completion has been saved, and only the first time a task is completed,
 * so reopening a finished lesson never replays it. Energy rises with the
 * achievement: an answer is a CSS spring (dl-correct); a lesson is a short
 * kinetic word that dismisses itself; a mastered week and the whole of
 * October hold their results until the learner continues. Every level is
 * skippable (click, Escape or Enter) and fully readable without motion.
 */

export type CelebrationData =
  | {
      kind: "lesson";
      title: string;
      week: number;
      /** Activities complete in that week before and after this one. */
      before: number;
      after: number;
      total: number;
      /** Picks the German phrase deterministically. */
      seed: number;
    }
  | { kind: "week"; week: number; title: string; activities: number; nextWeek: number | null }
  | { kind: "unit"; weeks: number; activities: number };

const LESSON_PHRASES = [
  { german: "Geschafft!", english: "Done!" },
  { german: "Sehr gut!", english: "Very good!" },
  { german: "Weiter so!", english: "Keep it up!" },
];

/** How long the lesson-level moment stays before dismissing itself. */
export const LESSON_CELEBRATION_MS = 2000;

/** Letters that rise in one by one; `ramp` tints them violet → orchid across the word. */
function Letters({ text, delay = 0, step = 38, ramp = false }: { text: string; delay?: number; step?: number; ramp?: boolean }) {
  return (
    <span aria-hidden="true" className="dl-celebrate__letters">
      {text.split("").map((letter, index) =>
        letter === " " ? (
          <span key={index}> </span>
        ) : (
          <span
            key={index}
            className="dl-celebrate__letter"
            style={{
              animationDelay: `${delay + index * step}ms`,
              color: ramp
                ? `color-mix(in oklab, var(--color-orchid) ${Math.round((index / Math.max(1, text.length - 1)) * 70)}%, var(--color-accent))`
                : undefined,
            }}
          >
            {letter}
          </span>
        ),
      )}
    </span>
  );
}

export default function Celebration({ data, onDone }: { data: CelebrationData; onDone: () => void }) {
  const continueRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || (data.kind === "lesson" && event.key === "Enter")) {
        event.preventDefault();
        doneRef.current();
      }
    };
    window.addEventListener("keydown", onKey);

    let timer = 0;
    if (data.kind === "lesson") timer = window.setTimeout(() => doneRef.current(), LESSON_CELEBRATION_MS);
    else continueRef.current?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [data.kind]);

  if (data.kind === "lesson") {
    const phrase = LESSON_PHRASES[data.seed % LESSON_PHRASES.length];

    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="celebration-lesson"
        className="dl-celebrate dl-celebrate--lesson"
        onClick={() => doneRef.current()}
      >
        <span className="sr-only">
          {phrase.german} {data.title} complete. Week {data.week}: {data.after} of {data.total} activities.
        </span>
        <div className="dl-celebrate__glow" aria-hidden="true" />
        <div aria-hidden="true" className="relative text-center">
          <p lang="de" className="font-display text-display-lg font-semibold tracking-tight md:text-display-xl">
            <Letters text={phrase.german} />
          </p>
          <p className="dl-celebrate__fade mt-3 text-fg-2">
            <span className="font-serif text-xl italic text-fg">{phrase.english}</span>
            <span className="mx-2 text-fg-3">·</span>
            {data.title}
          </p>
          <div className="dl-celebrate__fade mx-auto mt-6 w-64">
            <div className="h-[3px] overflow-hidden rounded-full bg-surface">
              <div
                className="dl-celebrate__progress h-full origin-left rounded-full bg-accent"
                style={{
                  ["--from" as string]: data.total ? data.before / data.total : 0,
                  ["--to" as string]: data.total ? data.after / data.total : 0,
                }}
              />
            </div>
            <p className="tabular mt-2 text-xs text-fg-3">
              Week {data.week} · {data.after} of {data.total} activities
            </p>
          </div>
        </div>
      </div>
    );
  }

  const unit = data.kind === "unit";
  const kicker = unit ? "October Foundations" : `Week ${data.week} mastered`;
  const lineOne = unit ? "Oktober" : `Woche ${data.week}`;

  return (
    <div
      role="dialog"
      aria-labelledby="celebration-title"
      data-testid={unit ? "celebration-unit" : "celebration-week"}
      className={["dl-celebrate", unit ? "dl-celebrate--unit" : "dl-celebrate--week"].join(" ")}
    >
      <div className="dl-celebrate__glow" aria-hidden="true" />

      <div className="relative w-full max-w-xl px-6 text-center">
        <UmlautMark animate className="mx-auto h-auto w-12 text-accent" />
        <p className="dl-celebrate__fade mt-6 text-[11px] font-medium uppercase tracking-[0.16em] text-fg-3">{kicker}</p>

        <h2 id="celebration-title" lang="de" className="mt-4 font-display font-semibold leading-[0.92] tracking-tight">
          <span className="sr-only">
            {lineOne} geschafft.
          </span>
          <span aria-hidden="true" className="block text-display-lg md:text-display-xl">
            <Letters text={lineOne} delay={200} step={45} />
          </span>
          <span aria-hidden="true" className="block text-display-lg text-accent md:text-display-xl">
            <Letters text="geschafft." delay={unit ? 620 : 520} step={unit ? 52 : 40} ramp={unit} />
          </span>
        </h2>

        <span aria-hidden="true" className="dl-celebrate__line mx-auto mt-8 block h-px w-full max-w-sm" />

        <dl className="dl-celebrate__results mx-auto mt-8 grid max-w-sm grid-cols-2 gap-6 text-left">
          {unit ? (
            <>
              <Result label="Weeks mastered" value={`${data.weeks} of ${data.weeks}`} />
              <Result label="Activities complete" value={String(data.activities)} />
            </>
          ) : (
            <>
              <Result label="Activities complete" value={`${data.activities} of ${data.activities}`} />
              <Result label="Checkpoint" value="Passed" />
            </>
          )}
        </dl>

        <p className="dl-celebrate__results mx-auto mt-6 max-w-md text-sm leading-6 text-fg-2">
          {unit
            ? "Weeks 1–4 are mastered in DeutschLab. This is the app's own milestone, not a CEFR certificate. Keep your reviews going."
            : `${data.title}. ${data.nextWeek ? `Week ${data.nextWeek} is open on Home.` : ""} Your review queue keeps these words and patterns fresh.`}
        </p>

        <button
          ref={continueRef}
          type="button"
          onClick={() => doneRef.current()}
          className="dl-celebrate__results dl-press mt-8 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          Weiter
          <span className="sr-only"> (continue)</span>
        </button>
      </div>
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-line-strong pt-3">
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">{label}</dt>
      <dd className="tabular m-0 mt-1.5 font-display text-xl font-semibold tracking-tight">{value}</dd>
    </div>
  );
}
