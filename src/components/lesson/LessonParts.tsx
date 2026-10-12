import { type ReactNode } from "react";

import { ArrowLeft } from "lucide-react";

export function ProgressBar({
  value,
}: {
  value: number;
}) {
  const safeValue = Math.min(
    100,
    Math.max(0, value),
  );

  return (
    <div className="h-1 bg-neutral-100">
      <div
        className="h-full bg-neutral-900 transition-all duration-300"
        style={{
          width: `${safeValue}%`,
        }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </p>

      <p className="mt-2 font-semibold">
        {value}
      </p>
    </div>
  );
}

export function ErrorMessage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-left text-sm leading-6 text-red-900">
      {children}
    </div>
  );
}

export function LessonShell({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-neutral-900">
      <div className="border-b border-black/5 bg-white px-8 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
        >
          <ArrowLeft size={17} />

          Back to today
        </button>
      </div>

      {children}
    </div>
  );
}