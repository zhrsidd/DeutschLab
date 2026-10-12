import { describe, expect, it } from "vitest";

import {
  MAX_INTERVAL_DAYS,
  REPETITIONS_TO_RESOLVE,
  endOfToday,
  initialSchedule,
  scheduleNext,
} from "./reviewScheduler";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-12T10:00:00.000Z");

describe("reviewScheduler", () => {
  it("schedules a new item for tomorrow", () => {
    const start = initialSchedule(NOW);

    expect(start.intervalDays).toBe(1);
    expect(start.repetitions).toBe(0);
    expect(new Date(start.dueAt).getTime()).toBe(NOW.getTime() + DAY);
  });

  it("wrong answer → due in 1 day and progress resets", () => {
    const next = scheduleNext(
      { intervalDays: 14, ease: 2.5, repetitions: 3 },
      false,
      NOW,
    );

    expect(next.intervalDays).toBe(1);
    expect(next.repetitions).toBe(0);
    expect(new Date(next.dueAt).getTime()).toBe(NOW.getTime() + DAY);
  });

  it("correct answers climb 3 → 7 → 14 → 30 → 60", () => {
    let state = initialSchedule(NOW);
    const seen: number[] = [];

    for (let i = 0; i < 5; i += 1) {
      state = scheduleNext(state, true, NOW);
      seen.push(state.intervalDays);
    }

    expect(seen).toEqual([3, 7, 14, 30, 60]);
  });

  it("never exceeds the 60-day cap", () => {
    let state = initialSchedule(NOW);

    for (let i = 0; i < 12; i += 1) {
      state = scheduleNext(state, true, NOW);
      expect(state.intervalDays).toBeLessThanOrEqual(MAX_INTERVAL_DAYS);
    }

    expect(state.intervalDays).toBe(60);
  });

  it("due date matches the interval", () => {
    const next = scheduleNext(initialSchedule(NOW), true, NOW);

    expect(new Date(next.dueAt).getTime()).toBe(NOW.getTime() + 3 * DAY);
  });

  it("ease stays within its bounds", () => {
    let state = initialSchedule(NOW);

    for (let i = 0; i < 20; i += 1) state = scheduleNext(state, false, NOW);
    expect(state.ease).toBeGreaterThanOrEqual(1.3);

    for (let i = 0; i < 80; i += 1) state = scheduleNext(state, true, NOW);
    expect(state.ease).toBeLessThanOrEqual(3);
  });

  it("endOfToday is the last moment of the local day", () => {
    const end = new Date(endOfToday(new Date(2026, 9, 12, 8, 30)));

    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getDate()).toBe(12);
  });

  it("two correct reviews in a row resolve a mistake", () => {
    expect(REPETITIONS_TO_RESOLVE).toBe(2);
  });
});
