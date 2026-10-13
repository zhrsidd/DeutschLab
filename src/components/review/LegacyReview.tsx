import { useState } from "react";

import { Check, Eye, RotateCcw, Volume2 } from "lucide-react";

import { NORMAL_RATE, type ReviewCardProps } from "./types";

/*
 * Fallback for review items without usable structured data: reveal the
 * answer, then rate yourself Correct / Again.
 */
export default function LegacyReview({
  item,
  speech,
  onGraded,
  onNext,
}: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);

  const rate = async (correct: boolean) => {
    if (saving) return;

    setSaving(true);

    try {
      await onGraded(correct);
    } finally {
      setSaving(false);
    }

    onNext();
  };

  return (
    <>
      <div className="rounded-3xl border border-black/5 bg-white p-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          {item.prompt}
        </h2>

        {item.audioText ? (
          <button
            type="button"
            disabled={!speech.available}
            onClick={() => speech.speak(item.audioText ?? "", NORMAL_RATE)}
            className="mt-5 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Volume2 size={16} />
            Play
          </button>
        ) : null}

        {revealed ? (
          <div className="mt-6 rounded-xl bg-neutral-50 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Answer
            </p>
            <p className="mt-2 text-lg font-medium">{item.answer}</p>
          </div>
        ) : null}
      </div>

      {revealed ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void rate(false)}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition enabled:hover:bg-neutral-50 disabled:opacity-40"
          >
            <RotateCcw size={16} />
            Again
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => void rate(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:opacity-40"
          >
            <Check size={16} className="dl-check" aria-hidden="true" />
            Correct
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Eye size={16} />
          Reveal answer
        </button>
      )}
    </>
  );
}
