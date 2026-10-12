import { describe, expect, it } from "vitest";

import { starterTasks } from "../data/unit1";

import {
  MAX_REVIEWS_PER_DAY,
  generateDailyPlan,
  resolveReviewLimit,
  type PlannerInput,
  type PlannerMistake,
} from "./dailyPlanner";

const ids = starterTasks.map((task) => task.id);
const instructional = ids.filter((id) => id !== "checkpoint-001");

const base: PlannerInput = {
  tasks: starterTasks,
  completedTaskIds: [],
  dueReviewCount: 0,
  dueReviewKeys: [],
  unresolvedMistakes: [],
  budgetMinutes: 30,
};

const mistake: PlannerMistake = {
  id: 1,
  lessonId: "grammar-001",
  itemKey: "grammar:f-ich",
  prompt: "Complete: Ich ___ Schüler.",
  timesMissed: 2,
};

const kinds = (input: Partial<PlannerInput>) =>
  generateDailyPlan({ ...base, ...input }).items.map((item) => item.kind);

describe("generateDailyPlan priority", () => {
  it("puts due reviews first, then lessons", () => {
    const plan = generateDailyPlan({ ...base, dueReviewCount: 5 });

    expect(plan.items[0].kind).toBe("review");
    expect(plan.items[1].kind).toBe("lesson");
  });

  it("puts a weak area after reviews and before the next lesson", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: ["vocab-001", "pronunciation-001", "grammar-001"],
      dueReviewCount: 3,
      unresolvedMistakes: [mistake],
    });

    expect(plan.items.map((item) => item.kind)).toEqual([
      "review",
      "mistake",
      "lesson",
    ]);
  });

  it("offers the next unfinished lesson in curriculum order", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: ["vocab-001", "pronunciation-001"],
    });

    expect(plan.items[0].sourceId).toBe("grammar-001");
  });

  it("skips a weak area that already has a due review", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: ids,
      dueReviewCount: 1,
      dueReviewKeys: ["grammar:f-ich"],
      unresolvedMistakes: [mistake],
    });

    expect(plan.items.map((item) => item.kind)).toEqual(["review"]);
  });

  it("does not suggest a weak area whose lesson is unfinished", () => {
    const plan = generateDailyPlan({
      ...base,
      unresolvedMistakes: [mistake],
    });

    expect(plan.items.some((item) => item.kind === "mistake")).toBe(false);
  });

  it("suggests at most one weak area, the most-missed", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: ids,
      unresolvedMistakes: [
        mistake,
        { ...mistake, id: 2, itemKey: "grammar:f-du", timesMissed: 5 },
      ],
    });

    const weak = plan.items.filter((item) => item.kind === "mistake");

    expect(weak).toHaveLength(1);
    expect(weak[0].mistakeId).toBe(2);
  });

  it("respects dismissed weak areas", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: ids,
      unresolvedMistakes: [mistake],
      dismissedMistakeIds: [1],
    });

    expect(plan.done).toBe(true);
  });
});

describe("time budgets", () => {
  it.each([15, 30, 45, 60])("%i minutes yields a non-empty plan", (budget) => {
    const plan = generateDailyPlan({ ...base, budgetMinutes: budget });

    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.budgetMinutes).toBe(budget);
  });

  it("fits a lesson into 15 minutes, and two lessons into 30", () => {
    expect(
      generateDailyPlan({ ...base, budgetMinutes: 15 }).items,
    ).toHaveLength(1);
    expect(
      generateDailyPlan({ ...base, budgetMinutes: 30 }).items,
    ).toHaveLength(2);
  });

  it("never plans more than two new lessons", () => {
    const plan = generateDailyPlan({ ...base, budgetMinutes: 60 });

    expect(plan.items.filter((item) => item.kind === "lesson")).toHaveLength(2);
  });

  it("caps the review block, keeps the count, and tracks the budget share", () => {
    const short = generateDailyPlan({
      ...base,
      budgetMinutes: 15,
      dueReviewCount: 45,
    });
    const long = generateDailyPlan({
      ...base,
      budgetMinutes: 30,
      dueReviewCount: 45,
    });

    expect(short.dueReviewCount).toBe(45);
    expect(short.items[0].reviewLimit).toBe(15);
    expect(long.items[0].reviewLimit).toBe(MAX_REVIEWS_PER_DAY);
    expect(short.items[0].minutes).toBeLessThanOrEqual(15);
  });

  it("plans only as many reviews as are due", () => {
    const plan = generateDailyPlan({ ...base, dueReviewCount: 3 });

    expect(plan.items[0].reviewLimit).toBe(3);
  });

  it("represents many reviews as one block", () => {
    const plan = generateDailyPlan({ ...base, dueReviewCount: 40 });

    expect(plan.items.filter((item) => item.kind === "review")).toHaveLength(1);
  });
});

describe("resolveReviewLimit", () => {
  it("uses the planned count from Today", () => {
    expect(resolveReviewLimit(15)).toBe(15);
  });

  it("falls back to 20 when opened from the sidebar", () => {
    expect(resolveReviewLimit(null)).toBe(20);
    expect(resolveReviewLimit(undefined)).toBe(20);
    expect(resolveReviewLimit(0)).toBe(20);
  });

  it("never exceeds the daily maximum", () => {
    expect(resolveReviewLimit(99)).toBe(20);
  });
});

describe("completion states", () => {
  it("is done when everything is complete and nothing is due", () => {
    const plan = generateDailyPlan({ ...base, completedTaskIds: ids });

    expect(plan.done).toBe(true);
    expect(plan.items).toEqual([]);
  });

  it("is not done while reviews are due", () => {
    expect(
      generateDailyPlan({ ...base, completedTaskIds: ids, dueReviewCount: 2 })
        .done,
    ).toBe(false);
  });
});

describe("checkpoint scheduling", () => {
  it("is withheld until every instructional lesson is complete", () => {
    expect(
      kinds({ completedTaskIds: instructional.slice(0, -1), budgetMinutes: 60 }),
    ).not.toContain("checkpoint");

    const early = generateDailyPlan({
      ...base,
      completedTaskIds: instructional.slice(0, -1),
      budgetMinutes: 60,
    });

    expect(early.items.some((item) => item.sourceId === "checkpoint-001")).toBe(
      false,
    );
  });

  it("is the next item once all instructional lessons are done", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: instructional,
      budgetMinutes: 45,
    });

    expect(plan.items.map((item) => item.sourceId)).toEqual(["checkpoint-001"]);
  });

  it("after a failed attempt, due reviews come first and it is deferred", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: instructional,
      attemptedCheckpointIds: ["checkpoint-001"],
      dueReviewCount: 5,
      budgetMinutes: 45,
    });

    expect(plan.items.map((item) => item.kind)).toEqual(["review"]);
  });

  it("is offered again after a failure when nothing else is pending", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: instructional,
      attemptedCheckpointIds: ["checkpoint-001"],
      budgetMinutes: 45,
    });

    expect(plan.items.map((item) => item.sourceId)).toEqual(["checkpoint-001"]);
  });
});
