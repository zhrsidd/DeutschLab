import { starterTasks } from "../../data/unit1";
import { checkpointConfigFor, requiredMarks } from "../../lib/checkpointScoring";
import type { ProgressData } from "../../lib/db";
import type { WeekSummary } from "../../lib/progress";
import {
  activeDays,
  lessonScoreRows,
  reviewAccuracy,
  reviewStages,
  weeklyAccuracy,
  type DayActivity,
} from "../../lib/progressStats";
import { BarChart, ChartFigure, HBarList, ScoreDots } from "../charts/Charts";
import { Stat } from "../lesson/LessonParts";
import { Page, PageHeader, Section } from "../shell/AppShell";
import { SectionLoader } from "../shell/Loaders";

const pct = (value: number) => `${Math.round(value * 100)}%`;
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));

interface ProgressViewProps {
  progress: ProgressData | null;
  days: DayActivity[];
  summaries: WeekSummary[];
}

/*
 * Learning analytics from persisted records only (DESIGN.md §6). Activity
 * counts events, not time; completion is not fluency; no CEFR estimates.
 */
export default function ProgressView({ progress, days, summaries }: ProgressViewProps) {
  if (!progress) {
    return (
      <Page>
        <PageHeader kicker="Progress" title="Your learning, measured" />
        <SectionLoader label="Loading your records…" className="mt-8" />
      </Page>
    );
  }

  const done = summaries.reduce((sum, week) => sum + week.done, 0);
  const total = summaries.reduce((sum, week) => sum + week.tasks.length, 0);
  const accuracy = reviewAccuracy(progress.reviewAnswers);
  const weeks = weeklyAccuracy(progress.reviewAnswers, 4);
  const scores = lessonScoreRows(progress.lessonScores);
  const stages = reviewStages(progress.reviewStages);
  const stageMax = Math.max(1, ...stages.map((stage) => stage.count));
  const totalActivity = days.reduce((sum, day) => sum + day.total, 0);
  const mistakesMax = Math.max(1, ...progress.openMistakesByLesson.map((entry) => entry.count));
  const checkpoints = ["checkpoint-001", "checkpoint-002", "checkpoint-003", "checkpoint-004"]
    .map((id) => ({ id, attempts: progress.checkpointAttempts.filter((attempt) => attempt.checkpointId === id) }))
    .filter((entry) => entry.attempts.length > 0);
  const passedCheckpoints = checkpoints.filter((entry) => entry.attempts.some((attempt) => attempt.passed)).length;

  return (
    <Page>
      <PageHeader kicker="Progress" title="Your learning, measured">
        Only what DeutschLab has recorded. Finishing lessons is progress through the course, not a
        measure of fluency, and none of this is a CEFR level.
      </PageHeader>

      <div aria-label="Summary" role="group" className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
        <Stat label="Activities complete" value={`${done}/${total}`} />
        <Stat label="Active days (28 d)" value={`${activeDays(days)}`} />
        <Stat label="Review recall (28 d)" value={accuracy.rate === null ? "–" : pct(accuracy.rate)} />
        <Stat label="Checkpoints passed" value={`${passedCheckpoints}/4`} />
      </div>

      <Section title="Study activity · last 28 days">
        <ChartFigure
          title="Recorded activity per day"
          description="Lesson attempts, checkpoint attempts and review answers. This counts activity, not minutes studied."
          aside={<span className="tabular text-sm text-fg-2">{totalActivity} in 28 days</span>}
          empty={totalActivity === 0}
          emptyText="No activity in the last 28 days. Finished lessons and review answers appear here."
          table={{
            columns: ["Day", "Lessons", "Checkpoints", "Review answers"],
            rows: days.map((day) => [day.date, day.lessons, day.checkpoints, day.reviews]),
          }}
        >
          <BarChart
            unit="activities"
            height={140}
            bars={days.map((day) => ({
              key: day.date,
              label: day.isToday || day.label === "Mo" ? (day.isToday ? "Today" : shortDate(day.date)) : "",
              value: day.total,
              current: day.isToday,
              detail: `${day.date}: ${day.lessons} lessons, ${day.checkpoints} checkpoints, ${day.reviews} review answers`,
            }))}
          />
        </ChartFigure>
      </Section>

      <div className="grid gap-x-12 lg:grid-cols-2">
        <Section title="Course completion">
          <ChartFigure
            title="Activities complete per week"
            description="Weeks 1–4 of Unit 1. A week is completed when its checkpoint is passed."
            table={{
              columns: ["Week", "Complete", "Activities", "Checkpoint passed"],
              rows: summaries.map((week) => [week.week, week.done, week.tasks.length, week.mastered ? "yes" : "no"]),
            }}
          >
            <HBarList
              rows={summaries.map((week) => ({
                key: String(week.week),
                label: `Week ${week.week}${week.mastered ? " · completed" : ""}`,
                value: week.done,
                max: week.tasks.length,
                display: `${week.done}/${week.tasks.length}`,
                detail: `Week ${week.week}: ${week.done} of ${week.tasks.length} activities complete`,
              }))}
            />
          </ChartFigure>
        </Section>

        <Section title="Checkpoints">
          {checkpoints.length === 0 ? (
            <p className="text-sm leading-6 text-fg-2">
              No checkpoint attempts yet. Each week ends with one; every attempt is kept here.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {checkpoints.map(({ id, attempts }) => {
                const latest = attempts[attempts.length - 1];
                const best = attempts.reduce((top, attempt) => (attempt.total > top.total ? attempt : top));
                const config = checkpointConfigFor(id);
                const task = starterTasks.find((entry) => entry.id === id);

                return (
                  <ChartFigure
                    key={id}
                    title={task?.title ?? id}
                    description={`Latest ${latest.total}/${latest.possible} (${latest.passed ? "passed" : "not passed"}), best ${best.total}/${best.possible}, ${attempts.length} ${attempts.length === 1 ? "attempt" : "attempts"}.`}
                    table={{
                      columns: ["Section", "Latest", "Maximum", "Minimum"],
                      rows: config.rules.map((rule) => [
                        rule.label,
                        latest.sections?.[rule.key] ?? "–",
                        rule.max,
                        requiredMarks(rule),
                      ]),
                    }}
                  >
                    <HBarList
                      rows={config.rules.map((rule) => {
                        const score = latest.sections?.[rule.key] ?? 0;
                        return {
                          key: rule.key,
                          label: rule.label.replace(" self-check", ""),
                          value: score,
                          max: rule.max,
                          display: `${score}/${rule.max}`,
                          muted: score < requiredMarks(rule),
                          detail: `${rule.label}: ${score} of ${rule.max} (minimum ${requiredMarks(rule)})`,
                        };
                      })}
                    />
                  </ChartFigure>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <Section title="Lesson scores">
        <ChartFigure
          title="Latest score per lesson"
          description="The dot is your latest attempt; the tick is your best. Most lessons pass at 80%."
          empty={scores.length === 0}
          emptyText="No lesson attempts yet. Scores appear after you finish a lesson's practice."
          table={{
            columns: ["Lesson", "Week", "Latest", "Best", "Attempts"],
            rows: scores.map((row) => [row.title, row.week, `${row.latestScore}/${row.latestTotal}`, pct(row.best), row.attempts]),
          }}
        >
          <ScoreDots
            rows={scores.map((row) => ({
              key: row.taskId,
              label: row.title,
              group: `Week ${row.week}`,
              latest: row.latest,
              best: row.best,
              detail: `${row.title}: latest ${row.latestScore}/${row.latestTotal}, best ${pct(row.best)}, ${row.attempts} ${row.attempts === 1 ? "attempt" : "attempts"}`,
            }))}
          />
        </ChartFigure>
      </Section>

      <div className="grid gap-x-12 lg:grid-cols-2">
        <Section title="Review">
          <div className="flex flex-col gap-8">
            <ChartFigure
              title="Review recall per week"
              description={
                progress.reviewHistoryStartedAt
                  ? `Share of review answers you got right, recorded since ${shortDate(progress.reviewHistoryStartedAt)}.`
                  : "Share of review answers you got right. Review answers are recorded from this version on."
              }
              empty={accuracy.total === 0}
              emptyText="No review answers recorded yet. Finish a Review session and your recall appears here."
              table={{
                columns: ["Week", "Correct", "Answers"],
                rows: weeks.map((week) => [week.label, week.accuracy.correct, week.accuracy.total]),
              }}
            >
              <BarChart
                unit="percent correct"
                height={100}
                bars={weeks.map((week, index) => ({
                  key: String(index),
                  label: week.label,
                  value: week.accuracy.rate === null ? 0 : Math.round(week.accuracy.rate * 100),
                  current: index === weeks.length - 1,
                  detail:
                    week.accuracy.total === 0
                      ? `${week.label}: no answers`
                      : `${week.label}: ${week.accuracy.correct} of ${week.accuracy.total} correct`,
                }))}
              />
            </ChartFigure>

            <ChartFigure
              title="Review items by recall streak"
              description="How many times in a row each item has been recalled. Intervals grow with the streak."
              empty={stages.every((stage) => stage.count === 0)}
              emptyText="No items in Review yet. Missed answers and new words enter it automatically."
              table={{ columns: ["Stage", "Items"], rows: stages.map((stage) => [stage.label, stage.count]) }}
            >
              <HBarList
                rows={stages.map((stage) => ({
                  key: stage.label,
                  label: stage.label,
                  value: stage.count,
                  max: stageMax,
                  display: String(stage.count),
                  detail: `${stage.label}: ${stage.count} items`,
                }))}
              />
            </ChartFigure>
          </div>
        </Section>

        <Section title="Open mistakes">
          <ChartFigure
            title="Unresolved mistakes by lesson"
            description="A mistake resolves after two correct reviews in a row."
            empty={progress.openMistakesByLesson.length === 0}
            emptyText="No open mistakes. Anything you miss shows up here until Review resolves it."
            table={{
              columns: ["Lesson", "Open mistakes"],
              rows: progress.openMistakesByLesson.map((entry) => [
                starterTasks.find((task) => task.id === entry.lessonId)?.title ?? entry.lessonId,
                entry.count,
              ]),
            }}
          >
            <HBarList
              rows={progress.openMistakesByLesson.map((entry) => {
                const title = starterTasks.find((task) => task.id === entry.lessonId)?.title ?? entry.lessonId;
                return {
                  key: entry.lessonId,
                  label: title,
                  value: entry.count,
                  max: mistakesMax,
                  display: String(entry.count),
                  detail: `${title}: ${entry.count} open`,
                };
              })}
            />
          </ChartFigure>
        </Section>
      </div>
    </Page>
  );
}
