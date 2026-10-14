import { useEffect, useRef, useState } from "react";

import { LogoDot } from "./Brand";

const LETTERS = "DeutschLab";
const SEEN_KEY = "dl-intro-seen";
/** The full choreography (index.css "opening sequence"), when startup takes this long. */
export const FULL_MS = 1350;
/** Matches the .dl-intro split in index.css. */
const EXIT_MS = 640;
/** After this long without a database, say so honestly (no percentages). */
const SLOW_MS = 1600;

/** The bowl's centreline (left stem → bowl → right stem); stroked 12 wide it is exactly the Ü's round part. */
const BOWL = "M14 22V38A18 18 0 0 0 50 38V22";
/** The square foot, overlapping the bowl by two units so no seam shows. */
const FOOT = "M56 38V62H32V60A22 22 0 0 0 54 38Z";

function seenThisSession() {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function reducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/*
 * StartupLoader: the opening (DESIGN.md §10). index.html paints obsidian
 * before React; then two points of light emerge inside the Ü, travel to their
 * stems, the Ü is constructed and the wordmark rises.
 *
 * It never holds the app back. The app renders underneath at once and takes
 * input the moment its data is ready (the overlay stops taking pointer
 * events). If the data is ready mid-sequence, the choreography still plays
 * to the end (FULL_MS, the minimum visible opening); if it is slow, the dots
 * fall into the loading loop. Failure exits immediately so the error is visible.
 * Plays once per launch; a reload in the same session gets only the reveal.
 * Purely visual: the app's own status and alert carry the accessible state.
 */
export default function Intro({ ready, failed }: { ready: boolean; failed: boolean }) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");
  const [waiting, setWaiting] = useState(false);
  const [slow, setSlow] = useState(false);
  const [brief] = useState(seenThisSession);
  const started = useRef(performance.now());
  const done = ready || failed;

  useEffect(() => {
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_MS);
    const waitTimer = window.setTimeout(() => setWaiting(true), FULL_MS);
    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(waitTimer);
    };
  }, []);

  useEffect(() => {
    if (!done || phase !== "in") return;

    const remaining = FULL_MS - (performance.now() - started.current);
    if (failed || brief || reducedMotion() || remaining <= 0) {
      setPhase("out");
      return;
    }

    // Ready early: let the sequence finish at its own pace (the minimum visible
    // opening). The app is already rendered and taking input underneath.
    const timer = window.setTimeout(() => setPhase("out"), remaining);
    return () => window.clearTimeout(timer);
  }, [done, failed, brief, phase]);

  useEffect(() => {
    if (phase !== "out") return;
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage can be unavailable; the intro then simply plays again.
    }
    const timer = window.setTimeout(() => setPhase("gone"), reducedMotion() ? 0 : EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className="dl-intro"
      data-phase={phase}
      data-ready={done}
      data-brief={brief}
      data-loading={waiting && !done}
      data-testid="intro"
    >
      <div className="dl-intro__panel dl-intro__panel--top" />
      <div className="dl-intro__panel dl-intro__panel--bottom" />
      <div className="dl-intro__glow" />

      <div className="dl-intro__stage">
        <svg viewBox="0 0 64 64" className="dl-logo dl-intro__mark">
          <path className="dl-intro__bowl" d={BOWL} pathLength={1} />
          <path className="dl-intro__foot" d={FOOT} />
          {(["a", "b"] as const).map((which) => (
            <g key={which} className={`dl-intro__dot-x dl-intro__dot-x--${which}`}>
              <g className={`dl-intro__dot-y dl-intro__dot-y--${which}`}>
                <LogoDot which={which} className={`dl-intro__dot dl-intro__dot--${which}`} />
              </g>
            </g>
          ))}
        </svg>
        <p className="dl-intro__word">
          {LETTERS.split("").map((letter, index) => (
            <span key={index} className="dl-intro__letter" style={{ ["--i" as string]: index }}>
              {letter}
            </span>
          ))}
        </p>
        <span className="dl-intro__line" />
        <p className="dl-intro__note" data-visible={slow && !done}>
          Opening your study data…
        </p>
      </div>
    </div>
  );
}

export { Intro as StartupLoader };
