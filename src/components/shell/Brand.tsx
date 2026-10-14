/*
 * DeutschLab's identity (DESIGN.md §2): a geometric "ü" on a 64-unit grid,
 * round on the left, square on the right, with two umlaut dots, crimson and
 * gold. brand/build.py builds the exported assets from the same geometry.
 */

/** The Ü outline: 12-unit stroke, bowl radii 24 / 12, square foot on the baseline. */
export const LOGO_U = "M8 22H20V38A12 12 0 0 0 44 38V22H56V62H32A24 24 0 0 1 8 38Z";
/** Dot centres and radius (one stroke wide, one stroke above the stems). */
export const LOGO_DOTS = { a: [14, 10], b: [50, 10], r: 6 } as const;

export type LogoState = "idle" | "loading" | "success";

/**
 * The logomark. `idle` is static; `loading` runs the signature dot loop;
 * `success` lets the dots settle into place once. Decorative unless `title`
 * is given; loading state is announced by the loaders, not the mark.
 */
export function Logomark({
  className = "",
  state = "idle",
  mono = false,
  title,
}: {
  className?: string;
  state?: LogoState;
  mono?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={["dl-logo", mono ? "dl-logo--mono" : "", className].join(" ")}
      data-loading={state === "loading"}
      data-settle={state === "success"}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path className="dl-logo__u" d={LOGO_U} />
      <LogoDot which="a" />
      <LogoDot which="b" />
    </svg>
  );
}

/** One umlaut dot inside its two loop transforms (x and y, so the path curves). */
export function LogoDot({ which, className = "" }: { which: "a" | "b"; className?: string }) {
  const [cx, cy] = LOGO_DOTS[which];
  return (
    <g className={`dl-loop-x dl-loop-x--${which}`}>
      <g className={`dl-loop-y dl-loop-y--${which}`}>
        <circle className={[`dl-logo__dot--${which}`, className].join(" ")} cx={cx} cy={cy} r={LOGO_DOTS.r} />
      </g>
    </g>
  );
}

/** Mark + "Deutsch" (bold) "Lab" (light): weight contrast, one colour. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={["inline-flex items-center gap-2 font-display tracking-[-0.03em] text-fg", className].join(" ")}>
      <Logomark className="h-[1.05em] w-auto -translate-y-[0.06em]" />
      <span>
        <span className="font-bold">Deutsch</span>
        <span className="font-light">Lab</span>
      </span>
    </span>
  );
}
