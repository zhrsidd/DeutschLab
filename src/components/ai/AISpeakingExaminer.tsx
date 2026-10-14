import { useState } from "react";

import { FileText, Sparkles } from "lucide-react";

import { useRecorder } from "../../hooks/useRecorder";
import { assessSpeaking, MIN_ASSESSABLE_WORDS, transcribeRecording } from "../../lib/ai/assessment";
import { AIError, toAIError } from "../../lib/ai/errors";
import { modelLabel } from "../../lib/ai/models";
import type { TaskBrief } from "../../lib/ai/prompts";
import type { AssessmentRecord, InputSource } from "../../lib/ai/types";
import { countWords } from "../../lib/text";
import { ButtonLoader, SectionLoader } from "../shell/Loaders";

import { AIErrorPanel, AIStatusNote, ConsentNotice, Kicker, secondaryButton, tertiaryButton } from "./AIParts";
import AssessmentView from "./AssessmentView";
import RecorderControls from "./RecorderControls";
import { useAIStatus } from "./useAIStatus";

interface AISpeakingExaminerProps {
  taskId: string;
  task: TaskBrief;
  onOpenLesson?: (taskId: string) => void;
}

type Pending = "transcribe" | "assess" | null;

/*
 * Optional AI speaking feedback: record → listen → transcribe (cloud) →
 * check the transcript → assess. The transcript is always shown before
 * assessment, and its origin is labelled: model transcript, edited by the
 * learner, or typed. Pronunciation is never scored.
 */
export default function AISpeakingExaminer({ taskId, task, onOpenLesson }: AISpeakingExaminerProps) {
  const status = useAIStatus();
  const recorder = useRecorder(status.settings?.maxRecordingSeconds ?? 180);
  const [modelTranscript, setModelTranscript] = useState<string | null>(null);
  const [transcriptModel, setTranscriptModel] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState<Pending>(null);
  const [asking, setAsking] = useState<Pending>(null);
  const [error, setError] = useState<AIError | null>(null);
  const [failed, setFailed] = useState<Pending>(null);
  const [result, setResult] = useState<AssessmentRecord | null>(null);

  if (!status.ready) {
    return (
      <div className="mt-8 border-t border-line pt-5">
        <Kicker>AI speaking feedback · optional</Kicker>
        <div className="mt-2">
          <AIStatusNote status={status} />
        </div>
      </div>
    );
  }

  const source: InputSource =
    modelTranscript === null ? "typed" : transcript.trim() === modelTranscript.trim() ? "model_transcript" : "edited_transcript";

  const transcribe = async () => {
    if (!recorder.recording) return;
    setError(null);
    setBusy("transcribe");
    try {
      const { text, model } = await transcribeRecording(recorder.recording.blob, recorder.recording.mimeType);
      setModelTranscript(text);
      setTranscriptModel(model);
      setTranscript(text);
      setTyping(false);
    } catch (raw) {
      setError(toAIError(raw));
      setFailed("transcribe");
    } finally {
      setBusy(null);
    }
  };

  const assess = async () => {
    setError(null);
    setBusy("assess");
    try {
      const record = await assessSpeaking({
        taskId,
        task,
        text: transcript,
        inputSource: source,
        originalTranscript: source === "edited_transcript" ? modelTranscript : null,
        durationSeconds: recorder.recording?.seconds,
        revisionOf: result?.id ?? null,
      });
      setResult(record);
    } catch (raw) {
      setError(toAIError(raw));
      setFailed("assess");
    } finally {
      setBusy(null);
    }
  };

  const withConsent = (action: Exclude<Pending, null>) => {
    if (!status.settings?.consentedAt) {
      setAsking(action);
      return;
    }
    void (action === "transcribe" ? transcribe() : assess());
  };

  const showTranscript = modelTranscript !== null || typing;
  const transcriptLabel =
    source === "typed"
      ? "What you said (typed by you)"
      : source === "edited_transcript"
        ? "Transcript (edited by you)"
        : `Transcript from ${modelLabel(transcriptModel ?? "")}`;

  return (
    <div className="mt-8 border-t border-line pt-5">
      <Kicker>AI speaking feedback · optional</Kicker>
      <p className="mt-1 max-w-reading text-sm leading-6 text-fg-2">
        Record your talk, listen back, then get advisory feedback on what you said. Your self-assessment still decides
        the lesson. Pronunciation is not assessed.
      </p>

      <RecorderControls recorder={recorder} disabled={busy !== null} />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {recorder.recording ? (
          <button
            type="button"
            onClick={() => withConsent("transcribe")}
            disabled={busy !== null}
            aria-busy={busy === "transcribe"}
            className={secondaryButton}
          >
            {busy === "transcribe" ? <ButtonLoader /> : <FileText size={15} aria-hidden="true" />}
            {busy === "transcribe" ? "Transcribing…" : modelTranscript === null ? "Transcribe with AI" : "Transcribe again"}
          </button>
        ) : null}
        {!showTranscript ? (
          <button type="button" onClick={() => setTyping(true)} className={tertiaryButton}>
            Type what you said instead
          </button>
        ) : null}
      </div>

      {asking ? (
        <ConsentNotice
          audio={asking === "transcribe"}
          onAccept={() => {
            const action = asking;
            setAsking(null);
            void status
              .giveConsent()
              .then(() => (action === "transcribe" ? transcribe() : assess()), (e) => setError(toAIError(e)));
          }}
          onCancel={() => setAsking(null)}
        />
      ) : null}

      {busy === "transcribe" ? <SectionLoader className="mt-4" label="Gemini is transcribing your recording…" /> : null}

      {showTranscript ? (
        <div className="mt-5">
          <label htmlFor={`${taskId}-transcript`} className="text-sm font-medium">
            {transcriptLabel}
          </label>
          <p className="mt-1 text-xs leading-5 text-fg-3">
            {modelTranscript !== null
              ? "Check it against your recording and fix only obvious transcription mistakes. A corrected transcript is not evidence of how you pronounced anything."
              : "Write down what you actually said, as closely as you can."}
          </p>
          <textarea
            id={`${taskId}-transcript`}
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            rows={5}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-md border border-line bg-canvas px-4 py-3 leading-7 outline-none focus:border-line-strong"
          />
          {source === "edited_transcript" ? (
            <details className="mt-2 text-xs text-fg-3">
              <summary className="cursor-pointer">Original transcript</summary>
              <p className="mt-1 whitespace-pre-wrap leading-6">{modelTranscript}</p>
            </details>
          ) : null}

          <button
            type="button"
            onClick={() => withConsent("assess")}
            disabled={busy !== null || countWords(transcript) < MIN_ASSESSABLE_WORDS}
            aria-busy={busy === "assess"}
            className={[secondaryButton, "mt-3"].join(" ")}
          >
            {busy === "assess" ? <ButtonLoader /> : <Sparkles size={15} aria-hidden="true" />}
            {busy === "assess" ? "Assessing…" : result ? "Assess again" : "Assess with AI"}
          </button>
        </div>
      ) : null}

      {busy === "assess" ? <SectionLoader className="mt-4" label="Gemini is reading your transcript…" /> : null}
      {error ? (
        <AIErrorPanel error={error} onRetry={() => void (failed === "transcribe" ? transcribe() : assess())} />
      ) : null}

      {result && busy === null ? <AssessmentView record={result} onOpenLesson={onOpenLesson} /> : null}
    </div>
  );
}
