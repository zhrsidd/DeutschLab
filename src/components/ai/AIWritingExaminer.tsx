import { useEffect, useState } from "react";

import { Sparkles } from "lucide-react";

import { assessWriting, MIN_ASSESSABLE_WORDS } from "../../lib/ai/assessment";
import { AIError, toAIError } from "../../lib/ai/errors";
import type { TaskBrief } from "../../lib/ai/prompts";
import { listAssessments } from "../../lib/ai/store";
import type { AssessmentRecord } from "../../lib/ai/types";
import { countWords } from "../../lib/text";
import { ButtonLoader, SectionLoader } from "../shell/Loaders";

import { AIErrorPanel, AIStatusNote, ConsentNotice, Kicker, secondaryButton } from "./AIParts";
import AssessmentView from "./AssessmentView";
import { useAIStatus } from "./useAIStatus";

interface AIWritingExaminerProps {
  taskId: string;
  task: TaskBrief;
  /** The current draft (the editor stays the source of truth). */
  text: string;
  onOpenLesson?: (taskId: string) => void;
}

/*
 * "Assess with AI" for a writing lesson. Sits under the editor, beside the
 * existing self-check (which still decides the lesson). The draft is never
 * changed here; a failed request leaves everything as it was.
 */
export default function AIWritingExaminer({ taskId, task, text, onOpenLesson }: AIWritingExaminerProps) {
  const status = useAIStatus();
  const [latest, setLatest] = useState<AssessmentRecord | null>(null);
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<AIError | null>(null);

  useEffect(() => {
    if (!status.ready) return;
    let cancelled = false;
    listAssessments(taskId)
      .then((records) => {
        if (cancelled) return;
        setHistory(records);
        setLatest((current) => current ?? records[0] ?? null);
      })
      .catch((loadError) => console.error("Failed to load AI history:", loadError));
    return () => {
      cancelled = true;
    };
  }, [status.ready, taskId]);

  if (!status.ready) {
    return (
      <div className="mt-8 border-t border-line pt-5">
        <Kicker>AI feedback · optional</Kicker>
        <div className="mt-2">
          <AIStatusNote status={status} />
        </div>
      </div>
    );
  }

  const words = countWords(text);
  const changedSinceLatest = latest !== null && latest.inputText.trim() !== text.trim();

  const run = async () => {
    setError(null);
    setBusy(true);
    try {
      const record = await assessWriting({
        taskId,
        task,
        text,
        revisionOf: latest && changedSinceLatest ? latest.id : null,
      });
      setLatest(record);
      setHistory((current) => [record, ...current].slice(0, 20));
    } catch (raw) {
      setError(toAIError(raw));
    } finally {
      setBusy(false);
    }
  };

  const request = () => {
    if (!status.settings?.consentedAt) {
      setAsking(true);
      return;
    }
    void run();
  };

  const label = latest ? (changedSinceLatest ? "Reassess my revision" : "Assess again") : "Assess with AI";

  return (
    <div className="mt-8 border-t border-line pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Kicker>AI feedback · optional</Kicker>
          <p className="mt-1 text-sm leading-6 text-fg-2">
            A detailed, advisory marking of your current draft. It does not replace your self-check.
          </p>
        </div>
        <button
          type="button"
          onClick={request}
          disabled={busy || words < MIN_ASSESSABLE_WORDS}
          aria-busy={busy}
          className={secondaryButton}
        >
          {busy ? <ButtonLoader /> : <Sparkles size={15} aria-hidden="true" />}
          {busy ? "Assessing…" : label}
        </button>
      </div>

      {words < MIN_ASSESSABLE_WORDS ? (
        <p className="mt-2 text-xs text-fg-3">Write at least {MIN_ASSESSABLE_WORDS} words to ask for AI feedback.</p>
      ) : null}

      {asking ? (
        <ConsentNotice
          onAccept={() => {
            setAsking(false);
            void status.giveConsent().then(run, (consentError) => setError(toAIError(consentError)));
          }}
          onCancel={() => setAsking(false)}
        />
      ) : null}

      {busy ? <SectionLoader className="mt-4" label="Gemini is reading your paragraph…" /> : null}
      {error ? <AIErrorPanel error={error} onRetry={() => void run()} /> : null}

      {latest && !busy ? (
        <>
          {changedSinceLatest ? (
            <p className="mt-4 text-xs text-fg-3">You have changed your text since this feedback.</p>
          ) : null}
          <AssessmentView record={latest} onOpenLesson={onOpenLesson} />
        </>
      ) : null}

      {history.length > 1 ? (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-fg-2">Earlier AI feedback ({history.length - 1})</summary>
          <ul className="mt-2">
            {history.slice(1).map((record) => (
              <li key={record.id} className="flex items-baseline justify-between gap-3 border-t border-line py-2">
                <button type="button" onClick={() => setLatest(record)} className="text-left text-fg-2 underline-offset-4 hover:underline">
                  {new Date(record.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </button>
                <span className="tabular text-fg-3">
                  {record.score}/{record.maxScore}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
