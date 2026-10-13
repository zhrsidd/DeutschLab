import { useEffect, useRef } from "react";

/*
 * Soft violet light in a dark room (DESIGN.md §8). Three radial-gradient
 * layers and a static grain sit behind a hero; on a fine pointer the light
 * leans a few pixels toward the cursor. Updates are throttled to one per
 * animation frame, move only `transform` (via --mx / --my), and are skipped
 * entirely under reduced motion. The parent must be `position: relative`.
 */
export default function Atmosphere({ interactive = true }: { interactive?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    const host = element?.parentElement;
    if (!interactive || !element || !host || typeof window.matchMedia !== "function") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const apply = () => {
      frame = 0;
      element.style.setProperty("--mx", x.toFixed(3));
      element.style.setProperty("--my", y.toFixed(3));
    };

    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      x = 0;
      y = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);

    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [interactive]);

  return (
    <div ref={ref} aria-hidden="true" className="nc-atmosphere" data-testid="atmosphere">
      <span className="nc-light nc-light--violet" />
      <span className="nc-light nc-light--orchid" />
      <span className="nc-light nc-light--low" />
      <span className="nc-grain" />
    </div>
  );
}
