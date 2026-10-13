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
// Week 1 lessons, without the checkpoint or any Week 2 task.
const instructional = starterTasks
  .filter((task) => (task.week ?? 1) === 1 && task.id !== "checkpoint-001")
  .map((task) => task.id);
const week1All = [...instructional, "checkpoint-001"];

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
    expect(ids.length).toBeGreaterThan(week1All.length);

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

describe("Week 2 progression", () => {
  const sources = (input: Partial<PlannerInput>) =>
    generateDailyPlan({ ...base, budgetMinutes: 60, ...input }).items.map(
      (item) => item.sourceId,
    );

  it("keeps unfinished Week 1 work first and withholds Week 2 before mastery", () => {
    const early = sources({ completedTaskIds: instructional.slice(0, 3) });

    expect(early[0]).toBe("grammar-002");
    expect(early).not.toContain("vocab-002");
    expect(early).not.toContain("grammar-004");
  });

  it("offers the checkpoint, not Week 2, when only the checkpoint is left", () => {
    expect(sources({ completedTaskIds: instructional })).toEqual([
      "checkpoint-001",
    ]);
  });

  it("makes vocab-002 the next new task after Week 1 mastery", () => {
    const plan = sources({ completedTaskIds: week1All });

    expect(plan[0]).toBe("vocab-002");
  });

  it("makes grammar-004 next after vocab-002", () => {
    expect(
      sources({ completedTaskIds: [...week1All, "vocab-002"] })[0],
    ).toBe("grammar-004");
  });

  it("is done once every task is complete", () => {
    expect(
      generateDailyPlan({ ...base, completedTaskIds: ids }).done,
    ).toBe(true);
  });

  it("still puts due reviews and a Week 1 weak area before Week 2 content", () => {
    const plan = generateDailyPlan({
      ...base,
      budgetMinutes: 60,
      completedTaskIds: week1All,
      dueReviewCount: 4,
      unresolvedMistakes: [mistake],
    });

    expect(plan.items.map((item) => item.kind)).toEqual([
      "review",
      "mistake",
      "lesson",
      "lesson",
    ]);
    expect(plan.items[2].sourceId).toBe("vocab-002");
  });

  it("titles a haben weak area", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: ids,
      unresolvedMistakes: [
        {
          id: 9,
          lessonId: "grammar-004",
          itemKey: "grammar:hb-f-ich",
          prompt: "Complete: Ich ___ Zeit.",
          timesMissed: 1,
        },
      ],
    });

    expect(plan.items[0].title).toBe("Review haben");
  });
});

describe("Week 2 order and checkpoint-002", () => {
  const week2Order = [
    "vocab-002",
    "grammar-004",
    "grammar-005",
    "writing-001",
    "reading-001",
    "listening-002",
    "checkpoint-002",
  ];

  const next = (completed: string[]) =>
    generateDailyPlan({
      ...base,
      budgetMinutes: 15, // one item at a time keeps the order visible
      completedTaskIds: completed,
    }).items[0]?.sourceId;

  it("offers each Week 2 task in order as the previous one is completed", () => {
    for (let i = 0; i < week2Order.length; i += 1) {
      const done = [...week1All, ...week2Order.slice(0, i)];

      expect(next(done), week2Order[i]).toBe(week2Order[i]);
    }
  });

  it("grammar-005 follows grammar-004, writing follows grammar-005, reading follows writing, listening follows reading", () => {
    expect(next([...week1All, "vocab-002", "grammar-004"])).toBe("grammar-005");
    expect(next([...week1All, "vocab-002", "grammar-004", "grammar-005"])).toBe("writing-001");
    expect(next([...week1All, "vocab-002", "grammar-004", "grammar-005", "writing-001"])).toBe("reading-001");
    expect(
      next([...week1All, "vocab-002", "grammar-004", "grammar-005", "writing-001", "reading-001"]),
    ).toBe("listening-002");
  });

  it("offers checkpoint-002 only after all six Week 2 instructional tasks", () => {
    const sixDone = week2Order.slice(0, 6);

    for (let missing = 0; missing < 6; missing += 1) {
      const partial = sixDone.filter((_, i) => i !== missing);
      const plan = generateDailyPlan({
        ...base,
        budgetMinutes: 60,
        completedTaskIds: [...week1All, ...partial],
      });

      expect(plan.items.map((i) => i.sourceId), sixDone[missing]).not.toContain(
        "checkpoint-002",
      );
    }

    expect(next([...week1All, ...sixDone])).toBe("checkpoint-002");
  });

  it("does not let unfinished Week 2 tasks block the Week 1 checkpoint", () => {
    expect(next(instructional)).toBe("checkpoint-001");
  });

  it("keeps Week 1 mastery as the gate for all Week 2 work", () => {
    const plan = generateDailyPlan({
      ...base,
      budgetMinutes: 60,
      completedTaskIds: instructional, // checkpoint-001 not passed
    });

    expect(plan.items.some((item) => week2Order.includes(item.sourceId))).toBe(false);
  });

  it("after a failed checkpoint-002, reviews and weak areas come before a retry", () => {
    const done = [...week1All, ...week2Order.slice(0, 6)];

    const withReviews = generateDailyPlan({
      ...base,
      budgetMinutes: 60,
      completedTaskIds: done,
      attemptedCheckpointIds: ["checkpoint-002"],
      dueReviewCount: 6,
    });

    expect(withReviews.items.map((i) => i.sourceId)).toEqual(["review"]);

    const withWeakArea = generateDailyPlan({
      ...base,
      budgetMinutes: 60,
      completedTaskIds: done,
      attemptedCheckpointIds: ["checkpoint-002"],
      unresolvedMistakes: [
        {
          id: 3,
          lessonId: "grammar-005",
          itemKey: "grammar:cv-f-du-sprechen",
          prompt: "Du ___ Deutsch. (sprechen)",
          timesMissed: 2,
        },
      ],
    });

    expect(withWeakArea.items.map((i) => i.kind)).toEqual(["mistake"]);
    expect(withWeakArea.items[0].title).toBe("Review common verbs");
  });

  it("offers the retry again when nothing else is pending", () => {
    const done = [...week1All, ...week2Order.slice(0, 6)];

    expect(
      generateDailyPlan({
        ...base,
        budgetMinutes: 60,
        completedTaskIds: done,
        attemptedCheckpointIds: ["checkpoint-002"],
      }).items.map((i) => i.sourceId),
    ).toEqual(["checkpoint-002"]);
  });

  it("is done once checkpoint-002 is passed", () => {
    expect(generateDailyPlan({ ...base, completedTaskIds: ids }).done).toBe(true);
  });
});

describe("Week 3 progression", () => {
  const week2Done = [
    ...week1All,
    "vocab-002", "grammar-004", "grammar-005",
    "writing-001", "reading-001", "listening-002", "checkpoint-002",
  ];
  const week3Order = [
    "vocab-003", "grammar-006", "grammar-007", "grammar-008",
    "reading-002", "listening-003", "writing-002", "checkpoint-003",
  ];
  const week3Instructional = week3Order.slice(0, 7);

  const next = (completed: string[], budgetMinutes = 30) =>
    generateDailyPlan({ ...base, budgetMinutes, completedTaskIds: completed }).items.map(
      (item) => item.sourceId,
    );

  it("offers each Week 3 task in order as the previous one is completed", () => {
    for (let i = 0; i < week3Order.length; i += 1) {
      expect(next([...week2Done, ...week3Order.slice(0, i)], 15)[0], week3Order[i]).toBe(
        week3Order[i],
      );
    }
  });

  it("offers checkpoint-003 only after all seven Week 3 instructional tasks", () => {
    for (let missing = 0; missing < 7; missing += 1) {
      const partial = week3Instructional.filter((_, i) => i !== missing);

      expect(next([...week2Done, ...partial], 60), week3Instructional[missing]).not.toContain(
        "checkpoint-003",
      );
    }

    expect(next([...week2Done, ...week3Instructional], 30)).toEqual(["checkpoint-003"]);
  });

  it("moves on to Week 4 once checkpoint-003 is done", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: [...week2Done, ...week3Order],
    });

    expect(plan.done).toBe(false);
    expect(plan.items[0].sourceId).toBe("vocab-004");
    expect(plan.items.every((item) => item.kind === "lesson")).toBe(true);
  });

  it("defers a failed checkpoint-003 behind reviews", () => {
    const plan = generateDailyPlan({
      ...base,
      completedTaskIds: [...week2Done, ...week3Instructional],
      attemptedCheckpointIds: ["checkpoint-003"],
      dueReviewCount: 3,
    });

    expect(plan.items.map((item) => item.kind)).toEqual(["review"]);
  });

  it("withholds Week 3 until checkpoint-002 is passed", () => {
    const beforeCheckpoint = week2Done.filter((id) => id !== "checkpoint-002");
    const planned = next(beforeCheckpoint, 60);

    for (const id of week3Order) expect(planned).not.toContain(id);
    expect(planned[0]).toBe("checkpoint-002");
  });

  it("keeps Week 3 out of Today until Week 1 is mastered too", () => {
    expect(next(instructional, 60)).not.toContain("vocab-003");
  });

  it("puts due reviews and Week 3 weak areas ahead of new Week 3 lessons", () => {
    const plan = generateDailyPlan({
      ...base,
      budgetMinutes: 60,
      completedTaskIds: [...week2Done, ...week3Order],
      dueReviewCount: 4,
      dueReviewKeys: ["vocabulary:tisch#plural"],
      unresolvedMistakes: [
        {
          id: 9,
          lessonId: "vocab-003",
          itemKey: "vocabulary:buch#article",
          prompt: 'What is the article of "Buch"?',
          timesMissed: 2,
        },
      ],
    });

    // Reviews and the weak area come first; new (Week 4) lessons only after.
    const kinds = plan.items.map((item) => item.kind);
    expect(kinds.slice(0, 2)).toEqual(["review", "mistake"]);
    expect(kinds.slice(2).every((kind) => kind === "lesson")).toBe(true);
    expect(plan.items[1].title).toBe("Revisit Week 3 nouns and articles");
  });

  it("leaves the Week 1 and Week 2 order unchanged", () => {
    expect(next(week1All, 15)[0]).toBe("vocab-002");
    expect(next([...week1All, "vocab-002"], 15)[0]).toBe("grammar-004");
  });
});

describe("Week 4 progression", () => {
  const week3Done = starterTasks
    .filter((task) => (task.week ?? 1) <= 3)
    .map((task) => task.id);
  const week4Order = [
    "vocab-004", "grammar-009", "grammar-010", "reading-003",
    "listening-004", "writing-003", "speaking-002", "checkpoint-004",
  ];
  const week4Instructional = week4Order.slice(0, 7);

  const next = (completed: string[], budgetMinutes = 30, extra: Partial<PlannerInput> = {}) =>
    generateDailyPlan({ ...base, budgetMinutes, completedTaskIds: completed, ...extra }).items;

  it("lists Week 4 in curriculum order after checkpoint-003", () => {
    const ids = starterTasks.map((task) => task.id);
    expect(ids.slice(ids.indexOf("checkpoint-003") + 1)).toEqual(week4Order);
  });

  it("withholds Week 4 until checkpoint-003 is passed", () => {
    const beforeCheckpoint = week3Done.filter((id) => id !== "checkpoint-003");
    const planned = next(beforeCheckpoint, 60).map((item) => item.sourceId);

    expect(planned[0]).toBe("checkpoint-003");
    for (const id of week4Order) expect(planned).not.toContain(id);
  });

  it("walks Week 4 in order, one lesson at a time on a short day", () => {
    for (const [index, id] of week4Instructional.entries()) {
      const planned = next([...week3Done, ...week4Instructional.slice(0, index)], 15);
      expect(planned[0].sourceId, id).toBe(id);
    }
  });

  it("offers checkpoint-004 only once every Week 4 lesson is complete", () => {
    const almost = [...week3Done, ...week4Instructional.slice(0, 6)];
    expect(next(almost, 60).map((item) => item.sourceId)).not.toContain("checkpoint-004");
    expect(next([...week3Done, ...week4Instructional], 60)[0].sourceId).toBe("checkpoint-004");
  });

  it("keeps due reviews and weak areas ahead of new Week 4 lessons", () => {
    const items = next([...week3Done, "vocab-004"], 60, {
      dueReviewCount: 5,
      dueReviewKeys: ["grammar:pr-c-mich"],
      unresolvedMistakes: [
        { id: 3, lessonId: "vocab-004", itemKey: "vocabulary:jacke#article", prompt: "p", timesMissed: 2 },
      ],
    });

    expect(items.map((item) => item.kind).slice(0, 2)).toEqual(["review", "mistake"]);
    expect(items[1].title).toBe("Revisit Week 4 vocabulary");
    expect(items[2].sourceId).toBe("grammar-009");
  });

  it("defers a failed checkpoint-004 behind reviews", () => {
    const items = next([...week3Done, ...week4Instructional], 30, {
      attemptedCheckpointIds: ["checkpoint-004"],
      dueReviewCount: 3,
    });
    expect(items.map((item) => item.kind)).toEqual(["review"]);
  });

  it("has no new lessons after checkpoint-004 but still offers due reviews", () => {
    const all = starterTasks.map((task) => task.id);

    expect(generateDailyPlan({ ...base, completedTaskIds: all }).done).toBe(true);

    const withReviews = next(all, 30, { dueReviewCount: 4 });
    expect(withReviews.map((item) => item.kind)).toEqual(["review"]);
    expect(starterTasks.every((task) => (task.week ?? 1) <= 4)).toBe(true);
  });
});
