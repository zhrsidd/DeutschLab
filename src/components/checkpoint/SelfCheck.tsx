import { useState } from "react";

import { ArrowRight, Check } from "lucide-react";

interface SelfCheckProps {
  title: string;
  intro: string;
  statements: string[];
  continueLabel: string;
  onSubmit: (score: number) => void;
}

/** Honest self-assessment checklist; the score is the number ticked. */
export default function SelfCheck({
  title,
  intro,
  statements,
  continueLabel,
  onSubmit,
}: SelfCheckProps) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    statements.map(() => false),
  );

  const score = checked.filter(Boolean).length;

  return (
    <>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 leading-7 text-neutral-500">{intro}</p>

      <div className="mt-6 space-y-3">
        {statements.map((statement, index) => {
          const on = checked[index];

          return (
            <button
              key={statement}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() =>
                setChecked((current) =>
                  current.map((value, i) => (i === index ? !value : value)),
                )
              }
              className={[
                "flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition",
                on
                  ? "border-neutral-900 bg-white"
                  : "border-black/5 bg-white hover:bg-neutral-50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                  on
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-black/20",
                ].join(" ")}
              >
                {on ? <Check size={15} className="dl-check" aria-hidden="true" /> : null}
              </span>

              <span className="font-medium">{statement}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-sm text-neutral-400">
        {score} of {statements.length} ticked
      </p>

      <button
        type="button"
        onClick={() => onSubmit(score)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        {continueLabel}
        <ArrowRight size={17} />
      </button>
    </>
  );
}
