import { describe, expect, it } from "vitest";

import { starterTasks } from "../data/unit1";

import { allWeeksMastered, currentWeek, weekSummaries } from "./progress";

const upTo = (week: number) =>
  starterTasks.filter((task) => (task.week ?? 1) <= week).map((task) => task.id);

describe("week progress", () => {
  it("summarises the four October weeks", () => {
    const summaries = weekSummaries(starterTasks, []);
    expect(summaries.map((s) => [s.week, s.tasks.length])).toEqual([[1, 8], [2, 7], [3, 8], [4, 8]]);
    expect(summaries[3].title).toBe("Accusative & irregular verbs");
  });

  it("follows the learner through the weeks", () => {
    expect(currentWeek(weekSummaries(starterTasks, []))).toBe(1);
    expect(currentWeek(weekSummaries(starterTasks, upTo(1)))).toBe(2);
    expect(currentWeek(weekSummaries(starterTasks, upTo(3)))).toBe(4);
    expect(currentWeek(weekSummaries(starterTasks, upTo(4)))).toBe(4);
  });

  it("counts mastery only through the checkpoint", () => {
    const allButCheckpoint = upTo(4).filter((id) => id !== "checkpoint-004");
    const summaries = weekSummaries(starterTasks, allButCheckpoint);

    expect(summaries[3]).toMatchObject({ done: 7, mastered: false });
    expect(allWeeksMastered(summaries)).toBe(false);
    expect(allWeeksMastered(weekSummaries(starterTasks, upTo(4)))).toBe(true);
  });
});
