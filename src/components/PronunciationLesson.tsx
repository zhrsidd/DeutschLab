import { useMemo, useState } from "react";

import {
  ArrowRight,
  Check,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";

import {
  week1PronunciationQuiz,
  week1Sounds,
} from "../data/lessons/week1Pronunciation";

import {
  ErrorMessage,
  LessonShell,
  ProgressBar,
  Stat,
} from "./lesson/LessonParts";

import { useGermanSpeech } from "../hooks/useGermanSpeech";

import { shuffleArray } from "./lesson/shuffle";

type Stage = "intro" | "learn" | "quiz" | "results";

interface PronunciationLessonProps {
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
}

export default function PronunciationLesson({
  onBack,
  onFinish,
  onSaveAttempt,
}: PronunciationLessonProps) {
  const questions = week1PronunciationQuiz;
  const total = questions.length;
  const passingScore = Math.ceil(total * 0.8);

  const [stage, setStage] = useState<Stage>("intro");
  const [learnIndex, setLearnIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speech = useGermanSpeech();

  const sound = week1Sounds[learnIndex];
  const question = questions[quizIndex];
  const passed = score >= passingScore;
  const answered = selectedAnswer !== null;
  const correct = selectedAnswer === question.answer;

  const options = useMemo(
    () => shuffleArray(question.options),
    [question],
  );

  const learnProgress = ((learnIndex + 1) / week1Sounds.length) * 100;
  const quizProgress = ((quizIndex + 1) / total) * 100;

  const resetQuiz = () => {
    setError(null);
    setQuizIndex(0);
    setScore(0);
    setSelectedAnswer(null);
  };

  const startLearning = () => {
    resetQuiz();
    setLearnIndex(0);
    setStage("learn");
  };

  const nextLearn = () => {
    if (learnIndex < week1Sounds.length - 1) {
      setLearnIndex((current) => current + 1);
      return;
    }

    resetQuiz();
    setStage("quiz");
  };

  const choose = (answer: string) => {
    if (answered) return;

    setSelectedAnswer(answer);
    if (answer === question.answer) setScore((current) => current + 1);
  };

  const nextQuestion = async () => {
    if (!answered) return;

    setError(null);

    if (quizIndex < total - 1) {
      setQuizIndex((current) => current + 1);
      setSelectedAnswer(null);
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

  /*
   * INTRO
   */

  if (stage === "intro") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Week 1 · Pronunciation
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            German sounds
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            German spelling is regular, but several letters sound different
            from English. Learn the eleven sounds that trip up most beginners,
            then check you can recognise them.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label="Sounds" value={String(week1Sounds.length)} />
            <Stat label="Learn" value="~5 min" />
            <Stat label="Quiz" value={`${total} Qs`} />
          </div>

          <div className="mt-10 rounded-2xl border border-black/5 bg-neutral-50 p-5">
            <p className="text-sm font-medium">Goal</p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Score at least {passingScore}/{total} to complete this lesson.
              Use the Play buttons to hear each word; headphones help.
            </p>
          </div>

          {speech.checked && !speech.available ? <SpeechNotice /> : null}

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
        <ProgressBar value={learnProgress} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-400">
              Learn · {learnIndex + 1} of {week1Sounds.length}
            </p>

            <p className="text-sm text-neutral-400">
              {Math.round(learnProgress)}%
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-10">
            <p className="text-sm font-medium uppercase tracking-wider text-neutral-400">
              Sound
            </p>

            <h2 className="mt-4 text-6xl font-semibold tracking-tight">
              {sound.sound}
            </h2>

            <p className="mt-5 leading-7 text-neutral-500">
              {sound.explanation}
            </p>

            <div className="my-8 h-px bg-black/5" />

            <div className="space-y-3">
              {sound.examples.map((example) => (
                <div
                  key={example.german}
                  className="flex items-center justify-between gap-4 rounded-xl bg-neutral-50 px-5 py-4"
                >
                  <div>
                    <p className="text-lg font-medium">{example.german}</p>
                    <p className="text-sm text-neutral-400">
                      {example.english}
                    </p>
                  </div>

                  <PlayButton
                    word={example.german}
                    available={speech.available}
                    onPlay={speech.speak}
                  />
                </div>
              ))}
            </div>

            {speech.checked && !speech.available ? <SpeechNotice /> : null}
          </div>

          <button
            type="button"
            onClick={nextLearn}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {learnIndex === week1Sounds.length - 1
              ? "Start quiz"
              : "Next sound"}

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
        <ProgressBar value={quizProgress} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-400">
              Quiz · {quizIndex + 1} of {total}
            </p>

            <p className="text-sm text-neutral-400">Score {score}</p>
          </div>

          {question.word ? (
            <div className="mt-10 flex items-center justify-center gap-4">
              <h2 className="text-5xl font-semibold tracking-tight">
                {question.word}
              </h2>

              <PlayButton
                word={question.word}
                available={speech.available}
                onPlay={speech.speak}
              />
            </div>
          ) : null}

          <p
            className={`text-center text-neutral-500 ${
              question.word ? "mt-4" : "mt-10 text-2xl text-neutral-900"
            }`}
          >
            {question.prompt}
          </p>

          <div className="mt-10 grid gap-3">
            {options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.answer;

              let appearance =
                "border-black/5 bg-white hover:bg-neutral-50";

              if (answered) {
                if (isCorrect) {
                  appearance =
                    "border-emerald-200 bg-emerald-50 text-emerald-900";
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
                  disabled={answered}
                  onClick={() => choose(option)}
                  className={`flex min-h-14 items-center justify-between rounded-xl border px-5 py-4 text-left transition ${appearance}`}
                >
                  <span className="font-medium">{option}</span>

                  {answered && isCorrect ? <Check size={18} /> : null}
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
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-red-50 text-red-900",
              ].join(" ")}
            >
              <p className="font-medium">
                {correct ? "Correct." : "Not quite."}
              </p>

              <p className="mt-1 text-sm leading-6 opacity-80">
                {question.explanation}
              </p>
            </div>
          ) : null}

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}

          <button
            type="button"
            disabled={!answered || savingAttempt}
            onClick={() => void nextQuestion()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {savingAttempt
              ? "Saving…"
              : quizIndex === total - 1
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
            ? "You can recognise the key Week 1 sounds. You'll practise producing them in speaking activities later."
            : `You need at least ${passingScore}/${total} before this lesson is marked complete. Review the sounds and try the quiz again.`}
        </p>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        {passed ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={startLearning}
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
              onClick={startLearning}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Review sounds
            </button>

            <button
              type="button"
              onClick={() => {
                resetQuiz();
                setStage("quiz");
              }}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <RotateCcw size={17} />
              Retry quiz
            </button>
          </div>
        )}
      </div>
    </LessonShell>
  );
}

function PlayButton({
  word,
  available,
  onPlay,
}: {
  word: string;
  available: boolean;
  onPlay: (text: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => onPlay(word)}
      aria-label={`Play ${word}`}
      className="flex shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Volume2 size={16} />
      Play
    </button>
  );
}

function SpeechNotice() {
  return (
    <p className="mt-6 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-500">
      No German voice is available on this system, so audio is turned off. You
      can add one in System Settings → Accessibility → Spoken Content → System
      Voice → Manage Voices.
    </p>
  );
}
