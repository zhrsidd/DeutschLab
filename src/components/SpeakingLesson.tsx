import { useState } from "react";

import {
  ArrowRight,
  Check,
  Eye,
  Mic,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";

import {
  week1SpeakingConfig,
  type SpeakingLessonConfig,
} from "../data/lessons/week1Speaking";

import { formatTime, useCountdown } from "../hooks/useCountdown";
import { useGermanSpeech } from "../hooks/useGermanSpeech";

import AISpeakingExaminer from "./ai/AISpeakingExaminer";
import {
  ErrorMessage,
  LessonShell,
  ProgressBar,
  Stat,
} from "./lesson/LessonParts";

type Stage = "intro" | "prep" | "drills" | "final" | "assess" | "results";

interface SpeakingLessonProps {
  /** Task id (for optional AI feedback history); defaults to speaking-001. */
  taskId?: string;
  /** Lesson content; defaults to the Week 1 self-introduction. */
  config?: SpeakingLessonConfig;
  /** Opens a lesson recommended by AI feedback. */
  onOpenLesson?: (taskId: string) => void;
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
}

const NORMAL_RATE = 0.88;
const STAGE_PROGRESS: Record<Stage, number> = {
  intro: 0,
  prep: 20,
  drills: 40,
  final: 60,
  assess: 80,
  results: 100,
};

export default function SpeakingLesson({
  taskId = "speaking-001",
  config = week1SpeakingConfig,
  onOpenLesson,
  onBack,
  onFinish,
  onSaveAttempt,
}: SpeakingLessonProps) {
  const {
    selfAssessment,
    prompts: speakingPrompts,
    passScore: SPEAKING_PASS_SCORE,
  } = config;
  const total = selfAssessment.length;

  const [stage, setStage] = useState<Stage>("intro");
  const [drillIndex, setDrillIndex] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(() =>
    selfAssessment.map(() => false),
  );
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speech = useGermanSpeech();

  const score = checked.filter(Boolean).length;
  const passed = score >= SPEAKING_PASS_SCORE;

  const goTo = (next: Stage) => {
    speech.stop();
    setStage(next);
  };

  const startFinal = () => {
    setChecked(selfAssessment.map(() => false));
    setError(null);
    goTo("final");
  };

  const nextDrill = () => {
    speech.stop();

    if (drillIndex < speakingPrompts.length - 1) {
      setDrillIndex((current) => current + 1);
    } else {
      startFinal();
    }
  };

  const submitAssessment = async () => {
    try {
      setSavingAttempt(true);
      setError(null);
      await onSaveAttempt(score, total);
      goTo("results");
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

  const bar =
    stage === "drills"
      ? 40 + (drillIndex / speakingPrompts.length) * 20
      : STAGE_PROGRESS[stage];

  /*
   * INTRO
   */

  if (stage === "intro") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            {config.kicker}
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {config.title}
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            {config.intro}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label="Prompts" value={String(speakingPrompts.length)} />
            <Stat label="Final" value={config.finalLabel} />
            <Stat label="Check" value="Self-rated" />
          </div>

          <div className="mt-10 rounded-2xl border border-black/5 bg-neutral-50 p-5">
            <p className="text-sm font-medium">How it works</p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Speak out loud, to yourself. DeutschLab doesn't record or listen
              to you, so you rate yourself honestly at the end. You need{" "}
              {SPEAKING_PASS_SCORE}/{total} to complete the lesson.
            </p>
          </div>

          <button
            type="button"
            onClick={() => goTo("prep")}
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
   * GUIDED PREPARATION
   */

  if (stage === "prep") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={bar} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">Preparation</p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Your sentence frames
          </h2>

          <p className="mt-3 leading-7 text-neutral-500">
            Listen, then say each one out loud. Replace ___ with your own
            information.
          </p>

          <div className="mt-6 space-y-3">
            {config.frames.map((item) => (
              <div
                key={item.frame}
                className="flex items-center justify-between gap-4 rounded-xl border border-black/5 bg-white px-5 py-4"
              >
                <div>
                  <p className="text-lg font-medium">{item.frame}</p>
                  <p className="text-sm text-neutral-400">{item.english}</p>
                </div>

                <PlayButton
                  disabled={!speech.available}
                  label={`Play ${item.example}`}
                  onClick={() => speech.speak(item.example, NORMAL_RATE)}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-neutral-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{config.sampleLabel}</p>

              <PlayButton
                disabled={!speech.available}
                label={`Play ${config.sampleLabel.toLowerCase()}`}
                onClick={() => speech.speak(config.sample, NORMAL_RATE)}
              />
            </div>

            <p className="mt-2 leading-7">{config.sample}</p>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              {config.sampleEnglish}
            </p>
          </div>

          {audioMissing ? <AudioNotice /> : null}

          <button
            type="button"
            onClick={() => {
              setDrillIndex(0);
              goTo("drills");
            }}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Start speaking prompts
            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  /*
   * CONTROLLED SPEAKING
   */

  if (stage === "drills") {
    const prompt = speakingPrompts[drillIndex];

    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={bar} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Prompt {drillIndex + 1} of {speakingPrompts.length}
          </p>

          <DrillCard
            key={prompt.id}
            english={prompt.english}
            german={prompt.german}
            speech={speech}
            seconds={config.drillSeconds}
            isLast={drillIndex === speakingPrompts.length - 1}
            onNext={nextDrill}
          />

          {audioMissing ? <AudioNotice /> : null}
        </div>
      </LessonShell>
    );
  }

  /*
   * FINAL CHALLENGE
   */

  if (stage === "final") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={bar} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Final challenge
          </p>

          <FinalChallenge
            config={config}
            onContinue={() => goTo("assess")}
          />

          <AISpeakingExaminer
            taskId={taskId}
            task={{
              prompt: config.finalHeading,
              cues: config.finalCues,
              checklist: selfAssessment,
            }}
            onOpenLesson={onOpenLesson}
          />
        </div>
      </LessonShell>
    );
  }

  /*
   * SELF-ASSESSMENT
   */

  if (stage === "assess") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={bar} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Self-assessment
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            How did it go?
          </h2>

          <p className="mt-3 leading-7 text-neutral-500">
            Tick each statement that is honestly true. You need{" "}
            {SPEAKING_PASS_SCORE} of {total}.
          </p>

          <div className="mt-6 space-y-3">
            {selfAssessment.map((statement, index) => {
              const on = checked[index];

              return (
                <button
                  key={statement}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() =>
                    setChecked((current) =>
                      current.map((value, i) =>
                        i === index ? !value : value,
                      ),
                    )
                  }
                  className={[
                    "flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition",
                    on
                      ? "border-neutral-900 bg-white"
                      : "border-black/5 bg-white hover:bg-neutral-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                      on
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-black/20",
                    ].join(" ")}
                  >
                    {on ? <Check size={15} className="dl-check" aria-hidden="true" /> : null}
                  </span>

                  <span className="font-medium">{statement}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-center text-sm text-neutral-400">
            {score} of {total} ticked
          </p>

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}

          <button
            type="button"
            disabled={savingAttempt}
            onClick={() => void submitAssessment()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:opacity-40"
          >
            {savingAttempt ? "Saving…" : "See results"}
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
          {passed ? "Well done." : "One more try."}
        </h1>

        <p className="mx-auto mt-3 max-w-md leading-7 text-neutral-500">
          {passed
            ? config.passMessage
            : `You need at least ${SPEAKING_PASS_SCORE}/${total} before this lesson is marked complete. ${config.failMessage}`}
        </p>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        {passed ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => goTo("prep")}
              disabled={finishing}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
            >
              <RotateCcw size={17} />
              Practise again
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
              onClick={() => goTo("prep")}
              className="rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Review frames
            </button>

            <button
              type="button"
              onClick={startFinal}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <RotateCcw size={17} />
              Try again
            </button>
          </div>
        )}
      </div>
    </LessonShell>
  );
}

type Speech = ReturnType<typeof useGermanSpeech>;

function DrillCard({
  english,
  german,
  speech,
  seconds,
  isLast,
  onNext,
}: {
  english: string;
  german: string;
  speech: Speech;
  seconds: number;
  isLast: boolean;
  onNext: () => void;
}) {
  const timer = useCountdown(seconds);
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const begin = () => {
    setAttempted(true);
    timer.start();
  };

  return (
    <>
      <h2 className="mt-8 text-center text-3xl font-semibold tracking-tight">
        {english}
      </h2>

      <p className="mt-3 text-center text-neutral-400">
        Say it out loud in German, then check.
      </p>

      <div className="mt-8 rounded-3xl border border-black/5 bg-white p-8 text-center">
        <p className="text-6xl font-semibold tabular-nums tracking-tight">
          {formatTime(timer.remaining)}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          {timer.running ? (
            <button
              type="button"
              onClick={timer.stop}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Square size={15} />
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={begin}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <Mic size={16} />
              {attempted ? "Speak again" : "Start speaking"}
            </button>
          )}
        </div>
      </div>

      {revealed ? (
        <div className="mt-6 rounded-xl bg-neutral-50 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Model answer
          </p>
          <p className="mt-2 text-xl font-medium">{german}</p>

          <div className="mt-3">
            <PlayButton
              disabled={!speech.available || !attempted}
              label="Replay model answer"
              text="Replay"
              onClick={() => speech.speak(german, NORMAL_RATE)}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mx-auto mt-6 flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          <Eye size={16} />
          Reveal answer
        </button>
      )}

      <button
        type="button"
        disabled={!attempted || timer.running}
        onClick={onNext}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isLast ? "Start final challenge" : "Next prompt"}
        <ArrowRight size={17} />
      </button>
    </>
  );
}

function FinalChallenge({
  config,
  onContinue,
}: {
  config: SpeakingLessonConfig;
  onContinue: () => void;
}) {
  const FINAL_SECONDS = config.finalSeconds;
  const timer = useCountdown(FINAL_SECONDS);
  const [started, setStarted] = useState(false);

  const begin = () => {
    setStarted(true);
    timer.start();
  };

  const restart = () => {
    timer.reset();
    setStarted(false);
  };

  const finishedNaturally = started && !timer.running && timer.remaining === 0;
  const stoppedEarly = started && !timer.running && timer.remaining > 0;

  return (
    <>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">
        {config.finalHeading}
      </h2>

      {config.finalHint ? (
        <p className="mt-3 text-neutral-500">{config.finalHint}</p>
      ) : null}

      <div className="mt-6 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
        <p className="font-medium text-fg">Cues (optional)</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {config.finalCues.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-8 text-center">
        <p className="text-7xl font-semibold tabular-nums tracking-tight">
          {formatTime(timer.remaining)}
        </p>

        <div className="mx-auto mt-5 h-1.5 max-w-xs overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-progress transition-all duration-300"
            style={{
              width: `${((FINAL_SECONDS - timer.remaining) / FINAL_SECONDS) * 100}%`,
            }}
          />
        </div>

        {finishedNaturally ? (
          <p className="mt-4 text-sm text-neutral-500">
            {config.finishedText}
          </p>
        ) : null}

        {stoppedEarly ? (
          <p className="mt-4 text-sm text-neutral-500">
            Stopped at {formatTime(FINAL_SECONDS - timer.remaining)}.
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-3">
          {timer.running ? (
            <button
              type="button"
              onClick={timer.stop}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Square size={15} />
              Stop early
            </button>
          ) : (
            <button
              type="button"
              onClick={begin}
              disabled={started}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:hidden"
            >
              <Mic size={16} />
              Start
            </button>
          )}

          {started ? (
            <button
              type="button"
              onClick={restart}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <RotateCcw size={15} />
              Restart
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        disabled={!started || timer.running}
        onClick={onContinue}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Continue to self-assessment
        <ArrowRight size={17} />
      </button>
    </>
  );
}

function PlayButton({
  disabled,
  label,
  text = "Play",
  onClick,
}: {
  disabled: boolean;
  label: string;
  text?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Volume2 size={16} />
      {text}
    </button>
  );
}

function AudioNotice() {
  return (
    <p className="mt-6 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-500">
      No German voice is available on this system, so audio playback is turned
      off. You can still practise using the written frames.
    </p>
  );
}
