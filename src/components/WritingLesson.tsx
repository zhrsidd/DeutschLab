import { useCallback, useEffect, useRef, useState } from "react";

import { ArrowRight, Check, RotateCcw } from "lucide-react";

import {
  dailyLifeLesson,
  type WritingLessonConfig,
} from "../data/lessons/week2Writing";

import {
  clearWritingDraft,
  getWritingDraft,
  saveWritingDraft,
} from "../lib/db";
import { countWords } from "../lib/text";

import { ErrorMessage, LessonShell, Stat } from "./lesson/LessonParts";

import AIWritingExaminer from "./ai/AIWritingExaminer";
import WritingSection from "./checkpoint/WritingSection";
import { SectionLoader } from "./shell/Loaders";

type Stage = "intro" | "prep" | "plan" | "write" | "results";

interface WritingLessonProps {
  /** Which writing task to run; defaults to writing-001. */
  config?: WritingLessonConfig;
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
  /** Opens a lesson recommended by AI feedback (the draft is saved first). */
  onOpenLesson?: (taskId: string) => void;
}

const SAVE_DELAY_MS = 400;

/*
 * writing-001: intro → sentence frames → planning → writing → self-check →
 * results. The paragraph is kept as a local draft: it survives restarts,
 * submitting never erases it, and only "Clear and start again" does.
 */
export default function WritingLesson({
  config = dailyLifeLesson,
  onBack,
  onFinish,
  onSaveAttempt,
  onOpenLesson,
}: WritingLessonProps) {
  const TASK_ID = config.taskId;
  const TOTAL = config.checklist.length;

  const [stage, setStage] = useState<Stage>("intro");
  const [loaded, setLoaded] = useState(false);
  const [draftWords, setDraftWords] = useState(0);
  const [editRound, setEditRound] = useState(1);
  const [planned, setPlanned] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftRef = useRef("");
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const persist = useCallback(async () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!dirtyRef.current) return;

    dirtyRef.current = false;

    try {
      await saveWritingDraft(TASK_ID, draftRef.current);
    } catch (saveError) {
      dirtyRef.current = true;
      console.error("Failed to save writing draft:", saveError);
      setError("Your draft could not be saved on this device.");
    }
  }, [TASK_ID]);

  // Load the saved draft once.
  useEffect(() => {
    let cancelled = false;

    getWritingDraft(TASK_ID)
      .then((saved) => {
        if (cancelled) return;

        draftRef.current = saved;
        setDraftWords(countWords(saved));
        setLoaded(true);
      })
      .catch((loadError) => {
        console.error("Failed to load writing draft:", loadError);
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [TASK_ID]);

  // Don't lose unsaved typing when the learner leaves the lesson.
  useEffect(() => {
    return () => {
      if (dirtyRef.current) {
        void saveWritingDraft(TASK_ID, draftRef.current).catch(() => {});
      }

      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [TASK_ID]);

  const onTextChange = (text: string) => {
    draftRef.current = text;
    dirtyRef.current = true;
    setDraftWords(countWords(text));

    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void persist(), SAVE_DELAY_MS);
  };

  const onClear = () => {
    draftRef.current = "";
    dirtyRef.current = false;
    setDraftWords(0);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    void clearWritingDraft(TASK_ID).catch((clearError) => {
      console.error("Failed to clear writing draft:", clearError);
    });
  };

  const submit = async (selfCheckScore: number) => {
    await persist(); // the draft stays saved after submitting

    setScore(selfCheckScore);
    setError(null);

    try {
      await onSaveAttempt(selfCheckScore, TOTAL);
      setStage("results");
    } catch (saveError) {
      console.error("Failed to save lesson attempt:", saveError);
      setError("Your score could not be saved. Please try again.");
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

  const passed = score >= config.passScore;

  if (!loaded) {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <SectionLoader label="Opening your draft…" />
        </div>
      </LessonShell>
    );
  }

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
            <Stat label="Length" value={config.lengthLabel} />
            <Stat label="Self-check" value={`${TOTAL} points`} />
            <Stat label="Pass" value={`${config.passScore}/${TOTAL}`} />
          </div>

          {draftWords > 0 ? (
            <div className="mt-8 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
              You have a saved draft ({draftWords} words). It will be there
              when you start writing.
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setStage("prep")}
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
   * SENTENCE-BUILDING PREPARATION
   */

  if (stage === "prep") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">Preparation</p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            {config.prepHeading}
          </h2>

          <p className="mt-3 leading-7 text-neutral-500">{config.prepText}</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {config.frames.map((frame) => (
              <div
                key={frame}
                className="rounded-xl border border-black/5 bg-white px-5 py-4 font-medium"
              >
                {frame}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStage("plan")}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Plan my paragraph
            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  /*
   * PLANNING
   */

  if (stage === "plan") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">Planning</p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            What will you write about?
          </h2>

          <p className="mt-3 leading-7 text-neutral-500">{config.planText}</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {config.cues.map((cue) => {
              const on = planned.includes(cue);

              return (
                <button
                  key={cue}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() =>
                    setPlanned((current) =>
                      on ? current.filter((c) => c !== cue) : [...current, cue],
                    )
                  }
                  className={[
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                    on
                      ? "border-neutral-900 bg-white"
                      : "border-black/5 bg-white hover:bg-neutral-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      on
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-black/20",
                    ].join(" ")}
                  >
                    {on ? <Check size={13} className="dl-check" aria-hidden="true" /> : null}
                  </span>
                  {cue}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-neutral-400">
            {planned.length} topic{planned.length === 1 ? "" : "s"} planned
          </p>

          <button
            type="button"
            onClick={() => setStage("write")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Start writing
            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  /*
   * WRITING + SELF-CHECK
   */

  if (stage === "write") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">Writing</p>

          <WritingSection
            key={editRound}
            content={{
              prompt: config.prompt,
              targetWords: config.targetWords,
              cues: config.cues,
              checklist: config.checklist,
              sample: config.sample,
              continueLabel: "See results",
            }}
            initialText={draftRef.current}
            onTextChange={onTextChange}
            onClear={onClear}
            onComplete={(selfCheckScore) => void submit(selfCheckScore)}
            belowEditor={(text) => (
              <AIWritingExaminer
                taskId={TASK_ID}
                task={{
                  prompt: config.prompt,
                  targetWords: config.targetWords,
                  cues: config.cues,
                  checklist: config.checklist,
                }}
                text={text}
                onOpenLesson={
                  onOpenLesson
                    ? (taskId) => void persist().finally(() => onOpenLesson(taskId))
                    : undefined
                }
              />
            )}
          />

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
        <p className="text-sm font-medium text-neutral-400">Self-check</p>

        <div className="mt-8 text-7xl font-semibold tracking-tighter">
          {score}/{TOTAL}
        </div>

        <h1 className="mt-7 text-3xl font-semibold tracking-tight">
          {passed ? "Well done." : "Keep working on it."}
        </h1>

        <p className="mx-auto mt-3 max-w-md leading-7 text-neutral-500">
          {passed
            ? "You rated your paragraph at the target level. Keep your draft and read it aloud once."
            : `You need at least ${config.passScore}/${TOTAL}. Your paragraph is saved. Go back, improve it, and check it again.`}
        </p>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditRound((current) => current + 1);
              setStage("write");
            }}
            disabled={finishing}
            className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
          >
            <RotateCcw size={17} />
            Edit paragraph
          </button>

          {passed ? (
            <button
              type="button"
              onClick={() => void finishLesson()}
              disabled={finishing}
              className="rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
            >
              {finishing ? "Finishing…" : "Finish lesson"}
            </button>
          ) : null}
        </div>
      </div>
    </LessonShell>
  );
}
