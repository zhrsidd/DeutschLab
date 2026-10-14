import { ArrowRight, Check } from "lucide-react";

import { starterTasks, type LessonType } from "../../data/unit1";
import type { DailyPlan, PlanItem } from "../../lib/dailyPlanner";
import { allWeeksMastered, currentWeek, type WeekSummary } from "../../lib/progress";
import { activeDays, type DayActivity } from "../../lib/progressStats";
import { formatReviewDate } from "../ReviewView";
import { BarChart, ChartFigure, SegmentMeter } from "../charts/Charts";
import Atmosphere from "../shell/Atmosphere";

const TYPE_LABEL: Record<LessonType, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  pronunciation: "Pronunciation",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
  reading: "Reading",
  review: "Checkpoint",
};

/** One phrase per week, quoted from that week's lessons. */
const WEEK_PHRASE: Record<number, { german: string; english: string; focus: string }> = {
  1: { german: "Ich heiße Anna.", english: "My name is Anna.", focus: "sounds, introductions and sein" },
  2: { german: "Ich habe zwei Brüder.", english: "I have two brothers.", focus: "haben, everyday verbs and family" },
  3: { german: "Das ist kein Buch.", english: "That is not a book.", focus: "articles, plurals, the accusative and kein" },
  4: { german: "Ich sehe ihn.", english: "I see him.", focus: "everyday words, accusative pronouns and irregular verbs" },
};

function greeting(now: Date) {
  const hour = now.getHours();
  if (hour < 11) return "Guten Morgen.";
  if (hour < 18) return "Guten Tag.";
  return "Guten Abend.";
}

const germanDate = (now: Date) =>
  new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" }).format(now);

const kicker = "text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3";

interface HomeViewProps {
  completedTasks: string[];
  summaries: WeekSummary[];
  plan: DailyPlan;
  nextReviewAt: string | null;
  days: DayActivity[];
  activityLoaded: boolean;
  startPlanItem: (item: PlanItem) => void;
  openReview: () => void;
  openSettings: () => void;
  now?: Date;
}

/*
 * Home is the cinematic screen (DESIGN.md §6): atmospheric light, a kinetic
 * German greeting and the week as a large numeral, then one dominant
 * action. Everything shown is derived from saved progress.
 */
export default function HomeView({
  completedTasks,
  summaries,
  plan,
  nextReviewAt,
  days,
  activityLoaded,
  startPlanItem,
  openReview,
  openSettings,
  now = new Date(),
}: HomeViewProps) {
  const week = currentWeek(summaries);
  const complete = allWeeksMastered(summaries);
  const summary = summaries.find((entry) => entry.week === week);
  const phrase = WEEK_PHRASE[week];
  const [next, ...rest] = plan.items;
  const words = greeting(now).split(" ");
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const firstOpen = summary?.tasks.find((task) => !completedTasks.includes(task.id));
  const weekSegments = (summary?.tasks ?? []).map((task) => ({
    key: task.id,
    label: task.title,
    state: completedTasks.includes(task.id)
      ? ("done" as const)
      : task.id === firstOpen?.id
        ? ("next" as const)
        : ("todo" as const),
  }));

  return (
    <>
      {/* Cinematic opening: light, date, kinetic greeting, the week's phrase and numeral. */}
      <div className="relative isolate overflow-hidden border-b border-line">
        <Atmosphere />

        <header className="relative mx-auto grid max-w-page gap-8 px-5 pt-10 pb-10 md:px-10 md:pt-14 md:pb-12 lg:grid-cols-12 lg:items-end">
          <div className="min-w-0 lg:col-span-8">
            <p className={kicker}>
              <span lang="de">{germanDate(now)}</span> · Unit 1 · {complete ? "October complete" : `Week ${week}`}
            </p>

            <h1
              className="mt-5 text-display-lg font-semibold md:text-display-xl"
              aria-label={greeting(now)}
            >
              {words.map((word, index) => (
                <span key={word} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <span className="dl-word" style={{ ["--i" as string]: index }}>
                    {word}
                  </span>
                  {index < words.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>

            {complete ? (
              <div className="dl-enter mt-6 max-w-2xl [animation-delay:240ms]">
                <p className="font-serif text-3xl italic text-fg md:text-4xl">October Foundations complete.</p>
                <p className="mt-3 text-fg-2">
                  You have mastered Weeks 1–4 in DeutschLab: the app's own milestone, not a CEFR certificate.
                  November is not built yet, so keep your reviews going.
                </p>
              </div>
            ) : phrase ? (
              <div className="dl-enter mt-6 max-w-2xl [animation-delay:240ms]">
                <p lang="de" className="font-serif text-3xl leading-tight italic text-fg md:text-4xl">
                  „{phrase.german}“
                </p>
                <p className="mt-3 text-fg-2">
                  <span className="text-fg-3">{phrase.english}</span>
                  <span aria-hidden="true" className="mx-2 text-fg-3">·</span>
                  This week: {phrase.focus}.
                </p>
              </div>
            ) : null}
          </div>

          {/* The week as an editorial numeral: fills the upper right with real position. */}
          <div aria-hidden="true" className="hidden min-w-0 lg:col-span-4 lg:block lg:text-right">
            <p className={kicker}>{complete ? "Unit 1" : "Woche"}</p>
            <p className="tabular -mr-2 font-display text-[9.5rem] leading-[0.8] font-extralight tracking-[-0.06em] text-fg">
              {complete ? "✓" : String(week).padStart(2, "0")}
            </p>
            {summary ? (
              <p className="tabular mt-3 text-sm text-fg-2">
                {summary.done} of {summary.tasks.length} activities
              </p>
            ) : null}
          </div>
        </header>
      </div>

      <div className="mx-auto grid max-w-page gap-10 px-5 py-8 md:px-10 md:py-10 lg:grid-cols-12 lg:gap-12">
        {/* 7 columns: the next action and the rest of today's plan. */}
        <section aria-label="Today's plan" className="min-w-0 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={kicker}>Today's plan</h2>
            <span className="tabular text-sm text-fg-2">
              {plan.totalMinutes} min planned of {plan.budgetMinutes} · {plan.dueReviewCount}{" "}
              {plan.dueReviewCount === 1 ? "review" : "reviews"} due
            </span>
          </div>

          {plan.done || !next ? (
            <div className="nc-luminous rounded-lg p-6 md:p-7">
              <p className="flex items-center gap-3 font-display text-display-sm font-semibold tracking-tight">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-on-accent">
                  <Check size={18} strokeWidth={2.5} className="dl-check" aria-hidden="true" />
                </span>
                You're done for today.
              </p>
              <p className="mt-3 text-sm leading-6 text-fg-2">
                {nextReviewAt ? `Next review: ${formatReviewDate(nextReviewAt)}.` : "No reviews are scheduled yet."}{" "}
                {complete
                  ? "There are no new lessons after October yet."
                  : "Consistency matters more than grinding extra lessons."}
              </p>
            </div>
          ) : (
            <ol>
              <li>
                <NextActivity item={next} onStart={() => startPlanItem(next)} />
              </li>
              {rest.map((item, index) => (
                <li key={item.id} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => startPlanItem(item)}
                    className="dl-press group grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-baseline gap-3 py-4 text-left"
                  >
                    <span className="tabular text-sm text-fg-3 group-hover:text-highlight">
                      {String(index + 2).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium group-hover:text-highlight">{item.title}</span>
                      <span className="mt-0.5 block truncate text-sm text-fg-2">
                        {item.reason} · {item.description}
                      </span>
                    </span>
                    <span className="tabular text-sm text-fg-2">{item.minutes} min</span>
                  </button>
                </li>
              ))}
            </ol>
          )}

          <p className="mt-4 text-sm text-fg-2">
            Daily budget: {plan.budgetMinutes} minutes. Times are estimates; DeutschLab doesn't time your study.{" "}
            <button
              type="button"
              onClick={openSettings}
              className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent"
            >
              Change study time
            </button>
          </p>
        </section>

        {/* 5 columns: reviews due, this week, last seven days. */}
        <div className="min-w-0 space-y-9 lg:col-span-5">
          <section aria-label="Reviews due" className="flex items-end justify-between gap-4 border-t border-line pt-4">
            <div className="min-w-0">
              <h2 className={kicker}>Reviews due</h2>
              {plan.dueReviewCount > 0 ? (
                <p className="tabular mt-2 font-display text-stat font-semibold">{plan.dueReviewCount}</p>
              ) : nextReviewAt ? (
                <p lang="de" className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  Alles erledigt.
                </p>
              ) : (
                <p lang="de" className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  Noch nichts geplant.
                </p>
              )}
              <p className="mt-1 text-sm text-fg-2">
                {plan.dueReviewCount > 0
                  ? "Spaced recall of words and patterns you learned or missed."
                  : nextReviewAt
                    ? `All due reviews are done. Next: ${formatReviewDate(nextReviewAt)}`
                    : "No reviews scheduled yet. Items enter Review when you finish lessons or miss an answer."}
              </p>
            </div>
            <button
              type="button"
              onClick={openReview}
              className="dl-press shrink-0 rounded-md border border-line-strong bg-elevated px-3.5 py-2 text-sm font-medium hover:border-accent"
            >
              Open Review
            </button>
          </section>

          {summary ? (
            <section aria-label="This week" className="border-t border-line pt-4">
              <ChartFigure
                title={complete ? "Week 4 · complete" : `This week · Week ${week}`}
                description={`${summary.title}: ${summary.done} of ${summary.tasks.length} activities complete.`}
                table={{
                  columns: ["Activity", "Status"],
                  rows: weekSegments.map((segment) => [
                    segment.label,
                    segment.state === "done" ? "complete" : segment.state === "next" ? "next" : "to do",
                  ]),
                }}
              >
                <SegmentMeter segments={weekSegments} />
              </ChartFigure>
            </section>
          ) : null}

          <section aria-label="Last seven days" className="border-t border-line pt-4">
            <ChartFigure
              title="Last seven days"
              description="Lessons, checkpoints and review answers you recorded each day. This counts activity, not time."
              aside={<span className="tabular text-sm text-fg-2">{activeDays(days)} of 7 days active</span>}
              empty={activityLoaded && total === 0}
              emptyText="Nothing recorded in the last seven days. Finish a lesson or a review and that day fills in."
              emptyHint={
                <ol aria-hidden="true" className="mt-4 flex gap-1.5">
                  {days.map((day) => (
                    <li key={day.date} className="flex-1 text-center text-[11px] text-fg-3">
                      <span className={["mx-auto mb-2 block h-1.5 w-1.5 rounded-full", day.isToday ? "bg-highlight" : "ring-1 ring-line-strong"].join(" ")} />
                      {day.label}
                    </li>
                  ))}
                </ol>
              }
              table={{
                columns: ["Day", "Lessons", "Checkpoints", "Review answers"],
                rows: days.map((day) => [day.date, day.lessons, day.checkpoints, day.reviews]),
              }}
            >
              <BarChart
                unit="activities"
                height={80}
                bars={days.map((day) => ({
                  key: day.date,
                  label: day.label,
                  value: day.total,
                  current: day.isToday,
                  detail: `${day.isToday ? "Today" : day.date}: ${day.total} ${day.total === 1 ? "activity" : "activities"}`,
                }))}
              />
            </ChartFigure>
          </section>
        </div>
      </div>
    </>
  );
}

function NextActivity({ item, onStart }: { item: PlanItem; onStart: () => void }) {
  const task = starterTasks.find((entry) => entry.id === item.sourceId);
  const kind =
    item.kind === "review" ? "Review" : item.kind === "mistake" ? "Weak area" : TYPE_LABEL[task?.type ?? "review"];

  return (
    <button
      type="button"
      onClick={onStart}
      className="nc-luminous dl-press group relative mb-2 block w-full overflow-hidden rounded-lg p-6 text-left transition-shadow duration-base hover:shadow-[0_0_48px_-20px_rgb(181_37_50/0.55)] md:p-7"
    >
      <span className="flex flex-wrap items-center gap-x-3 text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3">
        <span className="tabular text-highlight">01</span>
        <span>Next</span>
        <span aria-hidden="true">·</span>
        <span>{kind}</span>
        {task?.week ? <span>Week {task.week}</span> : null}
      </span>

      <span className="mt-3 block font-display text-display-sm font-semibold tracking-tight md:text-[2rem]">
        {item.title}
      </span>
      <span className="mt-2 block max-w-reading text-fg-2">
        {item.reason} · {item.description}
      </span>

      <span className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <span className="tabular text-sm text-fg-2">{item.minutes} min</span>
        <span className="flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition-colors duration-base group-hover:bg-accent-hover">
          Continue learning
          <ArrowRight size={16} className="transition-transform duration-base group-hover:translate-x-0.5" />
        </span>
      </span>
    </button>
  );
}
