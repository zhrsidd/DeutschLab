import { useState } from "react";

import { ArrowRight, RotateCcw } from "lucide-react";

import type { ComprehensionQuestion } from "../data/lessons/week1Checkpoint";

import { useGermanSpeech } from "../hooks/useGermanSpeech";

import { trackAnswer } from "../lib/db";
import { describeReviewConcept } from "../lib/reviewExercises";

import {
  ErrorMessage,
  LessonShell,
  ProgressBar,
  Stat,
} from "./lesson/LessonParts";

import ComprehensionSection from "./checkpoint/ComprehensionSection";
import { InlineLoader } from "./shell/Loaders";

export interface ComprehensionGroup {
  id: string;
  heading: string;
  /** Reading: the text shown above the questions. */
  passage?: string;
  questions: ComprehensionQuestion[];
}

export interface ComprehensionLessonProps {
  kicker: string;
  title: string;
  summary: string;
  mode: "reading" | "listening";
  groups: ComprehensionGroup[];
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
}

type Stage = "intro" | "practice" | "results";

/*
 * Shared flow for reading-001 and listening-002:
 * intro → question groups → results, passing at 80%.
 * Only questions with a `concept` can create Mistakes / Review items.
 */
export default function ComprehensionLesson({
  kicker,
  title,
  summary,
  mode,
  groups,
  onBack,
  onFinish,
  onSaveAttempt,
}: ComprehensionLessonProps) {
  const total = groups.reduce((sum, group) => sum + group.questions.length, 0);
  const passingScore = Math.ceil(total * 0.8);

  const [stage, setStage] = useState<Stage>("intro");
  const [groupIndex, setGroupIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speech = useGermanSpeech();

  const score = scores.reduce((sum, value) => sum + value, 0);
  const passed = score >= passingScore;
  const group = groups[groupIndex];

  const needsVoice = mode === "listening";
  const audioChecking = needsVoice && !speech.checked;
  const audioBlocked = needsVoice && speech.checked && !speech.available;

  const start = () => {
    speech.stop();
    setError(null);
    setScores([]);
    setGroupIndex(0);
    setRound((current) => current + 1);
    setStage("practice");
  };

  const recordConcept = (
    question: ComprehensionQuestion,
    correct: boolean,
    answer: string,
  ) => {
    if (correct || !question.concept) return;

    const concept = describeReviewConcept(
      question.concept.sourceType,
      question.concept.sourceId,
    );

    if (!concept) return;

    trackAnswer({
      sourceType: question.concept.sourceType,
      sourceId: question.concept.sourceId,
      category: `${mode} · concept`,
      prompt: concept.prompt,
      expected: concept.expected,
      userAnswer: answer,
      correct: false,
      audioText: concept.audioText,
    });
  };

  const completeGroup = async (groupScore: number) => {
    speech.stop();

    const next = [...scores, groupScore];
    setScores(next);

    if (groupIndex < groups.length - 1) {
      setGroupIndex((current) => current + 1);
      return;
    }

    const finalScore = next.reduce((sum, value) => sum + value, 0);

    try {
      setSavingAttempt(true);
      setError(null);
      await onSaveAttempt(finalScore, total);
      setStage("results");
    } catch (saveError) {
      console.error("Failed to save lesson attempt:", saveError);
      setError("Your score could not be saved. Please try again.");
      setScores(next.slice(0, -1));
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

  if (stage === "intro") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">{kicker}</p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {title}
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            {summary}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat
              label={mode === "reading" ? "Texts" : "Clips"}
              value={String(groups.length)}
            />
            <Stat label="Questions" value={String(total)} />
            <Stat label="Pass" value={`${passingScore}/${total}`} />
          </div>

          {audioBlocked ? (
            <AudioProblem onExit={onBack} />
          ) : (
            <button
              type="button"
              onClick={start}
              className="mt-8 flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Begin lesson
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </LessonShell>
    );
  }

  if (stage === "practice") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={(groupIndex / groups.length) * 100} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            {group.heading} · {groupIndex + 1} of {groups.length}
          </p>

          {audioChecking ? (
            <p className="mt-8 text-neutral-500">Checking for a German voice…</p>
          ) : null}

          {audioBlocked ? <AudioProblem onExit={onBack} /> : null}

          {!audioChecking && !audioBlocked ? (
            <ComprehensionSection
              key={`${round}-${group.id}`}
              questions={group.questions}
              passage={group.passage}
              speech={speech}
              onResult={recordConcept}
              onComplete={(groupScore) => void completeGroup(groupScore)}
            />
          ) : null}

          {savingAttempt ? (
            <p className="mt-4 text-center text-sm text-neutral-400">
              <InlineLoader label="Saving…" />
            </p>
          ) : null}

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        </div>
      </LessonShell>
    );
  }

  return (
    <LessonShell onBack={onBack}>
      <div className="mx-auto max-w-2xl px-8 py-12 text-center">
        <p className="text-sm font-medium text-neutral-400">Lesson complete</p>

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
            ? "You reached the target for this lesson."
            : `You need at least ${passingScore}/${total} before this lesson is marked complete. Try again; you'll see the same ${mode === "reading" ? "texts" : "clips"}.`}
        </p>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        {passed ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={start}
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
          <button
            type="button"
            onClick={start}
            className="mx-auto mt-8 flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            <RotateCcw size={17} />
            Try again
          </button>
        )}
      </div>
    </LessonShell>
  );
}

function AudioProblem({ onExit }: { onExit: () => void }) {
  return (
    <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6">
      <p className="font-medium">Listening needs a German voice</p>

      <p className="mt-2 text-sm leading-6 text-neutral-500">
        No German voice is available on this system, so the clips can't be
        played. Nothing has been marked and nothing is saved. Add a voice in
        System Settings → Accessibility → Spoken Content → System Voice →
        Manage Voices, then come back to this lesson.
      </p>

      <button
        type="button"
        onClick={onExit}
        className="mt-5 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
      >
        Exit lesson
      </button>
    </div>
  );
}
