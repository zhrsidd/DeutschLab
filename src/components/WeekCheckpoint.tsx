import { useMemo, useState } from "react";

import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";

import {
  listeningItems,
  readingQuestions,
  readingText,
  type ComprehensionQuestion,
} from "../data/lessons/week1Checkpoint";

import { useGermanSpeech } from "../hooks/useGermanSpeech";

import {
  buildCheckpointGrammar,
  buildCheckpointVocabulary,
} from "../lib/checkpointBuilders";

import {
  CHECKPOINT_TOTAL,
  OVERALL_PASS_FRACTION,
  SECTION_RULES,
  evaluateCheckpoint,
  type CheckpointResult,
  type SectionKey,
  type SectionScores,
} from "../lib/checkpointScoring";

import type { PlanTarget } from "../lib/dailyPlanner";

import {
  ErrorMessage,
  LessonShell,
  ProgressBar,
  Stat,
} from "./lesson/LessonParts";

import ComprehensionSection from "./checkpoint/ComprehensionSection";
import GrammarSection from "./checkpoint/GrammarSection";
import SpeakingSection from "./checkpoint/SpeakingSection";
import VocabularySection from "./checkpoint/VocabularySection";
import WritingSection from "./checkpoint/WritingSection";

type Stage = "intro" | SectionKey | "results";

const SECTION_ORDER: SectionKey[] = [
  "vocabulary",
  "grammar",
  "reading",
  "listening",
  "writing",
  "speaking",
];

const SECTION_TITLE: Record<SectionKey, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

const emptyScores = (): SectionScores => ({
  vocabulary: 0,
  grammar: 0,
  reading: 0,
  listening: 0,
  writing: 0,
  speaking: 0,
});

interface Recommendation {
  label: string;
  target: PlanTarget;
}

function recommendationsFor(
  result: CheckpointResult,
  missedGrammarLessons: string[],
): Recommendation[] {
  const out: Recommendation[] = [];
  const add = (label: string, target: PlanTarget) => {
    const key = JSON.stringify(target) + label;
    if (!out.some((item) => JSON.stringify(item.target) + item.label === key)) {
      out.push({ label, target });
    }
  };

  const grammarLabels: Record<string, string> = {
    "grammar-001": "Review sein and pronouns",
    "grammar-002": "Review regular verbs and word order",
    "grammar-003": "Review German questions",
  };

  for (const key of result.weakSections) {
    if (key === "vocabulary" || key === "reading") {
      add("Review Week 1 vocabulary", { type: "lesson", taskId: "vocab-001" });
    } else if (key === "grammar") {
      const lessons = missedGrammarLessons.length
        ? missedGrammarLessons
        : ["grammar-001"];

      for (const lessonId of lessons) {
        add(grammarLabels[lessonId] ?? "Review grammar", {
          type: "lesson",
          taskId: lessonId,
        });
      }
    } else if (key === "listening") {
      add("Practise listening", { type: "lesson", taskId: "listening-001" });
    } else if (key === "writing") {
      add("Practise building sentences", { type: "lesson", taskId: "grammar-002" });
    } else if (key === "speaking") {
      add("Practise your self-introduction", { type: "lesson", taskId: "speaking-001" });
    }
  }

  if (!result.passed) add("Open Review", { type: "review" });

  return out;
}

interface WeekCheckpointProps {
  /** Instructional Week 1 lessons not yet completed. */
  unfinishedLessons: number;
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (result: CheckpointResult) => Promise<void>;
  onOpenTarget: (target: PlanTarget) => void;
}

export default function WeekCheckpoint({
  unfinishedLessons,
  onBack,
  onFinish,
  onSaveAttempt,
  onOpenTarget,
}: WeekCheckpointProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [attempt, setAttempt] = useState(1);
  const [scores, setScores] = useState<SectionScores>(emptyScores);
  const [missedGrammar, setMissedGrammar] = useState<string[]>([]);
  const [result, setResult] = useState<CheckpointResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speech = useGermanSpeech();

  const vocabulary = useMemo(() => buildCheckpointVocabulary(attempt), [attempt]);
  const grammar = useMemo(() => buildCheckpointGrammar(attempt), [attempt]);
  const listening = useMemo<ComprehensionQuestion[]>(
    () =>
      listeningItems.flatMap((item) =>
        item.questions.map((question) => ({
          ...question,
          audio: item.audio,
          translation: item.translation,
        })),
      ),
    [],
  );

  const sectionIndex = SECTION_ORDER.indexOf(stage as SectionKey);

  const advance = (from: SectionKey, patch: SectionScores) => {
    setScores(patch);

    const next = SECTION_ORDER[SECTION_ORDER.indexOf(from) + 1];
    if (next) setStage(next);
  };

  const completeSection = (key: SectionKey, score: number) => {
    advance(key, { ...scores, [key]: score });
  };

  const completeSpeaking = async (score: number) => {
    const finalScores = { ...scores, speaking: score };
    const evaluated = evaluateCheckpoint(finalScores);

    setScores(finalScores);
    setError(null);

    try {
      setSaving(true);
      await onSaveAttempt(evaluated);
      setResult(evaluated);
      setStage("results");
    } catch (saveError) {
      console.error("Failed to save checkpoint attempt:", saveError);
      setError(
        "Your checkpoint result could not be saved. Please try again.",
      );
      // Show the result anyway so the work isn't lost; it just isn't stored.
      setResult(evaluated);
    } finally {
      setSaving(false);
    }
  };

  const retry = () => {
    speech.stop();
    setAttempt((current) => current + 1);
    setScores(emptyScores());
    setMissedGrammar([]);
    setResult(null);
    setError(null);
    setStage("vocabulary");
  };

  const finish = async () => {
    try {
      setFinishing(true);
      setError(null);
      await onFinish();
    } catch (finishError) {
      console.error("Failed to finish checkpoint:", finishError);
      setError("DeutschLab could not mark the checkpoint as complete. Please try again.");
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
            Week 1 · Checkpoint
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Week 1 Checkpoint
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            One check across everything in Week 1: vocabulary, grammar,
            reading, listening, a short piece of writing and a spoken
            introduction.
          </p>

          {unfinishedLessons > 0 ? (
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p>
                You still have unfinished Week 1 lessons. You can take the
                checkpoint now, but completing them first is recommended.
              </p>
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label="Sections" value="6" />
            <Stat label="Time" value="20–25 min" />
            <Stat label="Marks" value={String(CHECKPOINT_TOTAL)} />
          </div>

          <div className="mt-10 rounded-2xl border border-black/5 bg-neutral-50 p-5">
            <p className="text-sm font-medium">How it's scored</p>

            <div className="mt-3 space-y-1.5 text-sm text-neutral-500">
              {SECTION_RULES.map((rule) => (
                <div key={rule.key} className="flex justify-between">
                  <span>{rule.label}</span>
                  <span>{rule.max} marks</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm leading-6 text-neutral-500">
              Pass with {Math.round(OVERALL_PASS_FRACTION * 100)}% overall
              and the minimum in every section, so one strong area can't hide
              a weak one. Writing and speaking are self-assessed. You'll need
              a German voice for the listening section.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStage("vocabulary")}
            className="mt-8 flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Begin checkpoint
            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  /*
   * RESULTS
   */

  if (stage === "results" && result) {
    const recommendations = recommendationsFor(result, missedGrammar);

    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-center text-sm font-medium text-neutral-400">
            Week 1 Checkpoint
          </p>

          <div className="mt-6 text-center text-6xl font-semibold tracking-tighter">
            {result.total} / {result.possible}
          </div>

          <p className="mt-2 text-center text-neutral-500">
            Overall: {result.total} / {result.possible} — {result.percent}%
          </p>

          <h1 className="mt-6 text-center text-3xl font-semibold tracking-tight">
            {result.passed ? "Week 1 mastered" : "Review recommended"}
          </h1>

          <div className="mt-8 overflow-hidden rounded-2xl border border-black/5 bg-white">
            {result.sections.map((section, index) => (
              <div
                key={section.key}
                className={[
                  "flex items-center justify-between px-5 py-4",
                  index !== result.sections.length - 1
                    ? "border-b border-black/5"
                    : "",
                ].join(" ")}
              >
                <div>
                  <p className="font-medium">{section.label}</p>
                  {!section.passed ? (
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Needs at least {section.required}/{section.max}
                    </p>
                  ) : null}
                </div>

                <span
                  className={[
                    "rounded-full px-3 py-1 text-sm font-medium",
                    section.passed
                      ? "bg-neutral-100 text-neutral-700"
                      : "bg-red-50 text-red-900",
                  ].join(" ")}
                >
                  {section.score}/{section.max}
                </span>
              </div>
            ))}
          </div>

          {!result.passed ? (
            <p className="mt-4 text-sm leading-6 text-neutral-500">
              {result.overallPassed
                ? "Your overall score is high enough, but a section is below its minimum."
                : `You need ${Math.round(OVERALL_PASS_FRACTION * 100)}% overall and the minimum in every section.`}
            </p>
          ) : null}

          {!result.passed && recommendations.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">Do this first</p>

              <div className="space-y-2">
                {recommendations.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onOpenTarget(item.target)}
                    className="flex w-full items-center justify-between rounded-xl border border-black/5 bg-white px-5 py-3.5 text-left text-sm font-medium transition hover:bg-neutral-50"
                  >
                    {item.label}
                    <ArrowRight size={16} className="text-neutral-300" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}

          <div className="mt-8 flex items-center justify-center gap-3">
            {result.passed ? (
              <button
                type="button"
                onClick={() => void finish()}
                disabled={finishing}
                className="rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
              >
                {finishing ? "Finishing…" : "Finish checkpoint"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Back to today
                </button>

                <button
                  type="button"
                  onClick={retry}
                  className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  <RotateCcw size={17} />
                  Retry checkpoint
                </button>
              </>
            )}
          </div>
        </div>
      </LessonShell>
    );
  }

  /*
   * SECTIONS
   */

  const audioChecking = stage === "listening" && !speech.checked;
  const audioBlocked =
    stage === "listening" && speech.checked && !speech.available;

  return (
    <LessonShell onBack={onBack}>
      <ProgressBar value={((sectionIndex + 1) / SECTION_ORDER.length) * 100} />

      <div className="mx-auto max-w-2xl px-8 py-12">
        <p className="text-sm font-medium text-neutral-400">
          Section {sectionIndex + 1} of {SECTION_ORDER.length} ·{" "}
          {SECTION_TITLE[stage as SectionKey]}
        </p>

        {stage === "vocabulary" ? (
          <VocabularySection
            key={`v-${attempt}`}
            questions={vocabulary}
            speech={speech}
            onComplete={(score) => completeSection("vocabulary", score)}
          />
        ) : null}

        {stage === "grammar" ? (
          <GrammarSection
            key={`g-${attempt}`}
            questions={grammar}
            onComplete={(score, missed) => {
              setMissedGrammar(missed);
              completeSection("grammar", score);
            }}
          />
        ) : null}

        {stage === "reading" ? (
          <ComprehensionSection
            key={`r-${attempt}`}
            questions={readingQuestions}
            passage={readingText}
            speech={speech}
            onComplete={(score) => completeSection("reading", score)}
          />
        ) : null}

        {audioChecking ? (
          <p className="mt-8 text-neutral-500">
            Checking for a German voice…
          </p>
        ) : null}

        {audioBlocked ? (
          <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6">
            <p className="font-medium">Listening needs a German voice</p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              No German voice is available on this system, so the listening
              section can't be played and won't be marked for you. Add one in
              System Settings → Accessibility → Spoken Content → System Voice →
              Manage Voices, then take the checkpoint again. Nothing from this
              attempt has been saved.
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-5 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Exit checkpoint
            </button>
          </div>
        ) : null}

        {stage === "listening" && speech.available ? (
          <ComprehensionSection
            key={`l-${attempt}`}
            questions={listening}
            speech={speech}
            onComplete={(score) => completeSection("listening", score)}
          />
        ) : null}

        {stage === "writing" ? (
          <WritingSection
            key={`w-${attempt}`}
            onComplete={(score) => completeSection("writing", score)}
          />
        ) : null}

        {stage === "speaking" ? (
          <>
            <SpeakingSection
              key={`s-${attempt}`}
              onComplete={(score) => void completeSpeaking(score)}
            />

            {saving ? (
              <p className="mt-4 text-center text-sm text-neutral-400">
                Saving…
              </p>
            ) : null}

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}

            {error && result ? (
              <button
                type="button"
                onClick={() => setStage("results")}
                className="mt-4 text-sm text-neutral-500 underline"
              >
                Show my result anyway
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </LessonShell>
  );
}
