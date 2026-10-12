import { useEffect, useRef, useState } from "react";

import { ArrowRight } from "lucide-react";

import {
  writingChecklist,
  writingCues,
  writingSample,
  writingTargetWords,
} from "../../data/lessons/week1Checkpoint";

import SelfCheck from "./SelfCheck";

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function WritingSection({
  onComplete,
}: {
  onComplete: (score: number) => void;
}) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  const words = countWords(text);

  if (submitted) {
    return (
      <>
        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Your text ({words} words)
          </p>
          <p className="mt-2 whitespace-pre-wrap leading-7">{text}</p>
        </div>

        <div className="mt-4 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
          <p className="font-medium text-neutral-900">
            An example to compare with
          </p>
          <p className="mt-1">{writingSample}</p>
        </div>

        <SelfCheck
          title="Check your writing"
          intro="There's no automatic marking for free writing yet, so rate your own text honestly against your example."
          statements={writingChecklist}
          continueLabel="Continue to speaking"
          onSubmit={onComplete}
        />
      </>
    );
  }

  return (
    <>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">
        Write a short introduction about yourself in German.
      </h2>

      <p className="mt-3 text-neutral-500">
        Aim for about {writingTargetWords.min}–{writingTargetWords.max} words.
      </p>

      <div className="mt-4 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
        <p className="font-medium text-neutral-900">Cues (optional)</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {writingCues.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
      </div>

      <textarea
        ref={areaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        spellCheck={false}
        aria-label="Your introduction"
        className="mt-6 w-full resize-y rounded-xl border border-black/10 bg-white px-5 py-4 text-lg leading-8 outline-none transition focus:border-neutral-400"
      />

      <p className="mt-2 text-right text-sm text-neutral-400">
        {words} words
      </p>

      <button
        type="button"
        disabled={words < 5}
        onClick={() => setSubmitted(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Submit writing
        <ArrowRight size={17} />
      </button>
    </>
  );
}
