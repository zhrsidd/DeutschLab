import { useMemo, useState } from "react";

import {
  ArrowRight,
  Check,
  RotateCcw,
  Turtle,
  Volume2,
  X,
} from "lucide-react";

import {
  listeningTips,
  warmupPhrases,
  week1ListeningQuiz,
} from "../data/lessons/week1Listening";

import { useGermanSpeech } from "../hooks/useGermanSpeech";

import { trackAnswer } from "../lib/db";

import {
  ErrorMessage,
  LessonShell,
  ProgressBar,
  Stat,
} from "./lesson/LessonParts";

import { shuffleArray } from "./lesson/shuffle";

type Stage = "intro" | "warmup" | "practice" | "results";

interface ListeningLessonProps {
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
}

const NORMAL_RATE = 0.88;
const SLOW_RATE = 0.7;

const kindLabel = {
  meaning: "Meaning",
  sentence: "Which sentence",
  passage: "Short introduction",
} as const;

export default function ListeningLesson({
  onBack,
  onFinish,
  onSaveAttempt,
}: ListeningLessonProps) {
  const questions = week1ListeningQuiz;
  const total = questions.length;
  const passingScore = Math.ceil(total * 0.8);

  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speech = useGermanSpeech();

  const question = questions[index];
  const answered = chosen !== null;
  const correct = chosen === question.answer;
  const passed = score >= passingScore;

  const options = useMemo(
    () => shuffleArray(question.options),
    [question],
  );

  const startPractice = () => {
    speech.stop();
    setError(null);
    setIndex(0);
    setScore(0);
    setChosen(null);
    setStage("practice");
  };

  const choose = (option: string) => {
    if (answered) return;

    const isCorrect = option === question.answer;

    setChosen(option);
    if (isCorrect) setScore((current) => current + 1);

    trackAnswer({
      sourceType: "listening",
      sourceId: question.id,
      category: `listening · ${question.kind}`,
      prompt: `Listen: ${question.prompt}`,
      expected: `${question.answer} (“${question.audio}”)`,
      userAnswer: option,
      correct: isCorrect,
      audioText: question.audio,
    });
  };

  const next = async () => {
    if (!answered) return;

    setError(null);
    speech.stop();

    if (index < total - 1) {
      setIndex((current) => current + 1);
      setChosen(null);
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

  const audioMissing = speech.checked && !speech.available;

  /*
   * INTRO
   */

  if (stage === "intro") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Week 1 · Listening
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Listen for introductions
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            Train your ear on greetings and simple introductions. In the
            practice you'll hear German first, with no text on screen, then
            choose what you heard.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label="Warm-up" value={`${warmupPhrases.length} phrases`} />
            <Stat label="Practice" value={`${total} Qs`} />
            <Stat label="Audio" value="Replayable" />
          </div>

          <div className="mt-10 rounded-2xl border border-black/5 bg-neutral-50 p-5">
            <p className="text-sm font-medium">Goal</p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Score at least {passingScore}/{total} to complete this lesson.
              Headphones help. You can replay every clip, normally or slowly.
            </p>
          </div>

          {audioMissing ? <AudioNotice /> : null}

          <button
            type="button"
            onClick={() => setStage("warmup")}
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
   * WARM-UP (text visible; not assessed)
   */

  if (stage === "warmup") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={33} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Listening warm-up
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Hear the phrases first
          </h2>

          <p className="mt-3 leading-7 text-neutral-500">
            Play each phrase while reading it. Not assessed: this is just to
            tune your ear.
          </p>

          <div className="mt-6 space-y-3">
            {warmupPhrases.map((phrase) => (
              <div
                key={phrase.german}
                className="flex items-center justify-between gap-4 rounded-xl border border-black/5 bg-white px-5 py-4"
              >
                <div>
                  <p className="text-lg font-medium">{phrase.german}</p>
                  <p className="text-sm text-neutral-400">{phrase.english}</p>
                </div>

                <button
                  type="button"
                  disabled={!speech.available}
                  onClick={() => speech.speak(phrase.german, NORMAL_RATE)}
                  aria-label={`Play ${phrase.german}`}
                  className="flex shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Volume2 size={16} />
                  Play
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
            <p className="font-medium text-fg">Listening tips</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {listeningTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          {audioMissing ? <AudioNotice /> : null}

          <button
            type="button"
            disabled={!speech.available}
            onClick={startPractice}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Start listening practice
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
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={((index + 1) / total) * 100} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-400">
              {kindLabel[question.kind]} · {index + 1} of {total}
            </p>

            <p className="text-sm text-neutral-400">Score {score}</p>
          </div>

          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-8 text-center">
            <button
              type="button"
              disabled={!speech.available}
              onClick={() => speech.speak(question.audio, NORMAL_RATE)}
              aria-label="Play audio"
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-neutral-900 text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Volume2 size={36} strokeWidth={1.6} />
            </button>

            <p className="mt-4 text-sm font-medium">Play</p>

            <button
              type="button"
              disabled={!speech.available}
              onClick={() => speech.speak(question.audio, SLOW_RATE)}
              className="mx-auto mt-3 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Turtle size={16} />
              Slower
            </button>

            {audioMissing ? <AudioNotice /> : null}

            {answered ? (
              <div className="mt-6 border-t border-black/5 pt-5 text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Transcript
                </p>
                <p className="mt-2 text-lg font-medium">{question.audio}</p>
                {question.translation ? (
                  <p className="mt-1 text-neutral-500">
                    {question.translation}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <h2 className="mt-8 text-center text-2xl font-semibold tracking-tight">
            {question.prompt}
          </h2>

          <div className="mt-6 grid gap-3">
            {options.map((option) => {
              const isSelected = chosen === option;
              const isCorrect = option === question.answer;

              let appearance =
                "border-black/5 bg-white hover:bg-neutral-50";

              if (answered) {
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
                  disabled={answered}
                  onClick={() => choose(option)}
                  className={`flex min-h-14 items-center justify-between rounded-xl border px-5 py-4 text-left transition ${appearance}`}
                >
                  <span className="font-medium">{option}</span>

                  {answered && isCorrect ? <Check size={18} className="dl-check" aria-hidden="true" /> : null}
                  {answered && isSelected && !isCorrect ? (
                    <X size={18} />
                  ) : null}
                </button>
              );
            })}
          </div>

          {answered ? (
            <div
              className={[
                "mt-6 rounded-xl px-5 py-4",
                correct
                  ? "dl-feedback bg-emerald-50 text-emerald-900"
                  : "dl-feedback bg-red-50 text-red-900",
              ].join(" ")}
            >
              <p className="font-medium">
                {correct ? "Correct." : "Not quite."}
              </p>

              {!correct ? (
                <p className="mt-1 text-sm leading-6">
                  Correct answer: <strong>{question.answer}</strong>
                </p>
              ) : null}

              <p className="mt-1 text-sm leading-6 opacity-80">
                {question.explanation}
              </p>
            </div>
          ) : null}

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}

          <button
            type="button"
            disabled={!answered || savingAttempt}
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
            className="h-full rounded-full bg-progress transition-all duration-300"
            style={{ width: `${(score / total) * 100}%` }}
          />
        </div>

        <h1 className="mt-7 text-3xl font-semibold tracking-tight">
          {passed ? "Nice work." : "One more pass."}
        </h1>

        <p className="mx-auto mt-3 max-w-md leading-7 text-neutral-500">
          {passed
            ? "You can follow simple greetings and introductions. Keep listening to short clips often."
            : `You need at least ${passingScore}/${total} before this lesson is marked complete. Replay the warm-up phrases and try again.`}
        </p>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        {passed ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setStage("warmup")}
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
              onClick={() => setStage("warmup")}
              className="rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Review warm-up
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

function AudioNotice() {
  return (
    <p className="mt-6 rounded-xl bg-neutral-50 px-4 py-3 text-left text-sm leading-6 text-neutral-500">
      Audio unavailable: no German voice was found on this system, so the
      listening practice is turned off. Add one in System Settings →
      Accessibility → Spoken Content → System Voice → Manage Voices.
    </p>
  );
}
