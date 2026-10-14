import type { ReactNode } from "react";

import { indicatorSpring, m } from "../motion";
import { Wordmark } from "./Brand";

export type View = "home" | "course" | "practice" | "review" | "progress" | "settings";

export const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "home", label: "Home" },
  { view: "course", label: "Course" },
  { view: "practice", label: "Practice" },
  { view: "review", label: "Review" },
  { view: "progress", label: "Progress" },
  { view: "settings", label: "Settings" },
];

interface AppShellProps {
  view: View;
  onNavigate: (view: View) => void;
  dueReviewCount: number;
  /** e.g. "Week 4 of 4" or "October complete". */
  weekLabel: string;
  /** e.g. "1 of 8 activities". */
  weekDetail: string;
  /** Share of the current week's activities complete (0–1). */
  weekShare?: number;
  children: ReactNode;
}

/*
 * The shell (DESIGN.md §7). From 960 px a quiet left rail; below,
 * a top bar. The active destination carries a crimson marker that springs
 * between items (Motion layoutId): a bar on the rail, an underline on top.
 */
export default function AppShell({
  view,
  onNavigate,
  dueReviewCount,
  weekLabel,
  weekDetail,
  weekShare = 0,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <div className="flex min-h-screen flex-col rail:flex-row">
        <aside className="sticky top-0 z-20 shrink-0 border-b border-line bg-canvas/90 backdrop-blur-md rail:flex rail:h-screen rail:w-56 rail:flex-col rail:border-r rail:border-b-0 rail:bg-canvas rail:backdrop-blur-none xl:w-60">
          <div className="flex items-center gap-4 px-5 rail:block rail:pt-7">
            <div className="shrink-0 py-3 rail:mb-10 rail:py-0">
              <Wordmark className="text-lg" />
              <p className="mt-0.5 hidden pl-[1.6rem] text-xs text-fg-3 rail:block">German for ETH</p>
            </div>

            <nav aria-label="Main" className="min-w-0 flex-1 overflow-x-auto">
              <ul className="flex justify-end gap-0.5 rail:block rail:space-y-0.5">
                {NAV_ITEMS.map((item, index) => {
                  const active = item.view === view;

                  return (
                    <li key={item.view} className="relative shrink-0">
                      {active ? (
                        <m.span
                          layoutId="nav-indicator"
                          transition={indicatorSpring}
                          aria-hidden="true"
                          data-testid="nav-indicator"
                          className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent rail:inset-x-0 rail:inset-y-0 rail:h-auto rail:rounded-md rail:bg-surface"
                        >
                          <span className="absolute inset-y-2 left-0 hidden w-0.5 rounded-full bg-progress rail:block" />
                        </m.span>
                      ) : null}

                      <button
                        type="button"
                        aria-current={active ? "page" : undefined}
                        onClick={() => onNavigate(item.view)}
                        className={[
                          "dl-press relative flex w-full items-center gap-3 whitespace-nowrap rounded-md px-3 py-3.5 text-sm rail:py-2",
                          active ? "font-semibold text-fg" : "text-fg-2 hover:text-fg rail:hover:bg-surface/60",
                        ].join(" ")}
                      >
                        <span
                          aria-hidden="true"
                          className={["tabular hidden w-5 text-[11px] rail:inline", active ? "text-fg" : "text-fg-3"].join(" ")}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {item.label}
                        {item.view === "review" && dueReviewCount > 0 ? (
                          <span className="tabular rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold leading-none text-on-accent rail:ml-auto">
                            {dueReviewCount}
                            <span className="sr-only"> due</span>
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="mt-auto hidden border-t border-line px-5 py-6 rail:block">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">October Foundations</p>
            <p className="mt-2 font-display text-lg font-semibold tracking-tight">{weekLabel}</p>
            <div aria-hidden="true" className="mt-3 h-[3px] overflow-hidden rounded-full bg-surface">
              <div
                className="dl-progress-fill h-full rounded-full bg-accent"
                style={{ transform: `scaleX(${Math.min(1, Math.max(0, weekShare))})` }}
              />
            </div>
            <p className="tabular mt-2 text-sm text-fg-2">{weekDetail}</p>
          </div>
        </aside>

        <main key={view} className="dl-enter relative min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Shared page header: kicker, display title and one line of context. */
export function PageHeader({
  kicker,
  title,
  children,
  aside,
}: {
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 pb-2">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
          {kicker}
        </p>
        <h1 className="mt-3 text-display-md md:text-display-lg">{title}</h1>
        {children ? <p className="mt-3 max-w-reading text-fg-2">{children}</p> : null}
      </div>
      {aside}
    </header>
  );
}

/** Page frame: consistent gutters and width. */
export function Page({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="px-5 py-8 md:px-10 md:py-10">
      <div className={["mx-auto", narrow ? "max-w-3xl" : "max-w-page"].join(" ")}>{children}</div>
    </div>
  );
}

/** A section opened by a hairline and a kicker heading. */
export function Section({
  title,
  label,
  children,
  aside,
  className = "",
}: {
  title: string;
  label?: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={label ?? title} className={["mt-10 border-t border-line pt-5 md:mt-12", className].join(" ")}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
