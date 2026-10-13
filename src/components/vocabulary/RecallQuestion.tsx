import { useEffect, useRef, useState } from "react";

import { ArrowRight, Check, Volume2, X } from "lucide-react";

import ReviewFeedback from "../review/ReviewFeedback";
import type { Speech } from "../review/types";

import type { Grade } from "../../lib/reviewExercises";
import {
  gradeVocabAnswer,
  type VocabQuestion,
} from "../../lib/vocabularyExercises";

interface RecallQuestionProps {
  question: VocabQuestion;
  speech: Speech;
  continueLabel: string;
  /** Called once, at the moment the answer is submitted. */
  onAnswered: (correct: boolean, userAnswer: string) => void | Promise<void>;
  onNext: () => void;
  disabled?: boolean;
}

/** One vocabulary recall question: multiple choice or typed German. */
export default function RecallQuestion({
  question,
  speech,
  continueLabel,
  onAnswered,
  onNext,
  disabled = false,
}: RecallQuestionProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (question.kind === "typed") inputRef.current?.focus();
  }, [question.kind]);

  useEffect(() => {
    if (grade && !saving) continueRef.current?.focus();
  }, [grade, saving]);

  const submit = async (answer: string) => {
    if (grade) return;

    const result = gradeVocabAnswer(question, answer);

    setGrade(result);
    setSaving(true);

    try {
      await onAnswered(result.correct, answer);
    } finally {
      setSaving(false);
    }
  };

  const showPromptAudio = question.kind === "de-en";
  const canHear = speech.available;

  return (
    <>
      <div className="text-center">
        <div className="flex items-center justify-center gap-4">
          <h2 className="text-5xl font-semibold tracking-tight">
            {question.display}
          </h2>

          {showPromptAudio || grade ? (
            <button
              type="button"
              disabled={!canHear}
              onClick={() => speech.speak(question.audioText)}
              aria-label="Play German"
              className="flex shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Volume2 size={16} />
              Play
            </button>
          ) : null}
        </div>

        <p className="mt-4 text-neutral-400">{question.instruction}</p>
      </div>

      {question.kind === "typed" ? (
        <form
          className="mt-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (typed.trim() !== "") void submit(typed);
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
              disabled={typed.trim() === "" || disabled}
              className="mt-4 flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Check answer
            </button>
          ) : null}
        </form>
      ) : (
        <div className="mt-8 grid gap-3">
          {question.options.map((option) => {
            const isSelected = chosen === option;
            const isCorrect = grade !== null && option === grade.expected;

            let appearance = "border-black/5 bg-white hover:bg-neutral-50";

            if (grade) {
              if (isCorrect) {
                appearance = "dl-correct border-emerald-200 bg-emerald-50 text-emerald-900";
              } else if (isSelected) {
                appearance = "dl-wrong border-red-200 bg-red-50 text-red-900";
              } else {
                appearance = "border-black/5 bg-white text-neutral-400";
              }
            }

            return (
              <button
                key={option}
                type="button"
                disabled={grade !== null || disabled}
                onClick={() => {
                  setChosen(option);
                  void submit(option);
                }}
                className={`flex min-h-14 items-center justify-between rounded-xl border px-5 py-4 text-left transition ${appearance}`}
              >
                <span className="font-medium">{option}</span>

                {grade && isCorrect ? <Check size={18} className="dl-check" aria-hidden="true" /> : null}
                {grade && isSelected && !isCorrect ? <X size={18} /> : null}
              </button>
            );
          })}
        </div>
      )}

      {grade ? <ReviewFeedback grade={grade} /> : null}

      <button
        ref={continueRef}
        type="button"
        disabled={!grade || saving}
        onClick={onNext}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {continueLabel}
        <ArrowRight size={17} />
      </button>
    </>
  );
}
