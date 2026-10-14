import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Microphone recording for optional AI speaking feedback (v1.1).
 *
 * Starts only when the learner presses Record, stops at `maxSeconds`, and
 * keeps exactly one compressed Blob in memory. Nothing is written to disk
 * or uploaded here; the recording is gone when it is deleted or the screen
 * is left. Every failure is reported as a state, never thrown.
 */

export type RecorderStatus = "idle" | "requesting" | "recording" | "recorded" | "error";
export type RecorderProblem = "permission_denied" | "no_microphone" | "unsupported" | "empty" | "interrupted" | "unknown";

export interface Recording {
  blob: Blob;
  url: string;
  mimeType: string;
  seconds: number;
}

const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"];

export const recorderSupported = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices?.getUserMedia === "function" &&
  typeof window !== "undefined" &&
  typeof window.MediaRecorder !== "undefined";

function pickMimeType(): string {
  const isSupported = window.MediaRecorder.isTypeSupported?.bind(window.MediaRecorder);
  return PREFERRED_TYPES.find((type) => isSupported?.(type)) ?? "";
}

function problemFrom(error: unknown): RecorderProblem {
  const name = (error as { name?: string } | null)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "permission_denied";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "NotReadableError") return "no_microphone";
  return "unknown";
}

export const PROBLEM_TEXT: Record<RecorderProblem, string> = {
  permission_denied:
    "DeutschLab may not use the microphone. Allow it in System Settings → Privacy & Security → Microphone, then try again. You can also type what you said.",
  no_microphone: "No microphone was found. Connect one and try again, or type what you said.",
  unsupported: "Recording is not supported here. You can type what you said instead.",
  empty: "The recording is empty. Try again.",
  interrupted: "Recording stopped unexpectedly (the microphone may have been disconnected). What was recorded is kept.",
  unknown: "The microphone could not be started. Try again, or type what you said.",
};

export function useRecorder(maxSeconds: number) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [problem, setProblem] = useState<RecorderProblem | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [recording, setRecording] = useState<Recording | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const interruptedRef = useRef(false);
  const urlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clearTimer = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const releaseUrl = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const start = useCallback(async () => {
    if (!recorderSupported()) {
      setProblem("unsupported");
      setStatus("error");
      return;
    }

    releaseUrl();
    setRecording(null);
    setProblem(null);
    setElapsed(0);
    setStatus("requesting");
    interruptedRef.current = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      if (!mountedRef.current) return;
      setProblem(problemFrom(error));
      setStatus("error");
      return;
    }

    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setProblem("unsupported");
      setStatus("error");
      return;
    }

    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];

    stream.getTracks().forEach((track) =>
      track.addEventListener("ended", () => {
        interruptedRef.current = true;
        stop();
      }),
    );

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onerror = () => {
      interruptedRef.current = true;
      stop();
    };

    recorder.onstop = () => {
      clearTimer();
      stopTracks();
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = []; // keep only one copy of the audio
      recorderRef.current = null;
      if (!mountedRef.current) return;

      const seconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));

      if (blob.size === 0) {
        setProblem(interruptedRef.current ? "interrupted" : "empty");
        setStatus("error");
        return;
      }

      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setRecording({ blob, url, mimeType: type, seconds });
      setProblem(interruptedRef.current ? "interrupted" : null);
      setStatus("recorded");
    };

    startedAtRef.current = Date.now();
    recorder.start(1000);
    setStatus("recording");

    timerRef.current = window.setInterval(() => {
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(Math.min(maxSeconds, Math.floor(seconds)));
      if (seconds >= maxSeconds) stop();
    }, 250);
  }, [maxSeconds, stop]);

  /** Deletes the recording from memory. */
  const discard = useCallback(() => {
    stop();
    releaseUrl();
    setRecording(null);
    setProblem(null);
    setElapsed(0);
    setStatus("idle");
  }, [stop]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      stopTracks();
      releaseUrl();
    };
  }, []);

  return { status, problem, elapsed, recording, start, stop, discard, maxSeconds };
}
