/*
 * DeutschLab's mark: two dots over a bar, the Umlaut ("die Pünktchen") as
 * a typographic signature (DESIGN.md §9). It is decorative everywhere.
 */
export function UmlautMark({ className = "", animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 18"
      className={[animate ? "nc-mark nc-mark--animate" : "nc-mark", className].join(" ")}
    >
      <circle className="nc-mark__dot" cx="7" cy="4" r="2.6" />
      <circle className="nc-mark__dot nc-mark__dot--2" cx="17" cy="4" r="2.6" />
      <rect className="nc-mark__bar" x="2" y="12" width="20" height="2.4" rx="1.2" />
    </svg>
  );
}

/** Wordmark for the rail and lesson header. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={["inline-flex items-center gap-2 font-display font-semibold tracking-tight", className].join(" ")}>
      <UmlautMark className="h-[0.8em] w-auto text-accent" />
      DeutschLab
    </span>
  );
}
