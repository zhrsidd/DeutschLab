import { useEffect, useMemo, useState } from "react";

import { ArrowRight, RotateCcw, Volume2 } from "lucide-react";

import {
  categoryLabels,
  type VocabularyItem,
} from "../data/lessons/week1Vocabulary";
import {
  week1VocabularySet,
  type VocabularySet,
} from "../data/lessons/vocabularySets";

import { useGermanSpeech } from "../hooks/useGermanSpeech";

import { trackAnswer } from "../lib/db";
import {
  loadResumeBatch,
  readLocalResume,
  saveResumeBatch,
} from "../lib/vocabResume";

import {
  buildBatchCheck,
  buildFinalQuiz,
  mistakeExpected,
  mistakePrompt,
  type VocabQuestion,
} from "../lib/vocabularyExercises";

import {
  ErrorMessage,
  LessonShell,
  ProgressBar,
  Stat,
} from "./lesson/LessonParts";

import RecallQuestion from "./vocabulary/RecallQuestion";
import { GermanWord, PluralShift } from "./vocabulary/GermanWord";

type Stage =
  | "intro"
  | "batchIntro"
  | "learn"
  | "check"
  | "quiz"
  | "results";

interface VocabularyLessonProps {
  /** Which vocabulary lesson to run; defaults to Week 1 (vocab-001). */
  set?: VocabularySet;
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
}

function itemsForBatch(set: VocabularySet, batchIndex: number): VocabularyItem[] {
  return set.batches[batchIndex].itemIds
    .map((id) => set.items.find((item) => item.id === id))
    .filter((item): item is VocabularyItem => item !== undefined);
}

export default function VocabularyLesson({
  set = week1VocabularySet,
  onBack,
  onFinish,
  onSaveAttempt,
}: VocabularyLessonProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [batchIndex, setBatchIndex] = useState(0);
  const [learnIndex, setLearnIndex] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const [checkScore, setCheckScore] = useState(0);
  const [quizAttempt, setQuizAttempt] = useState(1);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // localStorage gives an instant first value; SQLite (the durable store)
  // replaces it once loaded.
  const [resumeBatch, setResumeBatch] = useState(() => readLocalResume(set));

  useEffect(() => {
    let active = true;

    void loadResumeBatch(set).then((index) => {
      if (active) setResumeBatch(index);
    });

    return () => {
      active = false;
    };
  }, [set]);

  const speech = useGermanSpeech();

  const batch = set.batches[batchIndex];
  const batchItems = useMemo(() => itemsForBatch(set, batchIndex), [set, batchIndex]);
  const checkQuestions = useMemo(() => buildBatchCheck(batch), [batch]);
  const quizQuestions = useMemo(
    () => buildFinalQuiz(quizAttempt, set),
    [quizAttempt, set],
  );

  const batchCount = set.batches.length;
  const quizTotal = quizQuestions.length;
  const passingScore = Math.ceil(quizTotal * 0.8);
  const passed = quizScore >= passingScore;
  const isLastBatch = batchIndex === batchCount - 1;

  const learnItem = batchItems[learnIndex];
  const checkQuestion = checkQuestions[checkIndex];
  const quizQuestion = quizQuestions[quizIndex];

  const goToBatch = (index: number) => {
    speech.stop();
    void saveResumeBatch(set, index);
    setBatchIndex(index);
    setLearnIndex(0);
    setCheckIndex(0);
    setCheckScore(0);
    setStage("batchIntro");
  };

  const startQuiz = (attempt: number) => {
    speech.stop();
    setError(null);
    setQuizAttempt(attempt);
    setQuizIndex(0);
    setQuizScore(0);
    setStage("quiz");
  };

  const nextLearn = () => {
    speech.stop();

    if (learnIndex < batchItems.length - 1) {
      setLearnIndex((current) => current + 1);
    } else {
      setCheckIndex(0);
      setCheckScore(0);
      setStage("check");
    }
  };

  const recordCheck = (question: VocabQuestion, correct: boolean, answer: string) => {
    if (correct) {
      setCheckScore((current) => current + 1);
      return;
    }

    // Missed recall is worth tracking; correct checks don't enter review.
    trackAnswer({
      sourceType: "vocabulary",
      sourceId: question.reviewId,
      category: "vocabulary",
      prompt: mistakePrompt(question),
      expected: mistakeExpected(question),
      userAnswer: answer,
      correct: false,
      audioText: question.audioText,
    });
  };

  const nextCheck = () => {
    speech.stop();

    if (checkIndex < checkQuestions.length - 1) {
      setCheckIndex((current) => current + 1);
    } else if (isLastBatch) {
      startQuiz(quizAttempt);
    } else {
      goToBatch(batchIndex + 1);
    }
  };

  const recordQuiz = (question: VocabQuestion, correct: boolean, answer: string) => {
    if (correct) setQuizScore((current) => current + 1);

    trackAnswer({
      sourceType: "vocabulary",
      sourceId: question.reviewId,
      category: "vocabulary",
      prompt: mistakePrompt(question),
      expected: mistakeExpected(question),
      userAnswer: answer,
      correct,
      audioText: question.audioText,
      enterOnCorrect: true,
    });
  };

  const nextQuiz = async () => {
    speech.stop();
    setError(null);

    if (quizIndex < quizTotal - 1) {
      setQuizIndex((current) => current + 1);
      return;
    }

    try {
      setSavingAttempt(true);
      await onSaveAttempt(quizScore, quizTotal);
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
      void saveResumeBatch(set, null);
    } catch (finishError) {
      console.error("Failed to finish lesson:", finishError);
      setError(
        "DeutschLab could not mark the lesson as complete. Please try again.",
      );
      setFinishing(false);
    }
  };

  const audioMissing = speech.checked && !speech.available;

  /* Overall progress across batches (each batch: learn → check). */
  const batchProgress = (() => {
    let within = 0;

    if (stage === "learn") {
      within = (learnIndex / batchItems.length) * 0.7;
    } else if (stage === "check") {
      within = 0.7 + (checkIndex / checkQuestions.length) * 0.3;
    }

    return ((batchIndex + within) / batchCount) * 100;
  })();

  /*
   * INTRO
   */

  if (stage === "intro") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            {set.kicker}
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {set.title}
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            {set.intro.replace("{count}", String(set.items.length))}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label="Words" value={String(set.items.length)} />
            <Stat label="Batches" value={String(batchCount)} />
            <Stat label="Final quiz" value={`${quizTotal} Qs`} />
          </div>

          <div className="mt-10 rounded-2xl border border-black/5 bg-neutral-50 p-5">
            <p className="text-sm font-medium">Goal</p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Score at least {passingScore}/{quizTotal} on the final quiz to complete this
              lesson. Batch checks are practice and don't affect your score.
            </p>
          </div>

          {set.reminder ? <Reminder text={set.reminder} /> : null}

          {audioMissing ? <AudioNotice /> : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => goToBatch(0)}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Begin lesson
              <ArrowRight size={17} />
            </button>

            {resumeBatch > 0 ? (
              <button
                type="button"
                onClick={() => goToBatch(resumeBatch)}
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Resume at batch {resumeBatch + 1}
              </button>
            ) : null}
          </div>
        </div>
      </LessonShell>
    );
  }

  /*
   * BATCH INTRO
   */

  if (stage === "batchIntro") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={batchProgress} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Batch {batchIndex + 1} of {batchCount}
          </p>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            {batch.title}
          </h2>

          <p className="mt-4 leading-7 text-neutral-500">{batch.intro}</p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Stat label="Words" value={String(batchItems.length)} />
            <Stat label="Then" value={`${checkQuestions.length}-question check`} />
          </div>

          {audioMissing ? <AudioNotice /> : null}

          <button
            type="button"
            onClick={() => {
              setLearnIndex(0);
              setStage("learn");
            }}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Start batch
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
        <ProgressBar value={batchProgress} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <BatchHeader
            batchIndex={batchIndex}
            batchCount={batchCount}
            title={batch.title}
            position={learnIndex + 1}
            total={batchItems.length}
          />

          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-10">
            <p className="text-sm font-medium uppercase tracking-wider text-neutral-400">
              {categoryLabels[learnItem.category]}
            </p>

            <div className="mt-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-5xl font-semibold tracking-tight">
                <GermanWord key={learnItem.german} word={learnItem.german} />
              </h2>

              <button
                type="button"
                disabled={!speech.available}
                onClick={() =>
                  speech.speak(learnItem.audioText ?? learnItem.german)
                }
                aria-label={`Play ${learnItem.german}`}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Volume2 size={16} />
                Play
              </button>
            </div>

            <p className="mt-5 text-xl text-neutral-500">{learnItem.english}</p>

            {learnItem.plural ? (
              <div className="mt-4">
                <p className="sr-only">Plural: {learnItem.plural}</p>
                <p aria-hidden="true" className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                  Plural
                </p>
                <PluralShift key={learnItem.german} singular={learnItem.german} plural={learnItem.plural} />
              </div>
            ) : null}

            {learnItem.noPlural ? (
              <p className="mt-2 text-sm text-neutral-400">
                Plural: none (no ordinary plural)
              </p>
            ) : null}

            {learnItem.exampleGerman ? (
              <>
                <div className="my-8 h-px bg-black/5" />

                <p className="text-lg font-medium">{learnItem.exampleGerman}</p>

                {learnItem.exampleEnglish ? (
                  <p className="mt-2 leading-6 text-neutral-400">
                    {learnItem.exampleEnglish}
                  </p>
                ) : null}
              </>
            ) : null}

            {learnItem.note ? (
              <div className="mt-6 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-500">
                {learnItem.note}
              </div>
            ) : null}
          </div>

          {set.reminder ? <Reminder text={set.reminder} /> : null}

          <button
            type="button"
            onClick={nextLearn}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {learnIndex === batchItems.length - 1 ? "Quick check" : "Next word"}
            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  /*
   * BATCH CHECK
   */

  if (stage === "check") {
    const lastCheck = checkIndex === checkQuestions.length - 1;

    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={batchProgress} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <BatchHeader
            batchIndex={batchIndex}
            batchCount={batchCount}
            title={`${batch.title} · check`}
            position={checkIndex + 1}
            total={checkQuestions.length}
            trailing={`${checkScore} correct`}
          />

          <div className="mt-8">
            <RecallQuestion
              key={checkQuestion.id}
              question={checkQuestion}
              speech={speech}
              continueLabel={
                lastCheck
                  ? isLastBatch
                    ? "Start final quiz"
                    : "Next batch"
                  : "Next question"
              }
              onAnswered={(correct, answer) =>
                recordCheck(checkQuestion, correct, answer)
              }
              onNext={nextCheck}
            />
          </div>
        </div>
      </LessonShell>
    );
  }

  /*
   * FINAL QUIZ
   */

  if (stage === "quiz") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={((quizIndex + 1) / quizTotal) * 100} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-400">
              Final quiz · {quizIndex + 1} of {quizTotal}
            </p>

            <p className="text-sm text-neutral-400">Score {quizScore}</p>
          </div>

          <div className="mt-8">
            <RecallQuestion
              key={quizQuestion.id}
              question={quizQuestion}
              speech={speech}
              disabled={savingAttempt}
              continueLabel={
                savingAttempt
                  ? "Saving…"
                  : quizIndex === quizTotal - 1
                    ? "See results"
                    : "Next question"
              }
              onAnswered={(correct, answer) =>
                recordQuiz(quizQuestion, correct, answer)
              }
              onNext={() => void nextQuiz()}
            />
          </div>

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
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
          {quizScore}/{quizTotal}
        </div>

        <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all duration-300"
            style={{ width: `${(quizScore / quizTotal) * 100}%` }}
          />
        </div>

        <h1 className="mt-7 text-3xl font-semibold tracking-tight">
          {passed ? "Nice work." : "One more pass."}
        </h1>

        <p className="mx-auto mt-3 max-w-md leading-7 text-neutral-500">
          {passed
            ? "You've reached the target for this lesson. Words you missed will come back in Review."
            : `You need at least ${passingScore}/${quizTotal} before this lesson is marked complete. Review the batches and try the quiz again; it draws a fresh mix of words.`}
        </p>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        {passed ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => goToBatch(0)}
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
              onClick={() => goToBatch(0)}
              className="rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Review batches
            </button>

            <button
              type="button"
              onClick={() => startQuiz(quizAttempt + 1)}
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

function BatchHeader({
  batchIndex,
  batchCount,
  title,
  position,
  total,
  trailing,
}: {
  batchIndex: number;
  batchCount: number;
  title: string;
  position: number;
  total: number;
  trailing?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-neutral-400">
          Batch {batchIndex + 1} of {batchCount}
        </p>
        <p className="mt-1 font-medium">{title}</p>
      </div>

      <p className="text-sm text-neutral-400">
        {position} / {total}
        {trailing ? ` · ${trailing}` : ""}
      </p>
    </div>
  );
}

function Reminder({ text }: { text: string }) {
  return (
    <p className="mt-6 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-500">
      {text}
    </p>
  );
}

function AudioNotice() {
  return (
    <p className="mt-6 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-500">
      No German voice is available on this system, so audio is turned off. You
      can add one in System Settings → Accessibility → Spoken Content → System
      Voice → Manage Voices.
    </p>
  );
}
