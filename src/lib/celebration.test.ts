import { describe, expect, it } from "vitest";

import { starterTasks, taskWeek } from "../data/unit1";

import { celebrationFor } from "./celebration";

const idsOfWeek = (week: number) => starterTasks.filter((task) => taskWeek(task) === week).map((task) => task.id);
const lessonsOfWeek = (week: number) => idsOfWeek(week).filter((id) => !id.startsWith("checkpoint-"));

describe("celebrationFor", () => {
  it("gives an ordinary lesson the lesson moment with real before/after counts", () => {
    const [first, second] = lessonsOfWeek(1);
    const result = celebrationFor(second, [first]);

    expect(result.kind).toBe("lesson");
    if (result.kind !== "lesson") return;
    expect(result.week).toBe(1);
    expect(result.before).toBe(1);
    expect(result.after).toBe(2);
    expect(result.total).toBe(idsOfWeek(1).length);
  });

  it("marks a week as mastered only when its checkpoint completes mastery", () => {
    const result = celebrationFor("checkpoint-001", lessonsOfWeek(1));

    expect(result).toMatchObject({ kind: "week", week: 1, activities: idsOfWeek(1).length, nextWeek: 2 });
  });

  it("does not claim mastery for the last lesson of a week whose checkpoint is not done", () => {
    const lessons = lessonsOfWeek(1);
    const result = celebrationFor(lessons[lessons.length - 1], lessons.slice(0, -1));

    expect(result.kind).toBe("lesson");
  });

  it("gives the final mastery of October the unit moment", () => {
    const allButLast = starterTasks.map((task) => task.id).filter((id) => id !== "checkpoint-004");
    const result = celebrationFor("checkpoint-004", allButLast);

    expect(result).toMatchObject({ kind: "unit", weeks: 4, activities: starterTasks.length });
  });
});
