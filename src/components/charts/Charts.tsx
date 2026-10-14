import { useEffect, useState, type ReactNode } from "react";

import { niceMax } from "../../lib/progressStats";

/*
 * Hand-built charts (see DESIGN.md §15). Marks are stone (≥ 5:1 on the
 * dark surfaces); the "current" mark is gold with a dot marker and a
 * bright label, every chart is a
 * figure with a caption and a visually hidden data table, and marks are
 * focusable with a tooltip on hover or focus.
 */

/** True one frame after mount, so marks can grow in (CSS transition). */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return mounted;
}

export function ChartFigure({
  title,
  description,
  table,
  empty,
  emptyText,
  emptyHint,
  aside,
  children,
}: {
  title: string;
  description: string;
  /** Exact values for screen readers. */
  table: { columns: string[]; rows: (string | number)[][] };
  empty?: boolean;
  emptyText?: string;
  /** Optional honest scaffold shown under the empty text (e.g. the day labels, no values). */
  emptyHint?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="m-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">{title}</h3>
        {aside}
      </div>
      <figcaption className="mt-1 text-sm text-fg-2">{description}</figcaption>

      <div className="mt-4">
        {empty ? (
          <div className="border-t border-line pt-4">
            <p className="text-sm leading-6 text-fg-2">{emptyText}</p>
            {emptyHint}
          </div>
        ) : (
          children
        )}
      </div>

      {/* A table ignores width: 1px, so the wrapper (not the table) is visually hidden. */}
      <div className="sr-only">
      <table>
        <caption>{title}</caption>
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}

function Tooltip({ children }: { children: ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-xs font-medium text-canvas group-hover:block group-focus-visible:block"
    >
      {children}
    </span>
  );
}

export interface Bar {
  key: string;
  label: string;
  value: number;
  /** Tooltip / accessible text. */
  detail: string;
  current?: boolean;
}

/** Vertical bars with a zero baseline and a round maximum. */
export function BarChart({ bars, height = 120, unit }: { bars: Bar[]; height?: number; unit: string }) {
  const mounted = useMounted();
  const max = niceMax(Math.max(0, ...bars.map((bar) => bar.value)));

  return (
    <div className="flex gap-3">
      <div
        aria-hidden="true"
        className="tabular flex flex-col justify-between text-right text-[11px] text-fg-3"
        style={{ height }}
      >
        <span>{max}</span>
        <span>{max / 2 >= 1 ? max / 2 : ""}</span>
        <span>0</span>
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="relative flex items-end gap-1.5 border-b border-line-strong"
          style={{ height }}
          role="list"
          aria-label={`Values in ${unit}`}
        >
          <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
          <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />

          {bars.map((bar) => (
            <div
              key={bar.key}
              role="listitem"
              tabIndex={0}
              aria-label={bar.detail}
              className="group relative flex h-full flex-1 items-end outline-offset-2"
            >
              <Tooltip>{bar.detail}</Tooltip>
              <div
                className={[
                  "mx-auto w-full max-w-3 origin-bottom rounded-t-full transition-[transform,background-color] duration-chart ease-out-quint",
                  bar.value > 0
                    ? bar.current
                      ? "bg-highlight"
                      : "bg-fg-3 group-hover:bg-fg-2"
                    : "",
                ].join(" ")}
                style={{
                  height: `${(bar.value / max) * 100}%`,
                  transform: mounted ? "scaleY(1)" : "scaleY(0)",
                  minHeight: bar.value > 0 ? 2 : 0,
                }}
              />
            </div>
          ))}
        </div>

        <div aria-hidden="true" className="mt-2 flex gap-1.5">
          {bars.map((bar) => (
            <span
              key={bar.key}
              className={[
                "flex-1 text-center text-[11px]",
                bar.current ? "font-semibold text-fg" : "text-fg-3",
              ].join(" ")}
            >
              {bar.label}
              {bar.current ? <span className="mx-auto mt-1 block h-1 w-1 rounded-full bg-highlight" /> : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface Segment {
  key: string;
  label: string;
  state: "done" | "next" | "todo";
}

/** One block per activity: completed (crimson), current (gold outline), upcoming (hairline outline), with a legend. */
export function SegmentMeter({ segments }: { segments: Segment[] }) {
  const mounted = useMounted();

  return (
    <div>
    <ol className="flex gap-1" aria-label="Activities this week">
      {segments.map((segment, index) => (
        <li
          key={segment.key}
          tabIndex={0}
          aria-label={`${segment.label}: ${segment.state === "done" ? "completed" : segment.state === "next" ? "current" : "upcoming"}`}
          className="group relative h-2 flex-1"
        >
          <Tooltip>{segment.label}</Tooltip>
          <span
            className={[
              "block h-full rounded-full transition-[opacity,transform] duration-chart ease-out-quint",
              segment.state === "done"
                ? "bg-progress"
                : segment.state === "next"
                  ? "bg-highlight/25 ring-1 ring-inset ring-highlight"
                  : "bg-surface ring-1 ring-inset ring-line-strong",
            ].join(" ")}
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "scaleX(0.6)",
              transitionDelay: `${index * 30}ms`,
            }}
          />
        </li>
      ))}
    </ol>
      <ul aria-hidden="true" className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-fg-3">
        <li className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-progress" />Completed</li>
        <li className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-highlight/25 ring-1 ring-inset ring-highlight" />Current</li>
        <li className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-surface ring-1 ring-inset ring-line-strong" />Upcoming</li>
      </ul>
    </div>
  );
}

export interface HBar {
  key: string;
  label: string;
  value: number;
  max: number;
  /** Text shown at the end of the row. */
  display: string;
  detail: string;
  muted?: boolean;
}

/** Labelled horizontal bars sharing one scale. */
export function HBarList({ rows }: { rows: HBar[] }) {
  const mounted = useMounted();

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[minmax(7rem,11rem)_1fr_auto] items-center gap-3 text-sm">
          <span className={["truncate", row.muted ? "text-fg-3" : ""].join(" ")}>{row.label}</span>
          <span
            tabIndex={0}
            aria-label={row.detail}
            className="group relative block h-2 rounded-full bg-surface"
          >
            <Tooltip>{row.detail}</Tooltip>
            <span
              className="block h-full origin-left rounded-full bg-accent transition-transform duration-chart ease-out-quint"
              style={{
                width: `${row.max ? (row.value / row.max) * 100 : 0}%`,
                transform: mounted ? "scaleX(1)" : "scaleX(0)",
              }}
            />
          </span>
          <span className="tabular min-w-12 text-right text-fg-2">{row.display}</span>
        </li>
      ))}
    </ul>
  );
}

export interface ScoreRow {
  key: string;
  label: string;
  group: string;
  latest: number;
  best: number;
  detail: string;
}

/** Latest score (dot) and best score (tick) on a 0–100% track, with an 80% reference. */
export function ScoreDots({ rows }: { rows: ScoreRow[] }) {
  const mounted = useMounted();
  let previousGroup = "";

  return (
    <div>
      <div aria-hidden="true" className="tabular mb-1 grid grid-cols-[minmax(8rem,14rem)_1fr] gap-3 text-[11px] text-fg-3">
        <span />
        <span className="relative h-4">
          <span className="absolute left-0">0%</span>
          <span className="absolute left-[80%] -translate-x-1/2">80%</span>
          <span className="absolute right-0">100%</span>
        </span>
      </div>

      <ul>
        {rows.map((row) => {
          const header = row.group !== previousGroup ? row.group : null;
          previousGroup = row.group;

          return (
            <li key={row.key}>
              {header ? (
                <p className="mt-3 border-t border-line pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">
                  {header}
                </p>
              ) : null}
              <div className="grid grid-cols-[minmax(8rem,14rem)_1fr] items-center gap-3 py-1.5 text-sm">
                <span className="truncate">{row.label}</span>
                <span tabIndex={0} aria-label={row.detail} className="group relative block h-4">
                  <Tooltip>{row.detail}</Tooltip>
                  <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line" />
                  <span aria-hidden="true" className="absolute top-0 h-full w-px bg-fg-3/50" style={{ left: "80%" }} />
                  <span
                    aria-hidden="true"
                    className="absolute top-0.5 h-3 w-0.5 bg-fg-3"
                    style={{ left: `calc(${row.best * 100}% - 1px)` }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-0.5 h-3 w-3 rounded-full border-2 border-canvas bg-accent transition-[left] duration-chart ease-out-quint"
                    style={{ left: `calc(${(mounted ? row.latest : 0) * 100}% - 6px)` }}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
