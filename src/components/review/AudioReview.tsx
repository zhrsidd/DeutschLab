import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight, Check, Turtle, Volume2, X } from "lucide-react";

import { shuffleArray } from "../lesson/shuffle";

import type { ChoiceQuestion, Grade } from "../../lib/reviewExercises";

import ReviewFeedback from "./ReviewFeedback";
import {
  NORMAL_RATE,
  SLOW_RATE,
  type ReviewCardProps,
} from "./types";

/*
 * Multiple-choice recall. Used for listening (audio required, transcript
 * hidden until answered), pronunciation (word shown, audio optional) and
 * any grammar item that was a multiple-choice question.
 */
export default function AudioReview({
  question,
  speech,
  isLast,
  onGraded,
  onNext,
}: ReviewCardProps & { question: ChoiceQuestion }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [saving, setSaving] = useState(false);

  const continueRef = useRef<HTMLButtonElement>(null);

  const options = useMemo(
    () => shuffleArray(question.options),
    [question],
  );

  useEffect(() => {
    if (grade && !saving) continueRef.current?.focus();
  }, [grade, saving]);

  const hasAudio = question.audioText !== "";
  const audioMissing = hasAudio && speech.checked && !speech.available;
  const blocked = question.audioRequired && audioMissing;

  const choose = async (option: string) => {
    if (grade || blocked) return;

    const result = question.grade(option);

    setChosen(option);
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
      <div className="rounded-3xl border border-black/5 bg-white p-8 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          {question.audioRequired ? "Listening" : "Pronunciation"}
        </p>

        {question.word ? (
          <h2 className="mt-4 text-5xl font-semibold tracking-tight">
            {question.word}
          </h2>
        ) : null}

        {hasAudio ? (
          <>
            {question.audioRequired ? (
              <button
                type="button"
                disabled={!speech.available}
                onClick={() => speech.speak(question.audioText, NORMAL_RATE)}
                aria-label="Play audio"
                className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Volume2 size={30} strokeWidth={1.6} />
              </button>
            ) : (
              <button
                type="button"
                disabled={!speech.available}
                onClick={() => speech.speak(question.audioText, NORMAL_RATE)}
                className="mx-auto mt-4 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Volume2 size={16} />
                Play
              </button>
            )}

            <button
              type="button"
              disabled={!speech.available}
              onClick={() => speech.speak(question.audioText, SLOW_RATE)}
              className="mx-auto mt-3 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Turtle size={16} />
              Slower
            </button>
          </>
        ) : null}

        {audioMissing ? (
          <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-left text-sm leading-6 text-neutral-500">
            No German voice is available on this system, so audio can't be
            played.
            {question.audioRequired
              ? " You can skip this item; it stays due."
              : ""}
          </p>
        ) : null}

        <h3 className="mt-6 text-xl font-semibold tracking-tight">
          {question.prompt}
        </h3>

        {grade && question.transcript ? (
          <div className="mt-5 border-t border-black/5 pt-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Transcript
            </p>
            <p className="mt-2 text-lg font-medium">{question.transcript}</p>
            {question.translation ? (
              <p className="mt-1 text-neutral-500">{question.translation}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3">
        {options.map((option) => {
          const isSelected = chosen === option;
          const isCorrect = grade !== null && option === grade.expected;

          let appearance = "border-black/5 bg-white hover:bg-neutral-50";

          if (grade) {
            if (isCorrect) {
              appearance = "border-emerald-200 bg-emerald-50 text-emerald-900";
            } else if (isSelected) {
              appearance = "border-red-200 bg-red-50 text-red-900";
            } else {
              appearance = "border-black/5 bg-white text-neutral-400";
            }
          }

          return (
            <button
              key={option}
              type="button"
              disabled={grade !== null || blocked}
              onClick={() => void choose(option)}
              className={`flex min-h-14 items-center justify-between rounded-xl border px-5 py-4 text-left transition disabled:cursor-not-allowed ${appearance}`}
            >
              <span className="font-medium">{option}</span>

              {grade && isCorrect ? <Check size={18} /> : null}
              {grade && isSelected && !isCorrect ? <X size={18} /> : null}
            </button>
          );
        })}
      </div>

      {grade ? <ReviewFeedback grade={grade} /> : null}

      {blocked ? (
        <button
          type="button"
          onClick={onNext}
          className="mt-6 flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Skip for now
        </button>
      ) : (
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
      )}
    </>
  );
}
