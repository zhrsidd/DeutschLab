/*
 * Week-level progress for the dashboard. Pure: derived from the task list
 * and completed ids only. Mastery uses the same helpers as the planner.
 */

import { taskWeek, unit1Curriculum, type LessonTask } from "../data/unit1";

import {
  isWeek1Mastered,
  isWeek2Mastered,
  isWeek3Mastered,
  isWeek4Mastered,
} from "./checkpointScoring";

const MASTERY: Record<number, (completed: string[]) => boolean> = {
  1: isWeek1Mastered,
  2: isWeek2Mastered,
  3: isWeek3Mastered,
  4: isWeek4Mastered,
};

export interface WeekSummary {
  week: number;
  title: string;
  tasks: LessonTask[];
  done: number;
  mastered: boolean;
}

/** One summary per implemented week, in order. */
export function weekSummaries(tasks: LessonTask[], completed: string[]): WeekSummary[] {
  const weeks = [...new Set(tasks.map(taskWeek))].sort((a, b) => a - b);
  const titles = new Map(
    unit1Curriculum.flatMap((month) => month.weeks).map((week) => [week.week, week.title]),
  );

  return weeks.map((week) => {
    const weekTasks = tasks.filter((task) => taskWeek(task) === week);
    return {
      week,
      title: titles.get(week) ?? `Week ${week}`,
      tasks: weekTasks,
      done: weekTasks.filter((task) => completed.includes(task.id)).length,
      mastered: MASTERY[week]?.(completed) ?? false,
    };
  });
}

/** The first implemented week that is not mastered yet (the last one when all are). */
export function currentWeek(summaries: WeekSummary[]): number {
  return (summaries.find((summary) => !summary.mastered) ?? summaries[summaries.length - 1])?.week ?? 1;
}

/** True once every implemented week is mastered (October Foundations, in v1.0). */
export function allWeeksMastered(summaries: WeekSummary[]): boolean {
  return summaries.length > 0 && summaries.every((summary) => summary.mastered);
}
