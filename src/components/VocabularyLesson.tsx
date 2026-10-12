import { useMemo, useState } from "react";

import {
  ArrowRight,
  Check,
  RotateCcw,
  X,
} from "lucide-react";

import {
  week1Vocabulary,
  type VocabularyItem,
} from "../data/lessons/week1Vocabulary";

import {
  ErrorMessage,
  LessonShell,
  ProgressBar,
  Stat,
} from "./lesson/LessonParts";

import { trackAnswer } from "../lib/db";

import { shuffleArray } from "./lesson/shuffle";

type Stage =
  | "intro"
  | "learn"
  | "quiz"
  | "results";

interface VocabularyLessonProps {
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (
    score: number,
    total: number,
  ) => Promise<void>;
}

export default function VocabularyLesson({
  onBack,
  onFinish,
  onSaveAttempt,
}: VocabularyLessonProps) {
  const [stage, setStage] =
    useState<Stage>("intro");

  const [learnIndex, setLearnIndex] =
    useState(0);

  const [quizIndex, setQuizIndex] =
    useState(0);

  const [score, setScore] =
    useState(0);

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] = useState<string | null>(null);

  const [
    answerWasCorrect,
    setAnswerWasCorrect,
  ] = useState<boolean | null>(null);

  const [
    savingAttempt,
    setSavingAttempt,
  ] = useState(false);

  const [
    finishing,
    setFinishing,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const currentLearnItem =
    week1Vocabulary[learnIndex];

  const currentQuizItem =
    week1Vocabulary[quizIndex];

  const passingScore = Math.ceil(
    week1Vocabulary.length * 0.8,
  );

  const passed =
    score >= passingScore;

  const quizOptions = useMemo(() => {
    if (
      stage !== "quiz" ||
      !currentQuizItem
    ) {
      return [];
    }

    return createOptions(
      currentQuizItem,
    );
  }, [
    currentQuizItem,
    stage,
  ]);

  const learnProgress =
    week1Vocabulary.length === 0
      ? 0
      : ((learnIndex + 1) /
          week1Vocabulary.length) *
        100;

  const quizProgress =
    week1Vocabulary.length === 0
      ? 0
      : ((quizIndex + 1) /
          week1Vocabulary.length) *
        100;

  const startLearning = () => {
    setError(null);
    setLearnIndex(0);
    setQuizIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswerWasCorrect(null);
    setStage("learn");
  };

  const nextLearnItem = () => {
    if (
      learnIndex <
      week1Vocabulary.length - 1
    ) {
      setLearnIndex(
        (current) => current + 1,
      );

      return;
    }

    setQuizIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswerWasCorrect(null);
    setStage("quiz");
  };

  const chooseAnswer = (
    answer: string,
  ) => {
    if (
      selectedAnswer !== null ||
      !currentQuizItem
    ) {
      return;
    }

    const correct =
      answer ===
      currentQuizItem.english;

    setSelectedAnswer(answer);
    setAnswerWasCorrect(correct);

    trackAnswer({
      sourceType: "vocabulary",
      sourceId: currentQuizItem.id,
      category: "vocabulary",
      prompt: `What does "${currentQuizItem.german}" mean?`,
      expected: currentQuizItem.english,
      userAnswer: answer,
      correct,
      audioText: currentQuizItem.german,
      enterOnCorrect: true,
    });

    if (correct) {
      setScore(
        (current) => current + 1,
      );
    }
  };

  const nextQuestion = async () => {
    if (selectedAnswer === null) {
      return;
    }

    setError(null);

    if (
      quizIndex <
      week1Vocabulary.length - 1
    ) {
      setQuizIndex(
        (current) => current + 1,
      );

      setSelectedAnswer(null);
      setAnswerWasCorrect(null);

      return;
    }

    try {
      setSavingAttempt(true);

      await onSaveAttempt(
        score,
        week1Vocabulary.length,
      );

      setStage("results");
    } catch (saveError) {
      console.error(
        "Failed to save lesson attempt:",
        saveError,
      );

      setError(
        "Your score could not be saved. Please try again.",
      );
    } finally {
      setSavingAttempt(false);
    }
  };

  const restartQuiz = () => {
    setError(null);

    setQuizIndex(0);
    setScore(0);

    setSelectedAnswer(null);
    setAnswerWasCorrect(null);

    setStage("quiz");
  };

  const restartWholeLesson = () => {
    setError(null);

    setLearnIndex(0);
    setQuizIndex(0);
    setScore(0);

    setSelectedAnswer(null);
    setAnswerWasCorrect(null);

    setStage("learn");
  };

  const finishLesson = async () => {
    try {
      setError(null);
      setFinishing(true);

      await onFinish();
    } catch (finishError) {
      console.error(
        "Failed to finish lesson:",
        finishError,
      );

      setError(
        "DeutschLab could not mark the lesson as complete. Please try again.",
      );

      setFinishing(false);
    }
  };

  /*
   * INTRO
   */

  if (stage === "intro") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Week 1 · Vocabulary
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            First vocabulary
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            Learn your first German
            greetings and everyday
            expressions, then test
            yourself without looking at
            the translations.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat
              label="Words"
              value={String(
                week1Vocabulary.length,
              )}
            />

            <Stat
              label="Learn"
              value="~5 min"
            />

            <Stat
              label="Quiz"
              value={`${week1Vocabulary.length} Qs`}
            />
          </div>

          <div className="mt-10 rounded-2xl border border-black/5 bg-neutral-50 p-5">
            <p className="text-sm font-medium">
              Goal
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Score at least{" "}
              {passingScore}/
              {week1Vocabulary.length}{" "}
              to complete this lesson.
              A lower score is still
              recorded, but you'll need
              to retry before the lesson
              is marked complete.
            </p>
          </div>

          <button
            type="button"
            onClick={startLearning}
            className="mt-8 flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Begin lesson
            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  /*
   * LEARN
   */

  if (stage === "learn") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar
          value={learnProgress}
        />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-400">
              Learn · {learnIndex + 1}{" "}
              of{" "}
              {
                week1Vocabulary.length
              }
            </p>

            <p className="text-sm text-neutral-400">
              {Math.round(
                learnProgress,
              )}
              %
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-10">
            <p className="text-sm font-medium uppercase tracking-wider text-neutral-400">
              German
            </p>

            <h2 className="mt-4 text-5xl font-semibold tracking-tight">
              {
                currentLearnItem.german
              }
            </h2>

            <p className="mt-5 text-xl text-neutral-500">
              {
                currentLearnItem.english
              }
            </p>

            <div className="my-8 h-px bg-black/5" />

            <p className="text-lg font-medium">
              {
                currentLearnItem.exampleGerman
              }
            </p>

            <p className="mt-2 leading-6 text-neutral-400">
              {
                currentLearnItem.exampleEnglish
              }
            </p>

            {currentLearnItem.note ? (
              <div className="mt-6 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-500">
                {
                  currentLearnItem.note
                }
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={nextLearnItem}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {learnIndex ===
            week1Vocabulary.length - 1
              ? "Start quiz"
              : "Next word"}

            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  /*
   * QUIZ
   */

  if (stage === "quiz") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar
          value={quizProgress}
        />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-400">
              Quiz · {quizIndex + 1}{" "}
              of{" "}
              {
                week1Vocabulary.length
              }
            </p>

            <p className="text-sm text-neutral-400">
              Score {score}
            </p>
          </div>

          <h2 className="mt-10 text-center text-5xl font-semibold tracking-tight">
            {
              currentQuizItem.german
            }
          </h2>

          <p className="mt-4 text-center text-neutral-400">
            What does this mean?
          </p>

          <div className="mt-10 grid gap-3">
            {quizOptions.map(
              (option) => {
                const isSelected =
                  selectedAnswer ===
                  option;

                const isCorrect =
                  option ===
                  currentQuizItem.english;

                let appearance =
                  "border-black/5 bg-white hover:bg-neutral-50";

                if (
                  selectedAnswer !==
                  null
                ) {
                  if (isCorrect) {
                    appearance =
                      "border-emerald-200 bg-emerald-50 text-emerald-900";
                  } else if (
                    isSelected
                  ) {
                    appearance =
                      "border-red-200 bg-red-50 text-red-900";
                  } else {
                    appearance =
                      "border-black/5 bg-white text-neutral-400";
                  }
                }

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={
                      selectedAnswer !==
                      null
                    }
                    onClick={() =>
                      chooseAnswer(
                        option,
                      )
                    }
                    className={`flex min-h-14 items-center justify-between rounded-xl border px-5 py-4 text-left transition ${appearance}`}
                  >
                    <span className="font-medium">
                      {option}
                    </span>

                    {selectedAnswer !==
                      null &&
                    isCorrect ? (
                      <Check
                        size={18}
                      />
                    ) : null}

                    {selectedAnswer !==
                      null &&
                    isSelected &&
                    !isCorrect ? (
                      <X size={18} />
                    ) : null}
                  </button>
                );
              },
            )}
          </div>

          {selectedAnswer !== null ? (
            <div
              className={[
                "mt-6 rounded-xl px-5 py-4",
                answerWasCorrect
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-red-50 text-red-900",
              ].join(" ")}
            >
              <p className="font-medium">
                {answerWasCorrect
                  ? "Correct."
                  : "Not quite."}
              </p>

              {!answerWasCorrect ? (
                <p className="mt-1 text-sm leading-6 opacity-80">
                  {
                    currentQuizItem.german
                  }{" "}
                  means{" "}
                  <strong>
                    {
                      currentQuizItem.english
                    }
                  </strong>
                  .
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          ) : null}

          <button
            type="button"
            disabled={
              selectedAnswer === null ||
              savingAttempt
            }
            onClick={() =>
              void nextQuestion()
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {savingAttempt
              ? "Saving…"
              : quizIndex ===
                  week1Vocabulary.length -
                    1
                ? "See results"
                : "Next question"}

            {!savingAttempt ? (
              <ArrowRight size={17} />
            ) : null}
          </button>
        </div>
      </LessonShell>
    );
  }

  /*
   * RESULTS
   */

  return (
    <LessonShell onBack={onBack}>
      <div className="mx-auto max-w-2xl px-8 py-12 text-center">
        <p className="text-sm font-medium text-neutral-400">
          Lesson complete
        </p>

        <div className="mt-8 text-7xl font-semibold tracking-tighter">
          {score}/
          {week1Vocabulary.length}
        </div>

        <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all duration-300"
            style={{
              width: `${
                (score /
                  week1Vocabulary.length) *
                100
              }%`,
            }}
          />
        </div>

        <h1 className="mt-7 text-3xl font-semibold tracking-tight">
          {passed
            ? "Nice work."
            : "One more pass."}
        </h1>

        <p className="mx-auto mt-3 max-w-md leading-7 text-neutral-500">
          {passed
            ? "You've reached the target for this lesson. Later, these words will automatically enter your spaced-repetition review system."
            : `You need at least ${passingScore}/${week1Vocabulary.length} before this lesson is marked complete. Review the vocabulary and try the quiz again.`}
        </p>

        {error ? (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        ) : null}

        {passed ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={
                restartWholeLesson
              }
              disabled={finishing}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
            >
              <RotateCcw
                size={17}
              />

              Review again
            </button>

            <button
              type="button"
              onClick={() =>
                void finishLesson()
              }
              disabled={finishing}
              className="rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
            >
              {finishing
                ? "Finishing…"
                : "Finish lesson"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={restartQuiz}
            className="mx-auto mt-8 flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            <RotateCcw size={17} />

            Retry quiz
          </button>
        )}
      </div>
    </LessonShell>
  );
}

function createOptions(
  correctItem: VocabularyItem,
): string[] {
  const uniqueDistractors = [
    ...new Set(
      week1Vocabulary
        .map(
          (item) => item.english,
        )
        .filter(
          (answer) =>
            answer !==
            correctItem.english,
        ),
    ),
  ];

  const shuffledDistractors =
    shuffleArray(
      uniqueDistractors,
    ).slice(0, 3);

  return shuffleArray([
    correctItem.english,
    ...shuffledDistractors,
  ]);
}
