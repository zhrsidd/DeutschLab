import { useEffect, useRef, useState } from "react";

import { ArrowRight, Check, Turtle, Volume2, X } from "lucide-react";

import type { ComprehensionQuestion } from "../../data/lessons/week1Checkpoint";
import { gradeComprehension } from "../../lib/checkpointBuilders";
import type { Grade } from "../../lib/reviewExercises";

import ReviewFeedback from "../review/ReviewFeedback";
import { NORMAL_RATE, SLOW_RATE, type Speech } from "../review/types";

interface ComprehensionSectionProps {
  questions: ComprehensionQuestion[];
  /** Reading: the text shown above every question. */
  passage?: string;
  speech: Speech;
  onComplete: (score: number) => void;
  /** Called once per question when it is answered. */
  onResult?: (
    question: ComprehensionQuestion,
    correct: boolean,
    answer: string,
  ) => void;
}

/*
 * Reading and listening share one runner. Listening questions carry
 * `audio`; their transcript stays hidden until the answer is submitted.
 */
export default function ComprehensionSection({
  questions,
  passage,
  speech,
  onComplete,
  onResult,
}: ComprehensionSectionProps) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const question = questions[index];

  return (
    <QuestionCard
      key={question.id}
      question={question}
      passage={passage}
      speech={speech}
      position={`${index + 1} of ${questions.length}`}
      isLast={index === questions.length - 1}
      onAnswered={(correct, answer) => {
        if (correct) setScore((current) => current + 1);
        onResult?.(question, correct, answer);
      }}
      onNext={() => {
        speech.stop();

        if (index < questions.length - 1) {
          setIndex((current) => current + 1);
        } else {
          // `score` already includes the last answer (set on submit).
          onComplete(score);
        }
      }}
    />
  );
}

function QuestionCard({
  question,
  passage,
  speech,
  position,
  isLast,
  onAnswered,
  onNext,
}: {
  question: ComprehensionQuestion;
  passage?: string;
  speech: Speech;
  position: string;
  isLast: boolean;
  onAnswered: (correct: boolean, answer: string) => void;
  onNext: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (question.kind === "short") inputRef.current?.focus();
  }, [question.kind]);

  useEffect(() => {
    if (grade) continueRef.current?.focus();
  }, [grade]);

  const submit = (answer: string) => {
    if (grade || answer.trim() === "") return;

    const result = gradeComprehension(question, answer);

    setChosen(answer);
    setGrade(result);
    onAnswered(result.correct, answer);
  };

  return (
    <>
      <p className="mt-4 text-sm font-medium text-neutral-400">{position}</p>

      {passage ? (
        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6 leading-8">
          {passage}
        </div>
      ) : null}

      {question.audio ? (
        <div className="mt-4 rounded-3xl border border-black/5 bg-white p-8 text-center">
          <button
            type="button"
            disabled={!speech.available}
            onClick={() => speech.speak(question.audio ?? "", NORMAL_RATE)}
            aria-label="Play audio"
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Volume2 size={30} strokeWidth={1.6} />
          </button>

          <button
            type="button"
            disabled={!speech.available}
            onClick={() => speech.speak(question.audio ?? "", SLOW_RATE)}
            className="mx-auto mt-3 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:opacity-40"
          >
            <Turtle size={16} />
            Slower
          </button>

          {grade ? (
            <div className="mt-5 border-t border-black/5 pt-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Transcript
              </p>
              <p className="mt-2 text-lg font-medium">{question.audio}</p>
              {question.translation ? (
                <p className="mt-1 text-neutral-500">{question.translation}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <h2 className="mt-6 text-center text-2xl font-semibold tracking-tight">
        {question.prompt}
      </h2>

      {question.kind === "mc" ? (
        <div className="mt-6 grid gap-3">
          {(question.options ?? []).map((option) => {
            const isSelected = chosen === option;
            const isCorrect = option === question.answer;

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
                disabled={grade !== null}
                onClick={() => submit(option)}
                className={`flex min-h-14 items-center justify-between rounded-xl border px-5 py-4 text-left transition ${appearance}`}
              >
                <span className="font-medium">{option}</span>
                {grade && isCorrect ? <Check size={18} /> : null}
                {grade && isSelected && !isCorrect ? <X size={18} /> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            submit(typed);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={typed}
            readOnly={grade !== null}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Your answer"
            className={[
              "w-full rounded-xl border bg-white px-5 py-4 text-lg outline-none transition focus:border-neutral-400",
              grade
                ? grade.correct
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
                : "border-black/10",
            ].join(" ")}
          />

          {!grade ? (
            <button
              type="submit"
              disabled={typed.trim() === ""}
              className="mt-4 flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Check answer
            </button>
          ) : null}
        </form>
      )}

      {grade ? <ReviewFeedback grade={grade} /> : null}

      <button
        ref={continueRef}
        type="button"
        disabled={!grade}
        onClick={onNext}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isLast ? "Finish section" : "Next question"}
        <ArrowRight size={17} />
      </button>
    </>
  );
}
