import { useEffect, useRef, useState } from "react";

import { ArrowRight, Volume2 } from "lucide-react";

import type { Grade, TypedQuestion } from "../../lib/reviewExercises";

import ReviewFeedback from "./ReviewFeedback";
import { NORMAL_RATE, type ReviewCardProps } from "./types";

export default function TypedReview({
  question,
  speech,
  isLast,
  onGraded,
  onNext,
}: ReviewCardProps & { question: TypedQuestion }) {
  const [typed, setTyped] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // After feedback is saved, focus Continue so Enter moves on.
  useEffect(() => {
    if (grade && !saving) continueRef.current?.focus();
  }, [grade, saving]);

  const submit = async () => {
    if (grade || typed.trim() === "") return;

    const result = question.grade(typed);

    setGrade(result);
    setSaving(true);

    try {
      await onGraded(result.correct);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-black/5 bg-white p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          {question.label}
        </p>

        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
          {question.prompt}
        </h2>

        <p className="mt-2 text-neutral-400">{question.instruction}</p>

        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={typed}
            readOnly={grade !== null}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Your answer"
            className={[
              "w-full rounded-xl border bg-white px-5 py-4 text-lg outline-none transition focus:border-neutral-400",
              grade
                ? grade.correct
                  ? "dl-correct border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "dl-wrong border-red-200 bg-red-50 text-red-900"
                : "border-black/10",
            ].join(" ")}
          />

          {!grade ? (
            <button
              type="submit"
              disabled={typed.trim() === ""}
              className="mt-4 flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Check answer
            </button>
          ) : null}
        </form>

        {grade && question.audioText ? (
          <button
            type="button"
            disabled={!speech.available}
            onClick={() => speech.speak(question.audioText ?? "", NORMAL_RATE)}
            className="mt-4 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Volume2 size={16} />
            Hear it
          </button>
        ) : null}
      </div>

      {grade ? <ReviewFeedback grade={grade} /> : null}

      <button
        ref={continueRef}
        type="button"
        disabled={!grade || saving}
        onClick={onNext}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isLast ? "Finish review" : "Continue"}
        <ArrowRight size={17} />
      </button>
    </>
  );
}
