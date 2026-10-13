// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetTestDatabase } from "../test/fakeSqlPlugin";

vi.mock("@tauri-apps/plugin-sql", async () => import("../test/fakeSqlPlugin"));

type Db = typeof import("./db");
let db: Db;

beforeEach(async () => {
  vi.resetModules();
  resetTestDatabase();
  db = await import("./db");
  await db.initialiseDatabase();
});

const since = () => new Date(Date.now() - 7 * 86_400_000);

describe("getProgressData", () => {
  it("is empty, not invented, for a new learner", async () => {
    const data = await db.getProgressData(since());
    expect(data).toMatchObject({
      activity: [], lessonScores: [], checkpointAttempts: [], reviewAnswers: [],
      reviewStages: [], openMistakesByLesson: [], reviewHistoryStartedAt: null,
    });
  });

  it("reports real attempts, review answers, stages and open mistakes", async () => {
    await db.saveLessonAttempt("grammar-009", 11, 16);
    await db.saveLessonAttempt("grammar-009", 15, 16);
    await db.saveLessonAttempt("vocab-004", 17, 20);
    await db.recordAnswer({
      sourceType: "grammar", sourceId: "pr-c-mich", category: "grammar",
      prompt: "p", expected: "mich", userAnswer: "ich", correct: false,
    });
    const data = await db.getProgressData(since());

    expect(data.activity.filter((event) => event.kind === "lesson")).toHaveLength(3);
    expect(data.lessonScores).toEqual([
      { taskId: "grammar-009", latestScore: 15, latestTotal: 16, bestFraction: 15 / 16, attempts: 2 },
      { taskId: "vocab-004", latestScore: 17, latestTotal: 20, bestFraction: 17 / 20, attempts: 1 },
    ]);
    expect(data.reviewStages).toEqual([{ repetitions: 0, count: 1 }]);
    expect(data.openMistakesByLesson).toEqual([{ lessonId: "grammar-009", count: 1 }]);
  });

  it("counts review answers from study_events", async () => {
    await db.recordAnswer({
      sourceType: "grammar", sourceId: "pr-c-uns", category: "grammar",
      prompt: "p", expected: "uns", userAnswer: "wir", correct: false,
    });
    const item = {
      id: 1, sourceType: "grammar" as const, sourceId: "pr-c-uns", prompt: "p", answer: "uns",
      audioText: null, dueAt: "", intervalDays: 1, ease: 2.5, repetitions: 0, exerciseJson: null,
    };
    await db.applyReviewResult(item, true);
    await db.applyReviewResult(item, false);

    const data = await db.getProgressData(since());
    expect(data.reviewAnswers.map((answer) => answer.correct)).toEqual([true, false]);
    expect(data.activity.filter((event) => event.kind === "review")).toHaveLength(2);
    expect(data.reviewHistoryStartedAt).not.toBeNull();
  });
});
