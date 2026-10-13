import { Check, CornerDownRight } from "lucide-react";

import type { Grade } from "../../lib/reviewExercises";

/*
 * Answer feedback (DESIGN.md §12). Correct: a drawn check and a violet
 * spring. Not quite: the right answer, stated plainly, with a gentle nudge.
 * Words carry the meaning; colour and motion only reinforce it.
 */
export default function ReviewFeedback({ grade }: { grade: Grade }) {
  return (
    <div
      aria-live="polite"
      className={[
        "mt-6 flex gap-3.5 rounded-lg border px-5 py-4",
        grade.correct
          ? "dl-feedback border-emerald-200 bg-emerald-50 text-emerald-900"
          : "dl-feedback border-red-200 bg-red-50 text-red-900",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full",
          grade.correct ? "dl-correct bg-emerald-700 text-canvas" : "bg-red-200 text-red-900",
        ].join(" ")}
      >
        {grade.correct ? (
          <Check size={15} strokeWidth={3} className="dl-check" />
        ) : (
          <CornerDownRight size={14} strokeWidth={2.5} />
        )}
      </span>

      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="font-medium">{grade.correct ? "Correct." : "Not quite."}</p>
          <span lang="de" aria-hidden="true" className="font-serif text-base italic opacity-70">
            {grade.correct ? "Richtig" : "Fast"}
          </span>
        </div>

        {!grade.correct ? (
          <p className="mt-1 text-sm leading-6">
            Answer: <strong lang="de" className="text-fg">{grade.expected}</strong>
          </p>
        ) : null}

        {grade.note ? <p className="mt-1 text-sm leading-6">{grade.note}</p> : null}

        {grade.explanation ? <p className="mt-1 text-sm leading-6 opacity-80">{grade.explanation}</p> : null}
      </div>
    </div>
  );
}
