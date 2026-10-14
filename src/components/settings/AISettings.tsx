import { useCallback, useEffect, useState, type FormEvent } from "react";

import { AIError, explainAIError, toAIError } from "../../lib/ai/errors";
import { GEMINI_MODELS, modelsFor, type ModelRole } from "../../lib/ai/models";
import {
  getKeyStatus,
  nativeAIAvailable,
  removeKey,
  saveKey,
  testConnection,
  type KeyStatus,
} from "../../lib/ai/native";
import { LIMITS, loadAISettings, saveAISettings, type AISettings as Settings } from "../../lib/ai/settings";
import { deleteAllAIHistory, getUsageSummary, recordUsage, type UsageSummary } from "../../lib/ai/store";
import { ButtonLoader } from "../shell/Loaders";

/*
 * Settings → AI feedback (v1.1). AI is optional and off by default. The key
 * goes straight to the macOS Keychain through a native command; this screen
 * only ever sees "saved" and the last four characters.
 */

const ROLE_TEXT: Record<ModelRole, string> = {
  writing: "Writing feedback",
  speaking: "Speaking feedback (reads the transcript)",
  transcription: "Speech transcription",
  tutor: "Tutor",
};

const button =
  "dl-press inline-flex items-center gap-2 rounded-md border border-line-strong bg-elevated px-3.5 py-2 text-sm font-medium transition enabled:hover:border-accent disabled:cursor-not-allowed disabled:opacity-40";

function LimitField({
  id,
  label,
  unit,
  value,
  range,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  range: { min: number; max: number };
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3">
      <label htmlFor={id} className="text-sm">
        {label}
        <span className="block text-xs text-fg-3">
          {range.min}–{range.max} {unit}
        </span>
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={range.min}
        max={range.max}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          const parsed = Number(text);
          if (Number.isFinite(parsed)) onChange(parsed);
          else setText(String(value));
        }}
        className="tabular w-24 rounded-md border border-line bg-elevated px-3 py-1.5 text-right text-sm"
      />
    </div>
  );
}

export default function AISettings() {
  const native = nativeAIAvailable();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [key, setKey] = useState<KeyStatus | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [visibleModels, setVisibleModels] = useState<string[] | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [busy, setBusy] = useState<"save" | "test" | "remove" | "delete" | null>(null);
  const [confirm, setConfirm] = useState<"remove" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<AIError | null>(null);

  const refreshUsage = useCallback(() => {
    getUsageSummary().then(setUsage, (e) => console.error("Failed to load AI usage:", e));
  }, []);

  useEffect(() => {
    loadAISettings().then(setSettings, (e) => setError(toAIError(e)));
    refreshUsage();
    if (native) getKeyStatus().then(setKey, (e) => setError(toAIError(e)));
  }, [native, refreshUsage]);

  if (!settings) return <p className="text-sm text-fg-3">Loading…</p>;

  const update = async (patch: Partial<Settings>) => {
    try {
      setSettings(await saveAISettings({ ...settings, ...patch, models: { ...settings.models, ...patch.models } }));
    } catch (e) {
      setError(toAIError(e));
    }
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setBusy("save");
    try {
      const status = await saveKey(keyInput);
      setKey(status);
      setKeyInput(""); // the field never keeps the key
      setConnected(null);
      setMessage("Key saved in your Mac's Keychain. Use Test connection to check it.");
    } catch (e) {
      setError(toAIError(e));
    } finally {
      setBusy(null);
    }
  };

  const onTest = async () => {
    setError(null);
    setMessage(null);
    setBusy("test");
    try {
      const report = await testConnection();
      setVisibleModels(report.models);
      setConnected(true);
      void recordUsage({ feature: "connection", model: "models.list", outcome: "ok" }).catch(() => {});
      const ours = GEMINI_MODELS.filter((m) => report.models.includes(m.id)).length;
      setMessage(`Connected. ${ours} of ${GEMINI_MODELS.length} DeutschLab models are available to this key.`);
    } catch (e) {
      const failure = toAIError(e);
      setConnected(false);
      setError(failure);
      void recordUsage({
        feature: "connection",
        model: "models.list",
        outcome: failure.kind === "rate_limited" ? "rate_limited" : "error",
        errorKind: failure.kind,
      }).catch(() => {});
    } finally {
      setBusy(null);
    }
  };

  const onRemove = async () => {
    if (confirm !== "remove") {
      setConfirm("remove");
      return;
    }
    setConfirm(null);
    setBusy("remove");
    try {
      setKey(await removeKey());
      setConnected(null);
      setVisibleModels(null);
      setMessage("Key removed from the Keychain.");
    } catch (e) {
      setError(toAIError(e));
    } finally {
      setBusy(null);
    }
  };

  const onDeleteHistory = async () => {
    if (confirm !== "delete") {
      setConfirm("delete");
      return;
    }
    setConfirm(null);
    setBusy("delete");
    try {
      await deleteAllAIHistory();
      setMessage("Local AI history deleted. Lessons, scores, Review and drafts were not touched.");
      refreshUsage();
    } catch (e) {
      setError(toAIError(e));
    } finally {
      setBusy(null);
    }
  };

  const connection = !key?.stored
    ? "Not connected"
    : connected === true
      ? "Connected"
      : connected === false
        ? "Key saved, but the connection failed"
        : "Key saved (not tested yet)";

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <p id="ai-enabled-label" className="font-medium">
            Optional AI feedback
          </p>
          <p className="mt-1 max-w-reading text-sm leading-6 text-fg-2">
            AI writing and speaking feedback, and the Deutsch mit KI tutor, using your own Google Gemini API key.
            Everything else in DeutschLab works offline without it. AI feedback is advisory: it never changes
            scores, completion, checkpoints or Review.
          </p>
          {!native ? <p className="mt-2 text-sm text-fg-3">Available in the DeutschLab app.</p> : null}
        </div>
        <button
          type="button"
          aria-pressed={settings.enabled}
          aria-labelledby="ai-enabled-label"
          disabled={!native}
          onClick={() => void update({ enabled: !settings.enabled })}
          className={[
            "dl-press rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40",
            settings.enabled ? "bg-accent text-on-accent" : "border border-line-strong bg-elevated text-fg-2",
          ].join(" ")}
        >
          {settings.enabled ? "On" : "Off"}
        </button>
      </div>

      {native ? (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">Provider: Google Gemini</p>
          <p className="mt-2 text-sm">
            <span className="text-fg-3">Connection: </span>
            <span className="font-medium">{connection}</span>
            {key?.hint ? <span className="tabular ml-2 text-fg-3">{key.hint}</span> : null}
          </p>

          <form onSubmit={(event) => void onSave(event)} className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-0 grow">
              <label htmlFor="gemini-key" className="text-sm">
                {key?.stored ? "Replace API key" : "Gemini API key"}
              </label>
              <input
                id="gemini-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                placeholder="Paste a key from Google AI Studio"
                className="mt-1 block w-full rounded-md border border-line bg-elevated px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" disabled={!keyInput.trim() || busy !== null} aria-busy={busy === "save"} className={button}>
              {busy === "save" ? <ButtonLoader /> : null}
              Save key
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={() => void onTest()} disabled={!key?.stored || busy !== null} aria-busy={busy === "test"} className={button}>
              {busy === "test" ? <ButtonLoader /> : null}
              {busy === "test" ? "Testing" : "Test connection"}
            </button>
            <button type="button" onClick={() => void onRemove()} disabled={!key?.stored || busy !== null} className={button}>
              {confirm === "remove" ? "Confirm: remove key" : "Remove key"}
            </button>
          </div>

          <p className="mt-3 max-w-reading text-xs leading-5 text-fg-3">
            The key is stored in the macOS Keychain and used only by the app's native layer. DeutschLab never shows
            it again, never writes it to its database, backups or logs, and sends it only to Google.
          </p>
        </div>
      ) : null}

      {message ? <p role="status" className="text-sm text-success">{message}</p> : null}
      {error ? (
        <div role="alert" className="rounded-md border border-error/20 bg-error-soft px-4 py-3 text-sm text-error">
          <p className="font-semibold">{explainAIError(error).title}</p>
          <p className="mt-0.5">{explainAIError(error).detail}</p>
        </div>
      ) : null}

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">Models</p>
        <div className="mt-2">
          {(Object.keys(ROLE_TEXT) as ModelRole[]).map((role) => (
            <div key={role} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3">
              <label htmlFor={`model-${role}`} className="text-sm">
                {ROLE_TEXT[role]}
              </label>
              <select
                id={`model-${role}`}
                value={settings.models[role]}
                onChange={(event) => void update({ models: { ...settings.models, [role]: event.target.value } })}
                className="rounded-md border border-line bg-elevated px-3 py-1.5 text-sm"
              >
                {modelsFor(role).map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                    {visibleModels && !visibleModels.includes(model.id) ? " (not available to this key)" : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="mt-2 max-w-reading text-xs leading-5 text-fg-3">
          Only models that Google offers on the Gemini API free tier are listed. DeutschLab never switches model or
          provider by itself. Voice: replies are read aloud by your Mac's German system voice.
        </p>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">Limits (DeutschLab's own safeguards)</p>
        <div className="mt-2">
          <LimitField
            id="ai-daily-limit"
            label="AI requests per day"
            unit="requests"
            value={settings.dailyRequestLimit}
            range={LIMITS.dailyRequests}
            onChange={(value) => void update({ dailyRequestLimit: value })}
          />
          <LimitField
            id="ai-tutor-turns"
            label="Turns per tutor conversation"
            unit="turns"
            value={settings.tutorTurnLimit}
            range={LIMITS.tutorTurns}
            onChange={(value) => void update({ tutorTurnLimit: value })}
          />
          <LimitField
            id="ai-recording"
            label="Longest speaking recording"
            unit="seconds"
            value={settings.maxRecordingSeconds}
            range={LIMITS.recordingSeconds}
            onChange={(value) => void update({ maxRecordingSeconds: value })}
          />
        </div>
        <p className="mt-2 max-w-reading text-xs leading-5 text-fg-3">
          Writing feedback accepts up to 1,000 words. These limits are not Google's quotas and cannot guarantee zero
          cost. The real protection is keeping your Google project on the free tier: don't link a billing account.
          DeutschLab cannot see your billing tier; check it on the Projects page in Google AI Studio.
        </p>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">Privacy</p>
        <ul className="mt-2 max-w-reading list-disc space-y-1 pl-5 text-sm leading-6 text-fg-2">
          <li>Only what you choose to submit is sent to Google: your text, transcript or recording, plus a short summary of the lessons you have reached.</li>
          <li>On the free tier Google may use submitted content to improve its products.</li>
          <li>Requests ask Google not to store them for later retrieval. DeutschLab cannot delete anything from Google's systems.</li>
          <li>Recordings stay in memory until you delete them or leave the screen; they are never saved to disk.</li>
        </ul>
        {settings.consentedAt ? (
          <p className="mt-3 text-sm text-fg-3">
            You accepted this on {new Date(settings.consentedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}.{" "}
            <button type="button" onClick={() => void update({ consentedAt: null })} className="underline underline-offset-4 hover:text-fg">
              Ask me again
            </button>
          </p>
        ) : null}
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">Usage (this Mac)</p>
        {usage ? (
          <dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-y-1.5 text-sm">
            <dt className="text-fg-2">Requests today</dt>
            <dd className="tabular m-0">
              {usage.today} of {settings.dailyRequestLimit}
            </dd>
            <dt className="text-fg-2">Requests, last {usage.windowDays} days</dt>
            <dd className="tabular m-0">{usage.requests}</dd>
            <dt className="text-fg-2">Successful · failed</dt>
            <dd className="tabular m-0">
              {usage.successes} · {usage.failures}
            </dd>
            <dt className="text-fg-2">Rate-limit responses</dt>
            <dd className="tabular m-0">{usage.rateLimited}</dd>
            <dt className="text-fg-2">Tokens in · out (as reported)</dt>
            <dd className="tabular m-0">
              {usage.inputTokens.toLocaleString()} · {usage.outputTokens.toLocaleString()}
            </dd>
            <dt className="text-fg-2">Saved assessments · tutor conversations</dt>
            <dd className="tabular m-0">
              {usage.assessments} · {usage.tutorSessions}
            </dd>
            {usage.byModel.map((row) => (
              <div key={row.model} className="contents">
                <dt className="text-fg-3">{row.model}</dt>
                <dd className="tabular m-0 text-fg-3">{row.requests}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-fg-3">–</p>
        )}
        <p className="mt-2 text-xs leading-5 text-fg-3">
          Usage information is approximate. Check Google AI Studio for authoritative limits. DeutschLab does not
          estimate charges.
        </p>
        <button type="button" onClick={() => void onDeleteHistory()} disabled={busy !== null} className={[button, "mt-4"].join(" ")}>
          {confirm === "delete" ? "Confirm: delete AI history" : "Delete AI history"}
        </button>
        <p className="mt-1 text-xs text-fg-3">Deletes saved AI feedback, tutor conversations and the usage log on this Mac.</p>
      </div>
    </div>
  );
}
