import { describe, expect, it } from "vitest";

import {
  activeDays,
  dailyActivity,
  lessonScoreRows,
  localDate,
  niceMax,
  reviewAccuracy,
  reviewStages,
  weeklyAccuracy,
  windowStart,
} from "./progressStats";

const NOW = new Date(2026, 9, 13, 18, 0, 0); // Tue 13 Oct 2026, local time
const at = (daysAgo: number, hour = 10) => {
  const date = new Date(NOW);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

describe("daily activity", () => {
  it("returns one local day per slot, ending today, with counts by kind", () => {
    const days = dailyActivity(
      [
        { kind: "lesson", at: at(0) },
        { kind: "review", at: at(0, 23) },
        { kind: "checkpoint", at: at(2) },
        { kind: "review", at: at(9) }, // outside the 7-day window
      ],
      7,
      NOW,
    );

    expect(days).toHaveLength(7);
    expect(days[6]).toMatchObject({ date: "2026-10-13", label: "Tu", lessons: 1, reviews: 1, total: 2, isToday: true });
    expect(days[4]).toMatchObject({ date: "2026-10-11", checkpoints: 1, total: 1 });
    expect(days.reduce((sum, day) => sum + day.total, 0)).toBe(3);
    expect(activeDays(days)).toBe(2);
  });

  it("is all zeros, not invented, without events", () => {
    expect(dailyActivity([], 7, NOW).every((day) => day.total === 0)).toBe(true);
  });

  it("starts the window at local midnight", () => {
    expect(localDate(windowStart(7, NOW))).toBe("2026-10-07");
    expect(windowStart(7, NOW).getHours()).toBe(0);
  });
});

describe("scales and accuracy", () => {
  it("rounds axis maxima up to 1/2/5 steps", () => {
    expect([0, 1, 3, 7, 12, 48, 51].map(niceMax)).toEqual([1, 1, 5, 10, 20, 50, 100]);
  });

  it("computes review accuracy only from recorded answers", () => {
    expect(reviewAccuracy([])).toEqual({ correct: 0, total: 0, rate: null });
    expect(reviewAccuracy([{ correct: true, at: at(0) }, { correct: false, at: at(1) }]).rate).toBe(0.5);
  });

  it("groups answers into weeks ending today", () => {
    const weeks = weeklyAccuracy(
      [{ correct: true, at: at(0) }, { correct: true, at: at(8) }, { correct: false, at: at(8) }],
      4,
      NOW,
    );
    expect(weeks.map((week) => week.accuracy.total)).toEqual([0, 0, 2, 1]);
    expect(weeks[3].label).toBe("This week");
  });
});

describe("lesson scores and review stages", () => {
  it("lists lessons in curriculum order with latest and best, excluding checkpoints", () => {
    const rows = lessonScoreRows([
      { taskId: "grammar-009", latestScore: 13, latestTotal: 16, bestFraction: 15 / 16, attempts: 2 },
      { taskId: "vocab-001", latestScore: 16, latestTotal: 20, bestFraction: 0.8, attempts: 1 },
      { taskId: "checkpoint-004", latestScore: 1, latestTotal: 1, bestFraction: 1, attempts: 1 },
    ]);

    expect(rows.map((row) => row.taskId)).toEqual(["vocab-001", "grammar-009"]);
    expect(rows[1]).toMatchObject({ week: 4, latest: 13 / 16, best: 15 / 16, attempts: 2 });
  });

  it("always reports five review stages", () => {
    const stages = reviewStages([{ repetitions: 0, count: 3 }, { repetitions: 4, count: 1 }]);
    expect(stages.map((stage) => stage.count)).toEqual([3, 0, 0, 0, 1]);
  });
});
