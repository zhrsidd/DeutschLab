import { useEffect, useState } from "react";

import { UmlautMark } from "./Brand";

const WORD = "DeutschLab";
const SEEN_KEY = "dl-intro-seen";
/** Matches the .dl-intro exit animation in index.css. */
const EXIT_MS = 760;
/** After this long without a database, say so honestly (no percentages). */
const SLOW_MS = 1600;

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
 * The opening (DESIGN.md §10). Obsidian first (index.html paints it before
 * React), then violet light, the Umlaut mark and the wordmark. It never
 * waits on itself: the moment the database is ready (or fails) the stage
 * splits along its centre line and reveals the app, which is already
 * rendered underneath and interactive (the overlay stops taking pointer
 * events as it leaves). It plays once per launch; a reload in the same
 * session gets only the short reveal. Purely visual: the app's own
 * loading status and error alert carry the accessible state.
 */
export default function Intro({ ready, failed }: { ready: boolean; failed: boolean }) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");
  const [slow, setSlow] = useState(false);
  const [brief] = useState(seenThisSession);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready || failed) setPhase((current) => (current === "in" ? "out" : current));
  }, [ready, failed]);

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
    <div aria-hidden="true" className="dl-intro" data-phase={phase} data-brief={brief} data-testid="intro">
      <div className="dl-intro__panel dl-intro__panel--top" />
      <div className="dl-intro__panel dl-intro__panel--bottom" />
      <div className="dl-intro__glow" />

      <div className="dl-intro__stage">
        <UmlautMark animate className="dl-intro__mark" />
        <p className="dl-intro__word">
          {WORD.split("").map((letter, index) => (
            <span key={index} className="dl-intro__letter" style={{ ["--i" as string]: index }}>
              {letter}
            </span>
          ))}
        </p>
        <span className="dl-intro__line" />
        <p className="dl-intro__note" data-visible={slow && phase === "in"}>
          Opening your study data…
        </p>
      </div>
    </div>
  );
}
