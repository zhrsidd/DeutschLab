import { useEffect, useRef, useState } from "react";

import { ArrowRight } from "lucide-react";

import {
  week1WritingContent,
  type WritingContent,
} from "../../data/lessons/week1Checkpoint";
import { countWords } from "../../lib/text";

import SelfCheck from "./SelfCheck";

interface WritingSectionProps {
  content?: WritingContent;
  /** Pre-fills the box, e.g. a saved draft. */
  initialText?: string;
  /** Reports every edit so the caller can persist a draft. */
  onTextChange?: (text: string) => void;
  /** When given, shows "Clear and start again". */
  onClear?: () => void;
  onComplete: (score: number) => void;
}

/*
 * Free writing with an honest self-check. Nothing is auto-marked, and the
 * example text appears only after the learner submits.
 */
export default function WritingSection({
  content = week1WritingContent,
  initialText = "",
  onTextChange,
  onClear,
  onComplete,
}: WritingSectionProps) {
  const [text, setText] = useState(initialText);
  const [submitted, setSubmitted] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  const words = countWords(text);

  const change = (next: string) => {
    setText(next);
    onTextChange?.(next);
  };

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
          <p className="font-medium text-fg">
            Compare your paragraph with this example
          </p>
          <p className="mt-1">{content.sample}</p>
          <p className="mt-2 text-xs text-neutral-400">
            Yours doesn't need to match. This is only one possible text.
          </p>
        </div>

        <SelfCheck
          title="Check your writing"
          intro="There's no automatic marking for free writing, so rate your own text honestly against your example."
          statements={content.checklist}
          continueLabel={content.continueLabel ?? "Continue"}
          onSubmit={onComplete}
        />
      </>
    );
  }

  return (
    <>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">
        {content.prompt}
      </h2>

      <p className="mt-3 text-neutral-500">
        Aim for about {content.targetWords.min}–{content.targetWords.max} words.
        You can submit outside that range.
      </p>

      <div className="mt-4 rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500">
        <p className="font-medium text-fg">Cues (optional)</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {content.cues.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
      </div>

      <textarea
        ref={areaRef}
        value={text}
        onChange={(event) => change(event.target.value)}
        rows={8}
        spellCheck={false}
        aria-label="Your paragraph"
        className="mt-6 w-full resize-y rounded-xl border border-black/10 bg-white px-5 py-4 text-lg leading-8 outline-none transition focus:border-neutral-400"
      />

      <div className="mt-2 flex items-center justify-between text-sm text-neutral-400">
        {onClear ? (
          <button
            type="button"
            disabled={text === ""}
            onClick={() => {
              setText("");
              onClear();
            }}
            className="underline transition enabled:hover:text-neutral-700 disabled:no-underline disabled:opacity-40"
          >
            Clear and start again
          </button>
        ) : (
          <span />
        )}

        <span aria-live="polite">{words} words</span>
      </div>

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
