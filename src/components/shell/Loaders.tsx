import { useEffect, useState } from "react";

import { Logomark } from "./Brand";

/*
 * The loading family (DESIGN.md §12). One motion language at every size: the
 * umlaut dots trade places on a curve and settle back. Pick by context:
 *   BrandLoader    the mark itself, for a whole view that has nothing to show yet
 *   SectionLoader  dots + a sentence, for one region of a page
 *   InlineLoader   dots at text size, inside a line of text
 *   ButtonLoader   single-colour dots inside a busy button (decorative; the label says what is happening)
 *   StartupLoader  the opening sequence (Intro.tsx)
 * Loaders wait LOADER_DELAY_MS before appearing, so quick work never flashes,
 * and they always carry words (role="status") so motion is never the only signal.
 * Prefer keeping visible content (or a skeleton) over replacing it with a loader.
 */

export const LOADER_DELAY_MS = 300;

/** False until `delay` ms have passed while `active`; resets when inactive. */
export function useDelayedFlag(active = true, delay = LOADER_DELAY_MS) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = window.setTimeout(() => setShown(true), delay);
    return () => window.clearTimeout(timer);
  }, [active, delay]);

  return active && shown;
}

/** The two dots, as HTML (for text-sized loaders). */
export function Dots({ variant, mono = false }: { variant?: "section" | "button"; mono?: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-loading="true"
      className={["dl-dots", variant ? `dl-dots--${variant}` : "", mono ? "dl-dots--mono" : ""].join(" ")}
    >
      <span className="dl-loop-x dl-loop-x--a">
        <span className="dl-loop-y dl-loop-y--a" />
      </span>
      <span className="dl-loop-x dl-loop-x--b">
        <span className="dl-loop-y dl-loop-y--b" />
      </span>
    </span>
  );
}

export function BrandLoader({ label, className = "" }: { label: string; className?: string }) {
  const visible = useDelayedFlag();
  return (
    <div role="status" className={["grid justify-items-center gap-5 py-16", className].join(" ")}>
      {visible ? (
        <>
          <Logomark state="loading" className="dl-loader h-auto w-12 text-fg" />
          <span className="dl-loader text-sm text-fg-2">{label}</span>
        </>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

export function SectionLoader({ label, className = "" }: { label: string; className?: string }) {
  const visible = useDelayedFlag();
  return (
    <div role="status" className={["flex min-h-24 items-center gap-3 py-8", className].join(" ")}>
      {visible ? (
        <>
          <span className="dl-loader inline-flex">
            <Dots variant="section" />
          </span>
          <span className="dl-loader text-sm text-fg-2">{label}</span>
        </>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

export function InlineLoader({ label, className = "" }: { label: string; className?: string }) {
  const visible = useDelayedFlag();
  return (
    <span role="status" className={["inline-flex items-center gap-2", className].join(" ")}>
      {visible ? (
        <span className="dl-loader inline-flex">
          <Dots />
        </span>
      ) : null}
      <span className={visible ? "dl-loader" : "sr-only"}>{label}</span>
    </span>
  );
}

/** Dots for a busy button. Put it beside the button's own busy text ("Exporting…"). */
export function ButtonLoader() {
  const visible = useDelayedFlag(true, 150);
  return visible ? (
    <span className="dl-loader inline-flex">
      <Dots variant="button" mono />
    </span>
  ) : null;
}
