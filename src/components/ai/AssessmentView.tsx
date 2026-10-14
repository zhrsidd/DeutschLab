import { starterTasks, taskWeek } from "../../data/unit1";
import { modelLabel } from "../../lib/ai/models";
import {
  RUBRIC_CATEGORIES,
  RUBRIC_LABELS,
  RUBRIC_MAX,
  type AssessmentRecord,
  type Correction,
  type CorrectionCategory,
  type CorrectionSeverity,
} from "../../lib/ai/types";

import { Kicker, tertiaryButton } from "./AIParts";

/*
 * Structured AI feedback. Every string is model output and is rendered as
 * plain text by React (never as HTML). Layout follows the examiner order:
 * overview → corrections → detailed feedback → recommended practice →
 * revision.
 */

const CATEGORY_TEXT: Record<CorrectionCategory, string> = {
  grammar: "Grammar",
  spelling: "Spelling",
  word_order: "Word order",
  word_choice: "Word choice",
  style: "Style",
};

const SEVERITY: Record<CorrectionSeverity, { text: string; className: string; rank: number }> = {
  error: { text: "Error", className: "bg-error-soft text-error", rank: 0 },
  minor: { text: "Small slip", className: "bg-warning-soft text-warning", rank: 1 },
  suggestion: { text: "Optional", className: "ring-1 ring-line text-fg-3", rank: 2 },
};

function Meter({ value }: { value: number }) {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {Array.from({ length: RUBRIC_MAX }, (_, index) => (
        <span key={index} className={["h-1.5 w-4 rounded-full", index < value ? "bg-progress" : "bg-surface ring-1 ring-line-strong"].join(" ")} />
      ))}
    </span>
  );
}

function CorrectionItem({ correction }: { correction: Correction }) {
  const severity = SEVERITY[correction.severity];
  return (
    <li className="border-t border-line py-4 first:border-t-0">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base leading-7">
        <del className="text-fg-3 decoration-error/70">{correction.original}</del>
        <span aria-hidden="true" className="text-fg-3">→</span>
        <span className="sr-only">should be</span>
        <ins className="font-medium text-fg no-underline">{correction.suggestion}</ins>
      </p>
      <p className="mt-1.5 flex flex-wrap gap-2 text-xs">
        <span className={["rounded-full px-2 py-0.5 font-medium", severity.className].join(" ")}>{severity.text}</span>
        <span className="rounded-full px-2 py-0.5 text-fg-2 ring-1 ring-line">{CATEGORY_TEXT[correction.category]}</span>
        {correction.concept ? <span className="py-0.5 text-fg-3">{correction.concept}</span> : null}
      </p>
      <p className="mt-2 text-sm leading-6 text-fg-2">{correction.explanation}</p>
    </li>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-6">
      <Kicker>{title}</Kicker>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-fg-2">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AssessmentView({
  record,
  onOpenLesson,
}: {
  record: AssessmentRecord;
  onOpenLesson?: (taskId: string) => void;
}) {
  const { feedback } = record;
  const corrections = [...feedback.corrections].sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank);
  const errors = corrections.filter((c) => c.severity !== "suggestion").length;
  const lessons = feedback.recommendedLessons
    .map((id) => starterTasks.find((task) => task.id === id))
    .filter((task) => task !== undefined);
  const notes = [...feedback.uncertaintyNotes, ...feedback.validationNotes];

  return (
    <section aria-label="AI feedback" className="dl-feedback mt-6 rounded-lg border border-line bg-elevated p-5 md:p-6" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>AI feedback · advisory</Kicker>
          <p className="tabular mt-2 font-display text-stat">
            {feedback.total}
            <span className="text-fg-3"> / {feedback.maxTotal}</span>
          </p>
        </div>
        <p className="max-w-xs text-right text-xs leading-5 text-fg-3">
          DeutschLab practice marks, not a CEFR grade. Your self-check still decides the lesson.
        </p>
      </div>

      <dl className="mt-5 border-t border-line">
        {RUBRIC_CATEGORIES.map((category) => (
          <div key={category} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b border-line py-3">
            <dt className="text-sm font-medium">{RUBRIC_LABELS[category]}</dt>
            <dd className="m-0 flex items-center gap-3">
              <Meter value={feedback.scores[category].score} />
              <span className="tabular text-sm text-fg-2">
                {feedback.scores[category].score}/{RUBRIC_MAX}
              </span>
            </dd>
            {feedback.scores[category].comment ? (
              <dd className="col-span-2 m-0 text-sm leading-6 text-fg-2">{feedback.scores[category].comment}</dd>
            ) : null}
          </div>
        ))}
        {record.kind === "speaking" ? (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-line py-3">
            <dt className="text-sm font-medium">Pronunciation</dt>
            <dd className="m-0 text-sm text-fg-2">Pronunciation not formally assessed.</dd>
            <dd className="col-span-2 m-0 mt-1 text-xs leading-5 text-fg-3">
              The examiner only reads a transcript. A transcript, even a correct one, says nothing about how you
              sounded: compare yourself with the model audio instead.
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-6">
        <Kicker>
          Corrections ({corrections.length}
          {corrections.length ? `, ${errors} to fix` : ""})
        </Kicker>
        {corrections.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-fg-2">No corrections. The examiner found nothing that needs fixing.</p>
        ) : (
          <ul className="mt-1">
            {corrections.map((correction, index) => (
              <CorrectionItem key={index} correction={correction} />
            ))}
          </ul>
        )}
      </div>

      <TextList title="Strengths" items={feedback.strengths} />
      <TextList title="To improve" items={feedback.improvements} />
      <TextList title="Not covered yet" items={feedback.missedRequirements} />

      {lessons.length ? (
        <div className="mt-6">
          <Kicker>Recommended practice</Kicker>
          <ul className="mt-2 space-y-1.5 text-sm">
            {lessons.map((task) => (
              <li key={task!.id} className="flex flex-wrap items-baseline gap-x-2">
                {onOpenLesson ? (
                  <button type="button" onClick={() => onOpenLesson(task!.id)} className={tertiaryButton}>
                    {task!.title}
                  </button>
                ) : (
                  <span className="font-medium">{task!.title}</span>
                )}
                <span className="text-xs text-fg-3">Week {taskWeek(task!)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {feedback.revisedText ? (
        <details className="mt-6 rounded-md border border-line px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">Show a corrected version</summary>
          <p className="mt-3 whitespace-pre-wrap leading-7">{feedback.revisedText}</p>
          <p className="mt-2 text-xs leading-5 text-fg-3">
            Your meaning with the corrections applied. Compare it with yours, then revise in your own words.
          </p>
        </details>
      ) : null}

      {notes.length ? (
        <div className="mt-6 text-xs leading-5 text-fg-3">
          <p className="font-medium text-fg-2">Notes</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 text-xs text-fg-3">
        {modelLabel(record.model)} ·{" "}
        {new Date(record.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        {record.revisionOf ? " · reassessment of a revision" : ""}
      </p>
    </section>
  );
}
