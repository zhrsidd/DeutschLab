import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight, Check, X } from "lucide-react";

import type { CourseQuestion } from "../../data/lessons/grammarCourseTypes";

import { trackAnswer } from "../../lib/db";
import {
  buildReviewExercise,
  toTypedQuestion,
  type Grade,
} from "../../lib/reviewExercises";

import { seededShuffle } from "../lesson/shuffle";
import ReviewFeedback from "../review/ReviewFeedback";

const kindLabel: Record<CourseQuestion["kind"], string> = {
  choice: "Choose",
  fill: "Fill in the blank",
  typed: "Write in German",
  reorder: "Build the sentence",
};

interface CoursePracticeProps {
  question: CourseQuestion;
  isLast: boolean;
  disabled?: boolean;
  /** When false, correct answers don't enter Review (wrong ones always do). */
  trackCorrect?: boolean;
  /** Called once when the answer is submitted. */
  onAnswered: (correct: boolean) => void;
  onNext: () => void;
}

/*
 * One practice question for the data-driven grammar lessons. Typed and
 * reorder answers are graded with the same rules Review uses.
 */
export default function CoursePractice({
  question,
  isLast,
  disabled = false,
  trackCorrect = true,
  onAnswered,
  onNext,
}: CoursePracticeProps) {
  const [typed, setTyped] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const checkRef = useRef<HTMLButtonElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  const typedGrader = useMemo(() => {
    const exercise = buildReviewExercise("grammar", question.id);
    return exercise ? toTypedQuestion(exercise, 0) : null;
  }, [question.id]);

  const tiles = useMemo(
    () =>
      question.kind === "reorder"
        ? seededShuffle(
            question.words.map((word, index) => ({ word, index })),
            question.id,
          )
        : [],
    [question],
  );

  useEffect(() => {
    if (question.kind === "typed" || question.kind === "fill") {
      inputRef.current?.focus();
    }
  }, [question.kind]);

  useEffect(() => {
    if (grade) continueRef.current?.focus();
  }, [grade]);

  // Once a tile is placed, Enter on "Check" submits the sentence.
  useEffect(() => {
    if (!grade && picked.length > 0) checkRef.current?.focus();
  }, [picked, grade]);

  const finish = (result: Grade, answer: string) => {
    setGrade(result);
    onAnswered(result.correct);

    const exercise = buildReviewExercise("grammar", question.id);
    const prompt =
      exercise?.kind === "typed"
        ? `${exercise.instruction} ${exercise.prompt}`
        : exercise?.kind === "choice"
          ? exercise.prompt
          : question.id;

    trackAnswer({
      sourceType: "grammar",
      sourceId: question.id,
      category: `grammar · ${question.kind}`,
      prompt,
      expected: result.expected,
      userAnswer: answer,
      correct: result.correct,
      enterOnCorrect: trackCorrect,
    });
  };

  const submitTyped = (answer: string) => {
    if (grade || answer.trim() === "" || !typedGrader) return;
    finish(typedGrader.grade(answer), answer);
  };

  const chooseOption = (option: string) => {
    if (grade || question.kind !== "choice") return;

    setChosen(option);
    finish(
      {
        correct: option === question.answer,
        expected: question.answer,
        explanation: question.explanation,
      },
      option,
    );
  };

  const builtSentence = picked.map((i) => tiles[i]?.word ?? "").join(" ");

  return (
    <>
      <p className="text-center text-sm font-medium text-neutral-400">
        {kindLabel[question.kind]}
      </p>

      {question.kind === "choice" ? (
        <>
          <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight">
            {question.prompt}
          </h2>

          <div className="mt-8 grid gap-3">
            {question.options.map((option) => {
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
                  disabled={grade !== null || disabled}
                  onClick={() => chooseOption(option)}
                  className={`flex min-h-14 items-center justify-between rounded-xl border px-5 py-4 text-left transition ${appearance}`}
                >
                  <span className="font-medium">{option}</span>
                  {grade && isCorrect ? <Check size={18} /> : null}
                  {grade && isSelected && !isCorrect ? <X size={18} /> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {question.kind === "fill" || question.kind === "typed" ? (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitTyped(typed);
          }}
        >
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            {question.kind === "fill"
              ? `${question.sentence}${question.hint ? ` ${question.hint}` : ""}`
              : question.prompt}
          </h2>

          <p className="mt-3 text-center text-neutral-400">
            {question.kind === "fill"
              ? "Type the missing word."
              : question.instruction}
          </p>

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
              "mt-8 w-full rounded-xl border bg-white px-5 py-4 text-lg outline-none transition focus:border-neutral-400",
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
              disabled={typed.trim() === "" || disabled}
              className="mt-4 flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Check answer
            </button>
          ) : null}
        </form>
      ) : null}

      {question.kind === "reorder" ? (
        <div className="mt-4">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Put the words in order
          </h2>

          <p className="mt-3 text-center text-neutral-400">
            Tap the words to build the sentence. Tap a placed word to remove it.
          </p>

          <div
            className={[
              "mt-8 flex min-h-16 flex-wrap items-center gap-2 rounded-xl border px-4 py-3",
              grade
                ? grade.correct
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
                : "border-black/10 bg-white",
            ].join(" ")}
          >
            {picked.length === 0 ? (
              <span className="text-neutral-300">Your sentence</span>
            ) : (
              picked.map((tileIndex) => (
                <button
                  key={tileIndex}
                  type="button"
                  disabled={grade !== null}
                  onClick={() =>
                    setPicked((current) =>
                      current.filter((value) => value !== tileIndex),
                    )
                  }
                  className="rounded-lg bg-neutral-900 px-3.5 py-2 text-base font-medium text-white"
                >
                  {tiles[tileIndex].word}
                </button>
              ))
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {tiles.map((tile, tileIndex) => (
              <button
                key={tile.index}
                type="button"
                disabled={grade !== null || picked.includes(tileIndex)}
                onClick={() => setPicked((current) => [...current, tileIndex])}
                className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-base font-medium transition enabled:hover:bg-neutral-50 disabled:opacity-25"
              >
                {tile.word}
              </button>
            ))}
          </div>

          {!grade ? (
            <button
              ref={checkRef}
              type="button"
              disabled={picked.length !== tiles.length || disabled}
              onClick={() => submitTyped(builtSentence)}
              className="mt-6 flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Check answer
            </button>
          ) : null}
        </div>
      ) : null}

      {grade ? <ReviewFeedback grade={grade} /> : null}

      <button
        ref={continueRef}
        type="button"
        disabled={!grade || disabled}
        onClick={onNext}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isLast ? "See results" : "Next question"}
        <ArrowRight size={17} />
      </button>
    </>
  );
}
