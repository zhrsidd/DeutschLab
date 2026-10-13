import type { CelebrationData } from "../components/celebrate/Celebration";
import { starterTasks, taskWeek } from "../data/unit1";

import { allWeeksMastered, weekSummaries } from "./progress";

/*
 * Which completion moment a newly saved task earns (DESIGN.md §13). Pure:
 * App calls it only after markTaskComplete has succeeded, and only when the
 * task was not complete before, so nothing is celebrated twice.
 */
export function celebrationFor(taskId: string, completedBefore: string[]): CelebrationData {
  const completedAfter = [...completedBefore, taskId];
  const before = weekSummaries(starterTasks, completedBefore);
  const after = weekSummaries(starterTasks, completedAfter);

  if (allWeeksMastered(after) && !allWeeksMastered(before)) {
    return { kind: "unit", weeks: after.length, activities: completedAfter.filter((id) => starterTasks.some((task) => task.id === id)).length };
  }

  const newlyMastered = after.find(
    (summary) => summary.mastered && !before.find((entry) => entry.week === summary.week)?.mastered,
  );

  if (newlyMastered) {
    const next = after.find((summary) => !summary.mastered);
    return {
      kind: "week",
      week: newlyMastered.week,
      title: newlyMastered.title,
      activities: newlyMastered.tasks.length,
      nextWeek: next?.week ?? null,
    };
  }

  const task = starterTasks.find((entry) => entry.id === taskId);
  const week = task ? taskWeek(task) : 1;
  const summaryBefore = before.find((entry) => entry.week === week);
  const summaryAfter = after.find((entry) => entry.week === week);

  return {
    kind: "lesson",
    title: task?.title ?? "Lesson",
    week,
    before: summaryBefore?.done ?? 0,
    after: summaryAfter?.done ?? 0,
    total: summaryAfter?.tasks.length ?? 0,
    seed: completedAfter.length,
  };
}
