import { Fragment, useMemo, useState, type ElementType } from "react";

import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Headphones,
  Languages,
  Mic,
  NotebookPen,
  RotateCcw,
  Target,
  Volume2,
} from "lucide-react";

import {
  starterTasks,
  taskWeek,
  type LessonTask,
  type LessonType,
} from "../../data/unit1";
import {
  STUDY_TIME_OPTIONS,
  type DailyPlan,
  type PlanItem,
} from "../../lib/dailyPlanner";
import {
  allWeeksMastered,
  currentWeek,
  type WeekSummary,
} from "../../lib/progress";
import { formatReviewDate } from "../ReviewView";

export const iconForType: Record<LessonType, ElementType> = {
  vocabulary: Languages,
  grammar: BookOpen,
  pronunciation: Volume2,
  listening: Headphones,
  speaking: Mic,
  writing: NotebookPen,
  reading: BookOpen,
  review: Target,
};

/** What each week is about, for the line under the greeting. */
const WEEK_FOCUS: Record<number, string> = {
  1: "This week: German sounds, introductions, sein and your first sentences.",
  2: "This week: haben, everyday verbs, family and daily life.",
  3: "This week: articles, plurals, the accusative and nicht / kein.",
  4: "This week: everyday vocabulary, accusative pronouns and irregular verbs.",
};

interface TodayViewProps {
  completedTasks: string[];
  summaries: WeekSummary[];
  implementedLessonIds: Set<string>;
  plan: DailyPlan;
  nextReviewAt: string | null;
  studyMinutes: number;
  setStudyMinutes: (minutes: number) => void;
  startPlanItem: (item: PlanItem) => void;
  startLesson: (taskId: string) => void;
  toggleTask: (id: string) => Promise<void>;
}

export default function TodayView({
  completedTasks,
  summaries,
  implementedLessonIds,
  plan,
  nextReviewAt,
  studyMinutes,
  setStudyMinutes,
  startPlanItem,
  startLesson,
  toggleTask,
}: TodayViewProps) {
  const week = currentWeek(summaries);
  const complete = allWeeksMastered(summaries);

  return (
    <div className="dl-enter px-5 py-6 md:px-10 md:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-medium text-neutral-400">
              Unit 1 · October Foundations ·{" "}
              {complete ? "Complete" : `Week ${week}`}
            </p>

            <h1 className="text-3xl font-semibold tracking-[-0.03em]">
              Guten Morgen.
            </h1>

            <p className="mt-2 max-w-xl text-neutral-500">
              {complete
                ? "October is mastered. Keep your reviews going so the words and patterns stay fresh."
                : WEEK_FOCUS[week]}
            </p>
          </div>

          <div>
            <p
              id="study-time-label"
              className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400 md:text-right"
            >
              Study time today
            </p>

            <div
              role="group"
              aria-labelledby="study-time-label"
              className="flex rounded-xl border border-black/5 bg-white p-1"
            >
              {STUDY_TIME_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={minutes === studyMinutes}
                  onClick={() => setStudyMinutes(minutes)}
                  className={[
                    "tabular rounded-lg px-3.5 py-2 text-sm transition-colors",
                    minutes === studyMinutes
                      ? "bg-neutral-900 font-medium text-white"
                      : "text-neutral-500 hover:bg-neutral-50",
                  ].join(" ")}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>
        </header>

        <PlanSection
          plan={plan}
          nextReviewAt={nextReviewAt}
          complete={complete}
          startPlanItem={startPlanItem}
        />

        <OctoberProgress summaries={summaries} current={week} complete={complete} />

        <ActivityBrowser
          completedTasks={completedTasks}
          summaries={summaries}
          current={week}
          implementedLessonIds={implementedLessonIds}
          startLesson={startLesson}
          toggleTask={toggleTask}
        />
      </div>
    </div>
  );
}

function PlanSection({
  plan,
  nextReviewAt,
  complete,
  startPlanItem,
}: {
  plan: DailyPlan;
  nextReviewAt: string | null;
  complete: boolean;
  startPlanItem: (item: PlanItem) => void;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold tracking-tight">Today's plan</h2>

        <span className="tabular text-sm text-neutral-400">
          {plan.totalMinutes} of {plan.budgetMinutes} min ·{" "}
          {plan.dueReviewCount}{" "}
          {plan.dueReviewCount === 1 ? "review" : "reviews"} due
        </span>
      </div>

      {plan.done ? (
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <p className="font-medium">You're done for today.</p>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            {nextReviewAt
              ? `Next review: ${formatReviewDate(nextReviewAt)}.`
              : "No reviews are scheduled yet."}{" "}
            {complete
              ? "There are no new lessons after October yet."
              : "Consistency matters more than grinding extra lessons."}
          </p>
        </div>
      ) : (
        <ol className="overflow-hidden rounded-2xl border border-black/5 bg-white">
          {plan.items.map((item, index) => {
            const Icon =
              item.kind === "lesson"
                ? iconForType[
                    starterTasks.find((task) => task.id === item.sourceId)?.type ??
                      "review"
                  ]
                : RotateCcw;

            return (
              <li
                key={item.id}
                className={index !== plan.items.length - 1 ? "border-b border-black/5" : ""}
              >
                <button
                  type="button"
                  onClick={() => startPlanItem(item)}
                  className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-neutral-50/70 sm:px-5"
                >
                  <span className="tabular hidden w-5 shrink-0 text-sm font-medium text-neutral-300 sm:block">
                    {index + 1}
                  </span>

                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      index === 0
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600",
                    ].join(" ")}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 truncate text-sm text-neutral-400">
                      {item.reason} · {item.description}
                    </p>
                  </div>

                  <span className="tabular shrink-0 text-sm text-neutral-400">
                    {item.minutes} min
                  </span>

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function OctoberProgress({
  summaries,
  current,
  complete,
}: {
  summaries: WeekSummary[];
  current: number;
  complete: boolean;
}) {
  const total = summaries.reduce((sum, week) => sum + week.tasks.length, 0);
  const done = summaries.reduce((sum, week) => sum + week.done, 0);
  const mastered = summaries.filter((week) => week.mastered).length;

  return (
    <section aria-label="October Foundations" className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold tracking-tight">
          {complete ? "October Foundations complete" : "October Foundations"}
        </h2>

        <span className="tabular text-sm text-neutral-400">
          {done} of {total} activities · {mastered} of {summaries.length} weeks
          mastered
        </span>
      </div>

      {complete ? (
        <p className="mb-3 max-w-2xl text-sm leading-6 text-neutral-500">
          You have mastered Weeks 1–4 in DeutschLab. This is the app's own
          milestone, not a CEFR certificate. November (Weeks 5–16) is not built
          yet, so keep your due reviews going.
        </p>
      ) : null}

      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-black/5 bg-black/5 gap-px lg:grid-cols-4">
        {summaries.map((week) => (
          <WeekCell key={week.week} week={week} current={!complete && week.week === current} />
        ))}
      </div>
    </section>
  );
}

function WeekCell({ week, current }: { week: WeekSummary; current: boolean }) {
  const percent = week.tasks.length === 0 ? 0 : Math.round((week.done / week.tasks.length) * 100);

  return (
    <section aria-label={`Week ${week.week} progress`} className="bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="leading-none">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Week
          </span>
          <span
            className={[
              "tabular mt-1 block text-2xl font-semibold tracking-tight",
              current ? "text-accent" : "",
            ].join(" ")}
          >
            {String(week.week).padStart(2, "0")}
          </span>
        </p>

        {week.mastered ? (
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white">
            Mastered
          </span>
        ) : current ? (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
            Current
          </span>
        ) : null}
      </div>

      <p className="mt-3 min-h-10 text-sm font-medium leading-5">{week.title}</p>

      {/* One segment per activity: completed, or still to do. */}
      <div
        className="mt-4 flex gap-1"
        role="progressbar"
        aria-label={`Week ${week.week} activities`}
        aria-valuemin={0}
        aria-valuemax={week.tasks.length}
        aria-valuenow={week.done}
      >
        {week.tasks.map((task, index) => (
          <span
            key={task.id}
            className={[
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              index < week.done
                ? week.mastered
                  ? "bg-neutral-900"
                  : "bg-accent"
                : "bg-neutral-100",
            ].join(" ")}
          />
        ))}
      </div>

      <p className="tabular mt-2 text-xs text-neutral-400">
        {week.done} of {week.tasks.length} activities complete · {percent}%
      </p>
    </section>
  );
}

function ActivityBrowser({
  completedTasks,
  summaries,
  current,
  implementedLessonIds,
  startLesson,
  toggleTask,
}: {
  completedTasks: string[];
  summaries: WeekSummary[];
  current: number;
  implementedLessonIds: Set<string>;
  startLesson: (taskId: string) => void;
  toggleTask: (id: string) => Promise<void>;
}) {
  const firstOpen = useMemo(
    () => starterTasks.find((task) => !completedTasks.includes(task.id)) ?? starterTasks[0],
    // The default selection is the next activity when Today opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(firstOpen?.id ?? null);
  // Mastered weeks start folded (except the current one); the learner can open them.
  const [toggled, setToggled] = useState<Set<number>>(new Set());

  const selected = starterTasks.find((task) => task.id === selectedId) ?? null;
  const totalMinutes = starterTasks.reduce((sum, task) => sum + task.minutes, 0);

  const isOpen = (week: WeekSummary) => {
    const folded = week.mastered && week.week !== current;
    return toggled.has(week.week) ? folded : !folded;
  };

  const toggle = (week: number) =>
    setToggled((currentSet) => {
      const next = new Set(currentSet);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-label="Activities" className="min-w-0">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold tracking-tight">Activities</h2>
          <span className="tabular text-sm text-neutral-400">{totalMinutes} minutes</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
          {summaries.map((week, weekIndex) => {
            const open = isOpen(week);

            return (
              <Fragment key={week.week}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => toggle(week.week)}
                  className={[
                    "flex w-full items-center gap-3 bg-neutral-50 px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-neutral-400 transition-colors hover:text-neutral-600",
                    weekIndex > 0 ? "border-t border-black/5" : "",
                    open ? "border-b border-black/5" : "",
                  ].join(" ")}
                >
                  <span>Week {week.week}</span>
                  <span className="truncate normal-case tracking-normal text-neutral-400">
                    {week.title}
                  </span>
                  <span className="tabular ml-auto shrink-0 normal-case tracking-normal">
                    {week.mastered ? "Mastered · " : ""}
                    {week.done}/{week.tasks.length}
                  </span>
                  <ChevronDown
                    size={15}
                    className={["shrink-0 transition-transform", open ? "" : "-rotate-90"].join(" ")}
                  />
                </button>

                {open
                  ? week.tasks.map((task, index) => (
                      <ActivityRow
                        key={task.id}
                        task={task}
                        complete={completedTasks.includes(task.id)}
                        selected={selected?.id === task.id}
                        last={index === week.tasks.length - 1}
                        onSelect={() => setSelectedId(task.id)}
                      />
                    ))
                  : null}
              </Fragment>
            );
          })}
        </div>
      </section>

      <aside aria-label="Selected activity">
        {selected ? (
          <SelectedActivity
            task={selected}
            complete={completedTasks.includes(selected.id)}
            implemented={implementedLessonIds.has(selected.id)}
            startLesson={startLesson}
            toggleTask={toggleTask}
          />
        ) : null}
      </aside>
    </div>
  );
}

function ActivityRow({
  task,
  complete,
  selected,
  last,
  onSelect,
}: {
  task: LessonTask;
  complete: boolean;
  selected: boolean;
  last: boolean;
  onSelect: () => void;
}) {
  const Icon = iconForType[task.type];

  return (
    <button
      type="button"
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors",
        last ? "" : "border-b border-black/5",
        selected ? "bg-neutral-50" : "hover:bg-neutral-50/70",
      ].join(" ")}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <span
          className={["font-medium", complete ? "text-neutral-400 line-through" : ""].join(" ")}
        >
          {task.title}
        </span>
        <p className="mt-1 truncate text-sm text-neutral-400">{task.description}</p>
      </div>

      <span className="tabular hidden shrink-0 text-sm text-neutral-400 sm:inline">
        {task.minutes} min
      </span>

      {complete ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
          <Check size={15} />
          <span className="sr-only">Complete</span>
        </div>
      ) : (
        <ChevronRight size={18} className="shrink-0 text-neutral-300" />
      )}
    </button>
  );
}

function SelectedActivity({
  task,
  complete,
  implemented,
  startLesson,
  toggleTask,
}: {
  task: LessonTask;
  complete: boolean;
  implemented: boolean;
  startLesson: (taskId: string) => void;
  toggleTask: (id: string) => Promise<void>;
}) {
  return (
    <div key={task.id} className="dl-enter rounded-2xl border border-black/5 bg-white p-6 lg:sticky lg:top-8">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
        Selected activity · Week {taskWeek(task)}
      </p>

      <h2 className="mt-3 text-xl font-semibold tracking-tight">{task.title}</h2>

      <p className="mt-2 text-sm leading-6 text-neutral-500">{task.description}</p>

      <div className="mt-6 flex items-center gap-2 text-sm text-neutral-400">
        <Clock3 size={15} />
        Around {task.minutes} minutes
        {complete ? <span className="ml-auto text-neutral-500">Completed</span> : null}
      </div>

      {implemented ? (
        <button
          type="button"
          onClick={() => startLesson(task.id)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          {complete ? "Review lesson" : "Start lesson"}
          <ChevronRight size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void toggleTask(task.id)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          {complete ? (
            <>
              <Circle size={16} />
              Mark incomplete
            </>
          ) : (
            <>
              <Check size={16} />
              Mark complete
            </>
          )}
        </button>
      )}
    </div>
  );
}
