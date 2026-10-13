import { useMemo, useState } from "react";

import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";

import { useGermanSpeech } from "../hooks/useGermanSpeech";

import {
  week1CheckpointDefinition,
  type CheckpointDefinition,
} from "../lib/checkpointDefinitions";

import {
  evaluateCheckpoint,
  lowestSections,
  overallRequiredMarks,
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

const SECTION_TITLE: Record<SectionKey, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

const emptyScores = (): Partial<SectionScores> => ({});

interface WeekCheckpointProps {
  /** Which checkpoint to run; defaults to Week 1. */
  definition?: CheckpointDefinition;
  /** Instructional lessons of this week not yet completed. */
  unfinishedLessons: number;
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (result: CheckpointResult) => Promise<void>;
  onOpenTarget: (target: PlanTarget) => void;
}

export default function WeekCheckpoint({
  definition = week1CheckpointDefinition,
  unfinishedLessons,
  onBack,
  onFinish,
  onSaveAttempt,
  onOpenTarget,
}: WeekCheckpointProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [attempt, setAttempt] = useState(1);
  const [scores, setScores] = useState<Partial<SectionScores>>(emptyScores);
  const [missedGrammar, setMissedGrammar] = useState<string[]>([]);
  const [result, setResult] = useState<CheckpointResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speech = useGermanSpeech();

  const sectionOrder = definition.sections;
  const lastSection = sectionOrder[sectionOrder.length - 1];
  const rules = definition.config.rules;
  const possible = rules.reduce((sum, rule) => sum + rule.max, 0);
  const passPercent = Math.round(definition.config.overallPassFraction * 100);

  const vocabulary = useMemo(
    () => definition.buildVocabulary(attempt),
    [definition, attempt],
  );
  const grammar = useMemo(
    () => definition.buildGrammar(attempt),
    [definition, attempt],
  );

  const sectionIndex = sectionOrder.indexOf(stage as SectionKey);

  const finalise = async (finalScores: Partial<SectionScores>) => {
    const evaluated = evaluateCheckpoint(finalScores, definition.config);

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

  /** Records a section's score, then moves on (or finishes after the last). */
  const completeSection = (key: SectionKey, score: number) => {
    const next = { ...scores, [key]: score };

    setScores(next);

    if (key === lastSection) {
      void finalise(next);
      return;
    }

    setStage(sectionOrder[sectionOrder.indexOf(key) + 1]);
  };

  const retry = () => {
    speech.stop();
    setAttempt((current) => current + 1);
    setScores(emptyScores());
    setMissedGrammar([]);
    setResult(null);
    setError(null);
    setStage(sectionOrder[0]);
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
            {definition.weekLabel} · Checkpoint
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {definition.title}
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            {definition.summary}
          </p>

          {unfinishedLessons > 0 ? (
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p>
                You still have unfinished {definition.weekLabel} lessons. You
                can take the checkpoint now, but completing them first is
                recommended.
              </p>
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label="Sections" value={String(sectionOrder.length)} />
            <Stat label="Time" value={definition.time} />
            <Stat label="Marks" value={String(possible)} />
          </div>

          <div className="mt-10 rounded-2xl border border-black/5 bg-neutral-50 p-5">
            <p className="text-sm font-medium">How it's scored</p>

            <div className="mt-3 space-y-1.5 text-sm text-neutral-500">
              {rules.map((rule) => (
                <div key={rule.key} className="flex justify-between">
                  <span>{rule.label}</span>
                  <span>{rule.max} marks</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm leading-6 text-neutral-500">
              Pass with {passPercent}% overall (
              {overallRequiredMarks(definition.config)}/{possible}) and the
              minimum in every section, so one strong area can't hide a weak
              one.{" "}
              {definition.scoringNote}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStage(sectionOrder[0])}
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
    const recommendations = definition.recommend(result, missedGrammar);
    // After a pass, point at the weakest section(s) to keep practising.
    const weakest = result.passed ? lowestSections(result) : [];
    const keepPractising = weakest.length
      ? definition
          .recommend({ ...result, weakSections: weakest }, missedGrammar)
          .filter((item) => item.target.type === "lesson")
      : [];

    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-center text-sm font-medium text-neutral-400">
            {definition.title}
          </p>

          <div className="mt-6 text-center text-6xl font-semibold tracking-tighter">
            {result.total} / {result.possible}
          </div>

          <p className="mt-2 text-center text-neutral-500">
            Overall: {result.total} / {result.possible} — {result.percent}%
          </p>

          <h1 className="mt-6 text-center text-3xl font-semibold tracking-tight">
            {result.passed
              ? `${definition.weekLabel} mastered`
              : "Review recommended"}
          </h1>

          {result.passed && definition.passNote ? (
            <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-neutral-500">
              {definition.passNote}
            </p>
          ) : null}

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
                : `You need ${passPercent}% overall and the minimum in every section.`}
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

          {result.passed && keepPractising.length > 0 ? (
            <div className="mt-6">
              <p className="mb-1 text-sm font-medium">Keep it strong</p>
              <p className="mb-3 text-sm text-neutral-500">
                Your weakest {weakest.length === 1 ? "section was" : "sections were"}{" "}
                {result.sections
                  .filter((section) => weakest.includes(section.key))
                  .map((section) => `${section.label} (${section.score}/${section.max})`)
                  .join(", ")}
                .
              </p>

              <div className="space-y-2">
                {keepPractising.map((item) => (
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
      <ProgressBar value={((sectionIndex + 1) / sectionOrder.length) * 100} />

      <div className="mx-auto max-w-2xl px-8 py-12">
        <p className="text-sm font-medium text-neutral-400">
          Section {sectionIndex + 1} of {sectionOrder.length} ·{" "}
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
            questions={definition.readingQuestions}
            passage={definition.readingText}
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
            questions={definition.listeningQuestions}
            speech={speech}
            onComplete={(score) => completeSection("listening", score)}
          />
        ) : null}

        {stage === "writing" ? (
          <WritingSection
            key={`w-${attempt}`}
            content={definition.writing}
            onComplete={(score) => completeSection("writing", score)}
          />
        ) : null}

        {stage === "speaking" ? (
          <SpeakingSection
            key={`s-${attempt}`}
            content={definition.speaking}
            onComplete={(score) => completeSection("speaking", score)}
          />
        ) : null}

        {stage === lastSection ? (
          <>
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
