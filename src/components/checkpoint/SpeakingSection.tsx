import { useState } from "react";

import { ArrowRight, Mic, RotateCcw, Square } from "lucide-react";

import {
  SPEAKING_SECONDS,
  speakingChecklist,
  writingCues,
} from "../../data/lessons/week1Checkpoint";

import { formatTime, useCountdown } from "../../hooks/useCountdown";

import SelfCheck from "./SelfCheck";

/** What a checkpoint's speaking section asks for. */
export interface CheckpointSpeakingContent {
  heading: string;
  instructions: string;
  seconds: number;
  cues: string[];
  checklist: string[];
}

export const week1CheckpointSpeaking: CheckpointSpeakingContent = {
  heading: "Introduce yourself in German.",
  instructions: "Speak out loud for 60–90 seconds. Use the timer, and no script.",
  seconds: SPEAKING_SECONDS,
  cues: writingCues,
  checklist: speakingChecklist,
};

export default function SpeakingSection({
  content = week1CheckpointSpeaking,
  onComplete,
}: {
  content?: CheckpointSpeakingContent;
  onComplete: (score: number) => void;
}) {
  const SECONDS = content.seconds;
  const timer = useCountdown(SECONDS);
  const [started, setStarted] = useState(false);
  const [assessing, setAssessing] = useState(false);

  if (assessing) {
    return (
      <SelfCheck
        title="How did it go?"
        intro="Nothing is recorded or analysed, so tick only what is honestly true."
        statements={content.checklist}
        continueLabel="See results"
        onSubmit={onComplete}
      />
    );
  }

  const finishedNaturally = started && !timer.running && timer.remaining === 0;
  const stoppedEarly = started && !timer.running && timer.remaining > 0;

  return (
    <>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">
        {content.heading}
      </h2>

      <p className="mt-3 text-neutral-500">{content.instructions}</p>

      <div className="mt-4 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
        <p className="font-medium text-fg">Cues (optional)</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {content.cues.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-8 text-center">
        <p className="text-7xl font-semibold tabular-nums tracking-tight">
          {formatTime(timer.remaining)}
        </p>

        {finishedNaturally ? (
          <p className="mt-4 text-sm text-neutral-500">Time's up. Well done.</p>
        ) : null}

        {stoppedEarly ? (
          <p className="mt-4 text-sm text-neutral-500">
            Stopped at {formatTime(SECONDS - timer.remaining)}.
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-3">
          {timer.running ? (
            <button
              type="button"
              onClick={timer.stop}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Square size={15} />
              Stop early
            </button>
          ) : !started ? (
            <button
              type="button"
              onClick={() => {
                setStarted(true);
                timer.start();
              }}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <Mic size={16} />
              Start
            </button>
          ) : null}

          {started ? (
            <button
              type="button"
              onClick={() => {
                timer.reset();
                setStarted(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <RotateCcw size={15} />
              Restart
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        disabled={!started || timer.running}
        onClick={() => setAssessing(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Continue to self-assessment
        <ArrowRight size={17} />
      </button>
    </>
  );
}
