import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRight, Check, RotateCcw, X } from "lucide-react";

import {
  duVersusSie,
  guidedExamples,
  isCorrectTyped,
  normaliseGerman,
  pronouns,
  seinConjugation,
  week1SeinQuiz,
  type GrammarQuestion,
} from "../data/lessons/week1Sein";

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
  | "explain"
  | "table"
  | "examples"
  | "practice"
  | "results";

interface GrammarLessonProps {
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
}

const teachingStages: Stage[] = ["explain", "table", "examples"];

const kindLabel: Record<GrammarQuestion["kind"], string> = {
  choice: "Recognise",
  fill: "Fill in the blank",
  translate: "Translate into German",
};

export default function GrammarLesson({
  onBack,
  onFinish,
  onSaveAttempt,
}: GrammarLessonProps) {
  const questions = week1SeinQuiz;
  const total = questions.length;
  const passingScore = Math.ceil(total * 0.8);

  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [typed, setTyped] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  const question = questions[index];
  const passed = score >= passingScore;

  const options = useMemo(
    () =>
      question.kind === "choice" ? shuffleArray(question.options) : [],
    [question],
  );

  // Focus the text box when a typed exercise appears.
  useEffect(() => {
    if (stage === "practice" && question.kind !== "choice") {
      inputRef.current?.focus();
    }
  }, [stage, index, question.kind]);

  // After answering, focus Continue so Enter moves on.
  useEffect(() => {
    if (submitted) continueRef.current?.focus();
  }, [submitted]);

  const resetQuestion = () => {
    setTyped("");
    setChosen(null);
    setSubmitted(false);
    setWasCorrect(false);
  };

  const startPractice = () => {
    setError(null);
    setIndex(0);
    setScore(0);
    resetQuestion();
    setStage("practice");
  };

  const record = (correct: boolean, userAnswer: string) => {
    setWasCorrect(correct);
    setSubmitted(true);
    if (correct) setScore((current) => current + 1);

    const prompt =
      question.kind === "choice"
        ? question.prompt
        : question.kind === "fill"
          ? `Complete: ${question.sentence}`
          : `Translate into German: ${question.english}`;

    const expected =
      question.kind === "translate"
        ? question.accepted[0]
        : question.answer;

    trackAnswer({
      sourceType: "grammar",
      sourceId: question.id,
      category: `grammar · ${question.kind}`,
      prompt,
      expected,
      userAnswer,
      correct,
      enterOnCorrect: true,
    });
  };

  const chooseOption = (option: string) => {
    if (submitted || question.kind !== "choice") return;
    setChosen(option);
    record(option === question.answer, option);
  };

  const submitTyped = () => {
    if (submitted || typed.trim() === "") return;

    if (question.kind === "fill") {
      record(
        normaliseGerman(typed) === normaliseGerman(question.answer),
        typed,
      );
    } else if (question.kind === "translate") {
      record(isCorrectTyped(typed, question.accepted), typed);
    }
  };

  const next = async () => {
    if (!submitted) return;

    setError(null);

    if (index < total - 1) {
      setIndex((current) => current + 1);
      resetQuestion();
      return;
    }

    try {
      setSavingAttempt(true);
      await onSaveAttempt(score, total);
      setStage("results");
    } catch (saveError) {
      console.error("Failed to save lesson attempt:", saveError);
      setError("Your score could not be saved. Please try again.");
    } finally {
      setSavingAttempt(false);
    }
  };

  const finishLesson = async () => {
    try {
      setError(null);
      setFinishing(true);
      await onFinish();
    } catch (finishError) {
      console.error("Failed to finish lesson:", finishError);
      setError(
        "DeutschLab could not mark the lesson as complete. Please try again.",
      );
      setFinishing(false);
    }
  };

  const nextTeachingStage = () => {
    const position = teachingStages.indexOf(stage);

    if (position < teachingStages.length - 1) {
      setStage(teachingStages[position + 1]);
    } else {
      startPractice();
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
            Week 1 · Grammar
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Personal pronouns + sein
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            Almost every German sentence needs a subject and a verb. Learn the
            pronouns for who is acting, and sein, the verb for "to be", so you
            can say who you are and who others are.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label="Learn" value="~6 min" />
            <Stat label="Practice" value={`${total} Qs`} />
            <Stat label="Types" value="3" />
          </div>

          <div className="mt-10 rounded-2xl border border-black/5 bg-neutral-50 p-5">
            <p className="text-sm font-medium">Goal</p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Score at least {passingScore}/{total} to complete this lesson.
              You'll recognise forms, fill gaps and write short sentences in
              German.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStage("explain")}
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
   * TEACHING: explain / table / examples
   */

  if (teachingStages.includes(stage)) {
    const step = teachingStages.indexOf(stage);

    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={((step + 1) / teachingStages.length) * 100} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Learn · {step + 1} of {teachingStages.length}
          </p>

          {stage === "explain" ? (
            <>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Who is doing it?
              </h2>

              <p className="mt-3 leading-7 text-neutral-500">
                A personal pronoun replaces a person or thing: "Anna is a
                student" becomes "She is a student". German has nine to learn.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {pronouns.map((pronoun) => (
                  <div
                    key={`${pronoun.german}-${pronoun.english}`}
                    className="rounded-xl border border-black/5 bg-white p-4"
                  >
                    <p className="text-xl font-semibold">{pronoun.german}</p>
                    <p className="text-neutral-500">{pronoun.english}</p>
                    {pronoun.note ? (
                      <p className="mt-1 text-xs leading-5 text-neutral-400">
                        {pronoun.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
                <p className="font-medium text-fg">du vs Sie</p>
                <p className="mt-1">{duVersusSie}</p>
              </div>

              <div className="mt-4 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
                <p className="font-medium text-fg">
                  sein = "to be"
                </p>
                <p className="mt-1">
                  sein is the German "to be". Like English "am / is / are", it
                  changes form for each pronoun and you have to learn the forms.
                </p>
              </div>
            </>
          ) : null}

          {stage === "table" ? (
            <>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                sein in the present tense
              </h2>

              <div className="mt-6 overflow-hidden rounded-2xl border border-black/5 bg-white">
                {seinConjugation.map((row, rowIndex) => (
                  <div
                    key={row.pronoun}
                    className={[
                      "grid grid-cols-[1fr_1fr_1.5fr] items-center gap-4 px-5 py-4",
                      rowIndex !== seinConjugation.length - 1
                        ? "border-b border-black/5"
                        : "",
                    ].join(" ")}
                  >
                    <span className="text-neutral-500">{row.pronoun}</span>
                    <span className="text-xl font-semibold">{row.form}</span>
                    <span className="text-sm text-neutral-400">
                      {row.english}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
                Watch out: sie can mean "she" (sie ist), "they" (sie sind), and
                with a capital S, formal "you" (Sie sind). The verb form and the
                capital letter tell you which.
              </div>
            </>
          ) : null}

          {stage === "examples" ? (
            <>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                In school life
              </h2>

              <div className="mt-6 space-y-3">
                {guidedExamples.map((example) => (
                  <div
                    key={example.german}
                    className="rounded-xl border border-black/5 bg-white p-5"
                  >
                    <p className="text-lg font-medium">{example.german}</p>
                    <p className="mt-1 text-neutral-500">{example.english}</p>
                    <p className="mt-3 text-sm leading-6 text-neutral-400">
                      {example.note}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <button
            type="button"
            onClick={nextTeachingStage}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {stage === "examples" ? "Start practice" : "Continue"}
            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  /*
   * PRACTICE
   */

  if (stage === "practice") {
    const progress = ((index + 1) / total) * 100;
    const expected =
      question.kind === "choice"
        ? question.answer
        : question.kind === "fill"
          ? question.answer
          : question.accepted[0];

    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={progress} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-400">
              {kindLabel[question.kind]} · {index + 1} of {total}
            </p>

            <p className="text-sm text-neutral-400">Score {score}</p>
          </div>

          {question.kind === "choice" ? (
            <>
              <h2 className="mt-10 text-center text-3xl font-semibold tracking-tight">
                {question.prompt}
              </h2>

              <div className="mt-10 grid gap-3">
                {options.map((option) => {
                  const isSelected = chosen === option;
                  const isCorrect = option === question.answer;

                  let appearance =
                    "border-black/5 bg-white hover:bg-neutral-50";

                  if (submitted) {
                    if (isCorrect) {
                      appearance =
                        "dl-correct border-emerald-200 bg-emerald-50 text-emerald-900";
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
                      disabled={submitted}
                      onClick={() => chooseOption(option)}
                      className={`flex min-h-14 items-center justify-between rounded-xl border px-5 py-4 text-left transition ${appearance}`}
                    >
                      <span className="font-medium">{option}</span>

                      {submitted && isCorrect ? <Check size={18} className="dl-check" aria-hidden="true" /> : null}
                      {submitted && isSelected && !isCorrect ? (
                        <X size={18} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <form
              className="mt-10"
              onSubmit={(event) => {
                event.preventDefault();
                submitTyped();
              }}
            >
              <h2 className="text-center text-3xl font-semibold tracking-tight">
                {question.kind === "fill"
                  ? question.sentence
                  : question.english}
              </h2>

              <p className="mt-3 text-center text-neutral-400">
                {question.kind === "fill"
                  ? "Type the correct form of sein."
                  : "Write this in German."}
              </p>

              <input
                ref={inputRef}
                type="text"
                value={typed}
                readOnly={submitted}
                onChange={(event) => setTyped(event.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label="Your answer"
                className={[
                  "mt-8 w-full rounded-xl border bg-white px-5 py-4 text-lg outline-none transition focus:border-neutral-400",
                  submitted
                    ? wasCorrect
                      ? "dl-correct border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "dl-wrong border-red-200 bg-red-50 text-red-900"
                    : "border-black/10",
                ].join(" ")}
              />

              {!submitted ? (
                <button
                  type="submit"
                  disabled={typed.trim() === ""}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Check answer
                </button>
              ) : null}
            </form>
          )}

          {submitted ? (
            <div
              className={[
                "mt-6 rounded-xl px-5 py-4",
                wasCorrect
                  ? "dl-feedback bg-emerald-50 text-emerald-900"
                  : "dl-feedback bg-red-50 text-red-900",
              ].join(" ")}
            >
              <p className="font-medium">
                {wasCorrect ? "Correct." : "Not quite."}
              </p>

              {!wasCorrect && question.kind !== "choice" ? (
                <p className="mt-1 text-sm leading-6">
                  Expected: <strong>{expected}</strong>
                </p>
              ) : null}

              <p className="mt-1 text-sm leading-6 opacity-80">
                {question.explanation}
              </p>
            </div>
          ) : null}

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}

          <button
            ref={continueRef}
            type="button"
            disabled={!submitted || savingAttempt}
            onClick={() => void next()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {savingAttempt
              ? "Saving…"
              : index === total - 1
                ? "See results"
                : "Next question"}

            {!savingAttempt ? <ArrowRight size={17} /> : null}
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
          {score}/{total}
        </div>

        <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all duration-300"
            style={{ width: `${(score / total) * 100}%` }}
          />
        </div>

        <h1 className="mt-7 text-3xl font-semibold tracking-tight">
          {passed ? "Nice work." : "One more pass."}
        </h1>

        <p className="mx-auto mt-3 max-w-md leading-7 text-neutral-500">
          {passed
            ? "You can use the pronouns with sein. Next you'll build on this with regular verbs."
            : `You need at least ${passingScore}/${total} before this lesson is marked complete. Review the table and try again.`}
        </p>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        {passed ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setStage("explain")}
              disabled={finishing}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
            >
              <RotateCcw size={17} />
              Review again
            </button>

            <button
              type="button"
              onClick={() => void finishLesson()}
              disabled={finishing}
              className="rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
            >
              {finishing ? "Finishing…" : "Finish lesson"}
            </button>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setStage("table")}
              className="rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Review table
            </button>

            <button
              type="button"
              onClick={startPractice}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <RotateCcw size={17} />
              Retry practice
            </button>
          </div>
        )}
      </div>
    </LessonShell>
  );
}
