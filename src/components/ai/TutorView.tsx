import { useEffect, useRef, useState } from "react";

import { ArrowLeft, Mic, Send, Square, Trash2, Volume2 } from "lucide-react";

import { useGermanSpeech } from "../../hooks/useGermanSpeech";
import { PROBLEM_TEXT, useRecorder } from "../../hooks/useRecorder";
import { formatTime } from "../../hooks/useCountdown";
import { starterTasks } from "../../data/unit1";
import { transcribeRecording } from "../../lib/ai/assessment";
import { loadLearnerContext, type LearnerContext } from "../../lib/ai/context";
import { AIError, toAIError } from "../../lib/ai/errors";
import { modelLabel } from "../../lib/ai/models";
import { deleteTutorSession, listTutorSessions } from "../../lib/ai/store";
import {
  grammarFocusFor,
  learnerTurns,
  MAX_LEARNER_MESSAGE,
  sendTutorTurn,
  setCorrectionMode,
  startTutorSession,
  summariseSession,
  topicsFor,
} from "../../lib/ai/tutor";
import type { CorrectionMode, TutorLevel, TutorMessage, TutorMode, TutorSession } from "../../lib/ai/types";
import { PageHeader } from "../shell/AppShell";
import { InlineLoader, SectionLoader } from "../shell/Loaders";

import { AIErrorPanel, AIStatusNote, ConsentNotice, Kicker, primaryButton, secondaryButton, tertiaryButton } from "./AIParts";
import { useAIStatus } from "./useAIStatus";

/*
 * Deutsch mit KI, inside Practice (Learning energy: calm, conversational).
 * Topic and level → conversation → optional corrections → summary.
 * Not a chat app: one question at a time, short turns, a turn limit, and
 * everything the learner typed is kept if a request fails.
 */

const SPEAK_RATE = 0.88;
const SLOW_RATE = 0.7;

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; note?: string; disabled?: boolean }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={[
              "dl-press rounded-md px-3.5 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
              option.value === value ? "bg-accent font-semibold text-on-accent" : "border border-line bg-elevated text-fg-2 enabled:hover:border-line-strong",
            ].join(" ")}
          >
            {option.label}
            {option.note ? <span className="ml-1.5 text-xs opacity-80">{option.note}</span> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function MessageRow({
  message,
  speech,
}: {
  message: TutorMessage;
  speech: ReturnType<typeof useGermanSpeech>;
}) {
  const tutor = message.role === "tutor";
  return (
    <li className="border-t border-line py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">
        {tutor ? "Tutor" : message.source === "voice" ? "Du · spoken, transcribed" : "Du"}
      </p>
      <p lang={tutor ? "de" : undefined} className={["mt-1 whitespace-pre-wrap leading-7", tutor ? "text-lg" : "text-fg"].join(" ")}>
        {message.text}
      </p>
      {tutor && message.english ? <p className="mt-1 font-serif text-base italic text-fg-2">{message.english}</p> : null}
      {tutor && speech.available ? (
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => speech.speak(message.text, SPEAK_RATE)} className={tertiaryButton} aria-label={`Play: ${message.text}`}>
            <span className="inline-flex items-center gap-1"><Volume2 size={14} aria-hidden="true" />Play</span>
          </button>
          <button type="button" onClick={() => speech.speak(message.text, SLOW_RATE)} className={tertiaryButton} aria-label={`Play slower: ${message.text}`}>
            Slower
          </button>
          <button type="button" onClick={speech.stop} className={tertiaryButton}>
            Stop
          </button>
        </div>
      ) : null}
      {message.newWords?.length ? (
        <p className="mt-2 text-sm text-fg-2">
          <span className="text-fg-3">New: </span>
          {message.newWords.map((word, index) => (
            <span key={index}>
              {index > 0 ? " · " : ""}
              <span lang="de" className="text-highlight">{word.german}</span> ({word.english})
            </span>
          ))}
        </p>
      ) : null}
      {message.corrections?.length ? (
        <ul aria-label="Corrections" className="mt-3 space-y-2 rounded-md bg-surface px-4 py-3 text-sm">
          {message.corrections.map((correction, index) => (
            <li key={index}>
              <del className="text-fg-3">{correction.original}</del> <span aria-hidden="true">→</span>
              <span className="sr-only">should be</span> <ins className="font-medium no-underline">{correction.corrected}</ins>
              <span className="block text-fg-2">{correction.explanation}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function TutorView({
  onBack,
  startLesson,
}: {
  onBack: () => void;
  startLesson: (taskId: string) => void;
}) {
  const status = useAIStatus();
  const speech = useGermanSpeech();
  const recorder = useRecorder(Math.min(60, status.settings?.maxRecordingSeconds ?? 60));

  const [context, setContext] = useState<LearnerContext | null>(null);
  const [mode, setMode] = useState<TutorMode>("guided");
  const [topicId, setTopicId] = useState("introductions");
  const [level, setLevel] = useState<TutorLevel>("gentle");
  const [focusId, setFocusId] = useState<string>("");
  const [corrections, setCorrections] = useState<CorrectionMode>("immediate");

  const [session, setSession] = useState<TutorSession | null>(null);
  const [past, setPast] = useState<TutorSession[]>([]);
  const [draft, setDraft] = useState("");
  const [draftSource, setDraftSource] = useState<"typed" | "voice">("typed");
  const [busy, setBusy] = useState<"send" | "transcribe" | "summary" | null>(null);
  const [error, setError] = useState<AIError | null>(null);
  const [asking, setAsking] = useState<null | (() => void)>(null);
  const [retry, setRetry] = useState<null | (() => void)>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!status.ready) return;
    let cancelled = false;
    Promise.all([loadLearnerContext(), listTutorSessions()])
      .then(([loaded, sessions]) => {
        if (cancelled) return;
        setContext(loaded);
        setPast(sessions);
      })
      .catch((loadError) => setError(toAIError(loadError)));
    return () => {
      cancelled = true;
    };
  }, [status.ready]);

  const header = (
    <>
      <button type="button" onClick={onBack} className="dl-press -ml-2 mb-6 flex items-center gap-2 rounded-md px-2 py-1 text-sm text-fg-2 hover:text-fg">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Practice
      </button>
      <PageHeader kicker="Practice · Tutor" title="Deutsch mit KI">
        Short conversations in the German you have learned so far. Advisory, never marked.
      </PageHeader>
    </>
  );

  if (!status.ready) {
    return (
      <div>
        {header}
        <div className="mt-10 border-t border-line pt-5">
          {status.checked ? <AIStatusNote status={status} /> : <InlineLoader label="Checking AI settings…" />}
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div>
        {header}
        {error ? <AIErrorPanel error={error} /> : <SectionLoader className="mt-10" label="Reading what you have learned…" />}
      </div>
    );
  }

  const settings = status.settings!;
  const withConsent = (action: () => void) => {
    if (!settings.consentedAt) {
      setAsking(() => action);
      return;
    }
    action();
  };

  const begin = () => {
    try {
      setError(null);
      const next = startTutorSession({
        mode,
        topicId,
        level,
        grammarFocusId: focusId || null,
        correctionMode: corrections,
        context,
        model: settings.models.tutor,
      });
      setSession(next);
      setDraft("");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch (raw) {
      setError(toAIError(raw));
    }
  };

  const send = async () => {
    if (!session) return;
    setError(null);
    setBusy("send");
    try {
      const next = await sendTutorTurn(session, draft, draftSource, { settings, context });
      setSession(next);
      setDraft("");
      setDraftSource("typed");
      recorder.discard();
      setPast((current) => [next, ...current.filter((s) => s.id !== next.id)]);
    } catch (raw) {
      setError(toAIError(raw)); // the draft stays in the box
      setRetry(() => () => void send());
    } finally {
      setBusy(null);
      inputRef.current?.focus();
    }
  };

  const transcribeTurn = async () => {
    if (!recorder.recording) return;
    setError(null);
    setBusy("transcribe");
    try {
      const { text } = await transcribeRecording(recorder.recording.blob, recorder.recording.mimeType);
      setDraft(text.slice(0, MAX_LEARNER_MESSAGE));
      setDraftSource("voice");
      inputRef.current?.focus();
    } catch (raw) {
      setError(toAIError(raw));
      setRetry(() => () => void transcribeTurn());
    } finally {
      setBusy(null);
    }
  };

  const finish = async () => {
    if (!session) return;
    setError(null);
    setBusy("summary");
    try {
      const next = await summariseSession(session, { settings, context });
      setSession(next);
      if (learnerTurns(next) > 0) setPast((current) => [next, ...current.filter((s) => s.id !== next.id)]);
    } catch (raw) {
      setError(toAIError(raw));
      setRetry(() => () => void finish());
    } finally {
      setBusy(null);
    }
  };

  /*
   * Setup
   */

  if (!session) {
    const topics = topicsFor(context.currentWeek);
    const focus = grammarFocusFor(context.currentWeek);

    return (
      <div>
        {header}

        <section aria-label="Start a conversation" className="mt-10 border-t border-line pt-5">
          <Kicker>New conversation · Week {context.currentWeek} German</Kicker>

          <Choice
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "guided", label: "Guided conversation" },
              { value: "free", label: "Free conversation", note: "ask anything about German" },
            ]}
          />

          {mode === "guided" ? (
            <>
              <Choice
                label="Topic"
                value={topicId}
                onChange={setTopicId}
                options={topics.map((topic) => ({
                  value: topic.id,
                  label: topic.label,
                  disabled: !topic.available,
                  note: topic.available ? undefined : `from Week ${topic.fromWeek}`,
                }))}
              />
              <div className="mt-6">
                <label htmlFor="tutor-focus" className="text-sm font-medium">
                  Grammar focus (optional)
                </label>
                <select
                  id="tutor-focus"
                  value={focusId}
                  onChange={(event) => setFocusId(event.target.value)}
                  className="mt-2 block rounded-md border border-line bg-elevated px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {focus.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          <Choice
            label="Level"
            value={level}
            onChange={setLevel}
            options={[
              { value: "gentle", label: "Gentle", note: "known words, English help" },
              { value: "stretch", label: "Stretch", note: "a few new words, explained" },
            ]}
          />

          <Choice
            label="Corrections"
            value={corrections}
            onChange={setCorrections}
            options={[
              { value: "immediate", label: "After each answer" },
              { value: "delayed", label: "At the end", note: "keeps the conversation flowing" },
            ]}
          />

          <p className="mt-6 text-xs leading-5 text-fg-3">
            {modelLabel(settings.models.tutor)} · up to {settings.tutorTurnLimit} turns · each turn is one AI request
            (today's limit: {settings.dailyRequestLimit}).
          </p>

          <button type="button" onClick={begin} className={[primaryButton, "mt-4"].join(" ")}>
            Start conversation
          </button>
          {error ? <AIErrorPanel error={error} /> : null}
        </section>

        {past.length ? (
          <section aria-label="Past conversations" className="mt-10 border-t border-line pt-5">
            <Kicker>Past conversations</Kicker>
            <ul className="mt-2">
              {past.map((item) => (
                <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-3 border-t border-line py-3 first:border-t-0">
                  <button type="button" onClick={() => setSession(item)} className="text-left text-sm">
                    <span className="font-medium underline-offset-4 hover:underline">{item.topic}</span>
                    <span className="ml-2 text-fg-3">
                      {new Date(item.startedAt).toLocaleDateString(undefined, { dateStyle: "medium" })} · {learnerTurns(item)} turns
                      {item.summary ? " · summary" : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void deleteTutorSession(item.id).then(
                        () => setPast((current) => current.filter((s) => s.id !== item.id)),
                        (deleteError) => setError(toAIError(deleteError)),
                      )
                    }
                    className={tertiaryButton}
                    aria-label={`Delete conversation: ${item.topic}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  /*
   * Conversation and summary
   */

  const turns = learnerTurns(session);
  const atLimit = turns >= settings.tutorTurnLimit;
  const finished = session.summary !== null;

  return (
    <div>
      {header}

      <section aria-label="Conversation" className="mt-10 border-t border-line pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Kicker>
            {session.topic}
            {session.grammarFocus ? ` · ${session.grammarFocus}` : ""}
          </Kicker>
          <p className="tabular text-xs text-fg-3" aria-live="polite">
            Turn {turns} of {settings.tutorTurnLimit}
          </p>
        </div>

        {!finished ? (
          <div role="group" aria-label="Corrections" className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-fg-3">Corrections:</span>
            {(["immediate", "delayed"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={session.correctionMode === value}
                onClick={() => void setCorrectionMode(session, value).then(setSession, (e) => setError(toAIError(e)))}
                className={[
                  "dl-press rounded-full px-3 py-1",
                  session.correctionMode === value ? "bg-surface text-fg ring-1 ring-line-strong" : "text-fg-2 hover:text-fg",
                ].join(" ")}
              >
                {value === "immediate" ? "after each answer" : "at the end"}
              </button>
            ))}
          </div>
        ) : null}

        <ol className="mt-4" aria-label="Messages">
          {session.messages.map((message) => (
            <MessageRow key={message.id} message={message} speech={speech} />
          ))}
        </ol>

        {busy === "send" ? <InlineLoader className="mt-2" label="The tutor is thinking…" /> : null}

        {!finished ? (
          <div className="mt-4 border-t border-line pt-4">
            {atLimit ? (
              <p className="text-sm text-fg-2">That's {settings.tutorTurnLimit} turns. Finish the conversation for a summary.</p>
            ) : (
              <>
                <label htmlFor="tutor-input" className="text-sm font-medium">
                  {draftSource === "voice" ? "Your answer (transcribed: check it, then send)" : "Your answer"}
                </label>
                <textarea
                  ref={inputRef}
                  id="tutor-input"
                  value={draft}
                  maxLength={MAX_LEARNER_MESSAGE}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      if (draft.trim() && busy === null) withConsent(() => void send());
                    }
                  }}
                  rows={3}
                  spellCheck={false}
                  lang="de"
                  className="mt-2 w-full resize-y rounded-md border border-line bg-elevated px-4 py-3 leading-7 outline-none focus:border-line-strong"
                />
                <p className="mt-1 text-xs text-fg-3">Enter sends · Shift+Enter for a new line</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => withConsent(() => void send())}
                    disabled={!draft.trim() || busy !== null}
                    aria-busy={busy === "send"}
                    className={primaryButton}
                  >
                    <Send size={15} aria-hidden="true" />
                    Send
                  </button>

                  {recorder.status === "recording" ? (
                    <button type="button" onClick={recorder.stop} className={secondaryButton}>
                      <Square size={14} aria-hidden="true" />
                      Stop ({formatTime(recorder.elapsed)})
                    </button>
                  ) : recorder.recording ? (
                    <>
                      <button
                        type="button"
                        onClick={() => withConsent(() => void transcribeTurn())}
                        disabled={busy !== null}
                        aria-busy={busy === "transcribe"}
                        className={secondaryButton}
                      >
                        {busy === "transcribe" ? "Transcribing…" : "Use my recording"}
                      </button>
                      <button type="button" onClick={recorder.discard} className={tertiaryButton}>
                        Delete recording
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => void recorder.start()} disabled={busy !== null} className={secondaryButton}>
                      <Mic size={15} aria-hidden="true" />
                      Speak instead
                    </button>
                  )}
                </div>
                {recorder.problem ? <p role="alert" className="mt-2 text-sm text-error">{PROBLEM_TEXT[recorder.problem]}</p> : null}
              </>
            )}

            {asking ? (
              <ConsentNotice
                audio
                onAccept={() => {
                  const action = asking;
                  setAsking(null);
                  void status.giveConsent().then(action, (e) => setError(toAIError(e)));
                }}
                onCancel={() => setAsking(null)}
              />
            ) : null}

            {error ? <AIErrorPanel error={error} onRetry={retry ?? undefined} /> : null}

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => (turns > 0 ? withConsent(() => void finish()) : setSession(null))}
                disabled={busy !== null}
                className={secondaryButton}
              >
                {busy === "summary" ? "Summarising…" : turns > 0 ? "Finish and summarise" : "Cancel"}
              </button>
            </div>
          </div>
        ) : (
          <SummaryView session={session} startLesson={startLesson} onNew={() => setSession(null)} />
        )}
      </section>
    </div>
  );
}

function SummaryView({
  session,
  startLesson,
  onNew,
}: {
  session: TutorSession;
  startLesson: (taskId: string) => void;
  onNew: () => void;
}) {
  const summary = session.summary!;
  const lessons = summary.recommendedLessons
    .map((id) => starterTasks.find((task) => task.id === id))
    .filter((task) => task !== undefined);

  return (
    <div className="dl-feedback mt-6 rounded-lg border border-line bg-elevated p-5" aria-live="polite">
      <Kicker>Session summary · advisory</Kicker>
      {summary.recurringMistakes.length ? (
        <ul className="mt-3 space-y-3">
          {summary.recurringMistakes.map((mistake, index) => (
            <li key={index} className="text-sm leading-6">
              <p className="font-medium">{mistake.pattern}</p>
              <p>
                <del className="text-fg-3">{mistake.original}</del> <span aria-hidden="true">→</span>
                <span className="sr-only">should be</span> <ins className="font-medium no-underline">{mistake.corrected}</ins>
              </p>
              <p className="text-fg-2">{mistake.explanation}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-fg-2">No recurring mistakes were found in this conversation.</p>
      )}
      {summary.strengths.length ? (
        <>
          <p className="mt-5 text-sm font-medium">What went well</p>
          <ul className="mt-1 list-disc pl-5 text-sm leading-6 text-fg-2">
            {summary.strengths.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
      {summary.nextStep ? <p className="mt-5 text-sm leading-6"><span className="text-fg-3">Next: </span>{summary.nextStep}</p> : null}
      {lessons.length ? (
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-fg-3">Practise:</span>
          {lessons.map((task) => (
            <button key={task!.id} type="button" onClick={() => startLesson(task!.id)} className={tertiaryButton}>
              {task!.title}
            </button>
          ))}
        </p>
      ) : null}
      <button type="button" onClick={onNew} className={[secondaryButton, "mt-6"].join(" ")}>
        New conversation
      </button>
    </div>
  );
}
