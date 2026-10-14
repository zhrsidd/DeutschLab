import { Mic, Square, Trash2 } from "lucide-react";

import { formatTime } from "../../hooks/useCountdown";
import { PROBLEM_TEXT, type useRecorder } from "../../hooks/useRecorder";

import { secondaryButton, tertiaryButton } from "./AIParts";

type Recorder = ReturnType<typeof useRecorder>;

/*
 * Record → Stop → Play / Delete. The indicator is a still crimson dot and a
 * clock: no motion while the learner is speaking. Playback uses the native
 * audio controls and never starts on its own.
 */
export default function RecorderControls({ recorder, disabled = false }: { recorder: Recorder; disabled?: boolean }) {
  const { status, problem, elapsed, recording, maxSeconds } = recorder;

  return (
    <div className="mt-3">
      {status === "recording" ? (
        <div className="flex flex-wrap items-center gap-4">
          <p role="status" className="flex items-center gap-2 text-sm font-medium">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-accent" />
            Recording
            <span className="tabular text-fg-2">
              {formatTime(elapsed)} / {formatTime(maxSeconds)}
            </span>
          </p>
          <button type="button" onClick={recorder.stop} className={secondaryButton}>
            <Square size={14} aria-hidden="true" />
            Stop recording
          </button>
        </div>
      ) : recording ? (
        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- the learner's own recording */}
          <audio controls preload="metadata" src={recording.url} aria-label="Play your recording" className="h-9 max-w-full" />
          <span className="tabular text-xs text-fg-3">{formatTime(recording.seconds)}</span>
          <button type="button" onClick={recorder.discard} disabled={disabled} className={tertiaryButton}>
            <span className="inline-flex items-center gap-1.5">
              <Trash2 size={14} aria-hidden="true" />
              Delete recording
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void recorder.start()}
          disabled={disabled || status === "requesting"}
          className={secondaryButton}
        >
          <Mic size={15} aria-hidden="true" />
          {status === "requesting" ? "Waiting for the microphone…" : "Record"}
        </button>
      )}

      {problem ? (
        <p role={status === "error" ? "alert" : "status"} className={["mt-2 text-sm leading-6", status === "error" ? "text-error" : "text-fg-2"].join(" ")}>
          {PROBLEM_TEXT[problem]}
        </p>
      ) : null}
    </div>
  );
}
