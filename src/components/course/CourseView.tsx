import { useState } from "react";

import { ChevronDown } from "lucide-react";

import { courseUnits } from "../../data/course";
import { starterTasks, type CurriculumWeek, type LessonTask } from "../../data/unit1";
import { allWeeksMastered, currentWeek, type WeekSummary } from "../../lib/progress";
import { Page, PageHeader } from "../shell/AppShell";
import { iconForType } from "../lessonIcons";

interface CourseViewProps {
  summaries: WeekSummary[];
  completedTasks: string[];
  startLesson: (taskId: string) => void;
}

/*
 * The full curriculum as a vertical timeline (DESIGN.md §5): Course → Unit
 * → month → week → activity. The current week is open, mastered weeks are
 * folded, planned weeks and later units are visible but have no actions.
 */
export default function CourseView({ summaries, completedTasks, startLesson }: CourseViewProps) {
  const current = currentWeek(summaries);
  const complete = allWeeksMastered(summaries);
  const byWeek = new Map(summaries.map((summary) => [summary.week, summary]));
  const [toggled, setToggled] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);

  // Only the current week starts open; every other week is one click away.
  const defaultOpen = (summary: WeekSummary) => !complete && summary.week === current;
  const isOpen = (summary: WeekSummary) => (toggled.has(summary.week) ? !defaultOpen(summary) : defaultOpen(summary));
  const toggle = (week: number) =>
    setToggled((set) => {
      const next = new Set(set);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });

  const total = summaries.reduce((sum, summary) => sum + summary.tasks.length, 0);
  const done = summaries.reduce((sum, summary) => sum + summary.done, 0);

  return (
    <Page>
      <PageHeader
        kicker="Course"
        title="Unit 1 · A0 → Strong A1"
        aside={
          <p className="tabular text-sm text-fg-2">
            {done} of {total} activities · {summaries.filter((summary) => summary.mastered).length} of{" "}
            {summaries.length} weeks mastered
          </p>
        }
      >
        Six units from first sounds to C1. DeutschLab v1 builds October (Weeks 1–4); everything after it is
        the plan ahead, shown so you can see where the course goes.
      </PageHeader>

      {courseUnits.map((unit, unitIndex) =>
        !unit.months ? (
          <PlannedUnit key={unit.id} unit={unit} first={!courseUnits[unitIndex - 1] || Boolean(courseUnits[unitIndex - 1].months)} />
        ) : (
        <section key={unit.id} aria-label={unit.title} className="mt-10">
          <div className="grid gap-x-8 md:grid-cols-[10rem_minmax(0,1fr)]">
            <div className="mb-4 md:mb-0">
              <p className="tabular font-display text-display-md font-extralight tracking-tight text-accent">
                {String(unit.number).padStart(2, "0")}
              </p>
              <p className="mt-1 text-sm font-medium">{unit.target}</p>
              <p className="text-sm text-fg-3">{unit.dates}</p>
            </div>

            {(
              <ol className="relative border-l border-line pl-6 md:pl-8">
                {unit.months.map((month) => {
                  const now = !complete && month.weeks.some((week) => week.week === current);
                  const built = month.weeks.some((week) => byWeek.has(week.week));
                  return (
                  <li key={month.month}>
                    <section aria-label={month.month} className="pb-6">
                      <h2 className="-ml-6 mb-3 flex items-baseline gap-3 md:-ml-8">
                        <span
                          aria-hidden="true"
                          className={[
                            "-ml-[4.5px] h-[9px] w-[9px] shrink-0 rounded-full",
                            now
                              ? "bg-accent shadow-[0_0_0_4px_rgb(167_139_250/0.18),0_0_14px_rgb(167_139_250/0.7)]"
                              : built
                                ? "bg-fg-2"
                                : "border border-line-strong bg-canvas",
                          ].join(" ")}
                        />
                        <span className="font-display text-xl font-semibold tracking-tight">{month.month}</span>
                        <span className="text-sm text-fg-3">{month.subtitle}</span>
                      </h2>

                      <ol>
                        {month.weeks.map((week) => {
                          const summary = byWeek.get(week.week);
                          return summary ? (
                            <WeekNode
                              key={week.week}
                              week={week}
                              summary={summary}
                              current={!complete && week.week === current}
                              open={isOpen(summary)}
                              onToggle={() => toggle(week.week)}
                              completedTasks={completedTasks}
                              selected={selected}
                              onSelect={(id) => setSelected((value) => (value === id ? null : id))}
                              startLesson={startLesson}
                            />
                          ) : (
                            <PlannedWeek key={week.week} week={week} />
                          );
                        })}
                      </ol>
                    </section>
                  </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>
        ),
      )}
    </Page>
  );
}

function WeekNode({
  week,
  summary,
  current,
  open,
  onToggle,
  completedTasks,
  selected,
  onSelect,
  startLesson,
}: {
  week: CurriculumWeek;
  summary: WeekSummary;
  current: boolean;
  open: boolean;
  onToggle: () => void;
  completedTasks: string[];
  selected: string | null;
  onSelect: (id: string) => void;
  startLesson: (taskId: string) => void;
}) {
  const status = summary.mastered
    ? "Mastered"
    : summary.done > 0
      ? `${summary.done} of ${summary.tasks.length} done`
      : "Available";

  return (
    <li className={["relative border-t", current ? "border-accent/50" : "border-line"].join(" ")}>
      {current ? (
        <span aria-hidden="true" className="absolute -left-6 top-0 h-full w-px bg-gradient-to-b from-accent via-accent/60 to-transparent md:-left-8" />
      ) : null}
      <section aria-label={`Week ${week.week} progress`}>
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="dl-press group flex w-full items-center gap-4 py-3.5 text-left"
        >
          <span className={["tabular w-16 shrink-0 text-sm font-medium", current ? "text-accent" : ""].join(" ")}>
            Week {week.week}
          </span>
          <span className="min-w-0 flex-1">
            <span className={["block truncate group-hover:text-accent-hover", current ? "font-display text-lg font-semibold tracking-tight" : "font-medium"].join(" ")}>
              {week.title}
            </span>
            <span className="tabular block text-xs text-fg-3">
              {summary.done} of {summary.tasks.length} activities complete
            </span>
          </span>
          <span
            className={[
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
              summary.mastered
                ? "bg-success-soft text-success"
                : current
                  ? "bg-accent font-semibold text-on-accent"
                  : "text-fg-2 ring-1 ring-line",
            ].join(" ")}
          >
            {current && !summary.mastered ? "Current" : status}
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={["shrink-0 text-fg-3 transition-transform duration-base", open ? "" : "-rotate-90"].join(" ")}
          />
        </button>

        <div className="dl-collapse" data-open={open}>
          <div>
            {open ? (
              <ul className="pb-3">
                {summary.tasks.map((task) => (
                  <ActivityRow
                    key={task.id}
                    task={task}
                    complete={completedTasks.includes(task.id)}
                    expanded={selected === task.id}
                    onSelect={() => onSelect(task.id)}
                    startLesson={startLesson}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
    </li>
  );
}

function ActivityRow({
  task,
  complete,
  expanded,
  onSelect,
  startLesson,
}: {
  task: LessonTask;
  complete: boolean;
  expanded: boolean;
  onSelect: () => void;
  startLesson: (taskId: string) => void;
}) {
  const Icon = iconForType[task.type];
  const index = starterTasks.indexOf(task);

  return (
    <li className={["rounded-md", expanded ? "bg-elevated ring-1 ring-line" : ""].join(" ")}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onSelect}
        className="dl-press group grid w-full grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2.5 text-left hover:bg-surface"
      >
        <Icon size={16} strokeWidth={1.8} aria-hidden="true" className={complete ? "text-success" : "text-fg-3 group-hover:text-accent"} />
        <span className="min-w-0">
          <span className={["block truncate text-sm font-medium", complete ? "text-fg-2" : ""].join(" ")}>
            {task.title}
          </span>
          <span className="block truncate text-xs text-fg-3">{task.description}</span>
        </span>
        <span className="tabular flex items-center gap-2 text-xs text-fg-3">
          {task.minutes} min
          {complete ? (
            <span className="rounded-full bg-success-soft px-1.5 py-0.5 font-medium text-success">Done</span>
          ) : null}
        </span>
      </button>

      <div className="dl-collapse" data-open={expanded}>
        <div>
          {expanded ? (
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3 pl-10">
              <p className="max-w-reading text-sm text-fg-2">
                {task.description} About {task.minutes} minutes.
              </p>
              <button
                type="button"
                onClick={() => startLesson(task.id)}
                className="dl-press rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
                data-index={index}
              >
                {complete ? "Review lesson" : "Start lesson"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function PlannedWeek({ week }: { week: CurriculumWeek }) {
  return (
    <li className="border-t border-line py-3.5">
      <div className="flex items-center gap-4">
        <span className="tabular w-16 shrink-0 text-sm text-fg-3">Week {week.week}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-fg-2">{week.title}</span>
          <span className="block truncate text-xs text-fg-3">{week.topics.join(" · ")}</span>
        </span>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-fg-3 ring-1 ring-line">
          Planned
        </span>
      </div>
    </li>
  );
}

/** Later units: one compact row each, structure only (no invented lessons). */
function PlannedUnit({ unit, first }: { unit: (typeof courseUnits)[number]; first: boolean }) {
  return (
    <section aria-label={unit.title} className={first ? "mt-12" : ""}>
      {first ? (
        <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">
          Later units · planned, detailed when each is built
        </h2>
      ) : null}
      <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-baseline gap-x-4 border-t border-line py-3 md:grid-cols-[10rem_minmax(0,1fr)_auto] md:gap-x-8">
        <span className="tabular font-display text-lg font-extralight text-fg-3">{String(unit.number).padStart(2, "0")}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-fg-2">{unit.target}</span>
          <span className="block text-xs text-fg-3">{unit.dates}</span>
        </span>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-fg-3 ring-1 ring-line">Planned</span>
      </div>
    </section>
  );
}
