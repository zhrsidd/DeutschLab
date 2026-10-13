import { useState } from "react";

import { RotateCcw } from "lucide-react";

import type { KineticStep } from "../../data/lessons/grammarCourseTypes";
import { LayoutGroup, m } from "../motion";

const spring = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } as const;

/*
 * Educational kinetic typography (DESIGN.md §14). A sentence whose parts
 * keep their identity across steps, so Motion can move each one to its new
 * place: "lerne" holds position 2 while "heute" and "ich" trade places, or
 * "der" becomes "den" when der Tisch turns into the direct object. Each
 * step is also written out as a caption and announced politely, so the
 * demonstration teaches the same thing with motion turned off. It plays
 * only when the learner asks; it never affects scoring.
 */
export default function KineticSentence({ title, steps }: { title: string; steps: KineticStep[] }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <figure className="mx-0 mt-0 rounded-lg border border-line bg-elevated p-5 md:p-6">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">{title}</span>
        <span className="tabular text-xs text-fg-3">
          {index + 1} / {steps.length}
        </span>
      </figcaption>

      <LayoutGroup id={title}>
        <p lang="de" aria-hidden="true" className="mt-6 flex min-h-[5.5rem] flex-wrap items-end gap-x-2.5 gap-y-4">
          {step.parts.map((part) => (
            <m.span
              key={part.id}
              layout="position"
              transition={spring}
              className="inline-flex flex-col items-start"
            >
              <span
                className={[
                  "mb-1.5 h-4 text-[10px] font-medium uppercase tracking-[0.1em] whitespace-nowrap",
                  part.emphasis ? "text-accent" : "text-fg-3",
                ].join(" ")}
              >
                {part.tag ?? ""}
              </span>
              <m.span
                key={part.text}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className={[
                  "rounded-md px-2 py-1 font-display text-2xl font-semibold tracking-tight md:text-3xl",
                  part.emphasis ? "bg-accent/15 text-accent ring-1 ring-accent/50" : "text-fg",
                ].join(" ")}
              >
                {part.text}
              </m.span>
            </m.span>
          ))}
        </p>
      </LayoutGroup>

      <p aria-live="polite" className="mt-5 text-sm leading-6 text-fg-2">
        <span lang="de" className="font-medium text-fg">
          {step.sentence}
        </span>{" "}
        {step.caption}
      </p>

      <button
        type="button"
        onClick={() => setIndex((current) => (last ? 0 : current + 1))}
        className="dl-press mt-4 inline-flex items-center gap-2 rounded-md border border-line-strong px-3.5 py-2 text-sm font-medium hover:border-accent"
      >
        {last ? (
          <>
            <RotateCcw size={14} aria-hidden="true" />
            Replay
          </>
        ) : (
          <>Show {index === 0 ? "the change" : "the next step"}</>
        )}
      </button>
    </figure>
  );
}
