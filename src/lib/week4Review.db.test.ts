// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../test/fakeSqlPlugin";

vi.mock("@tauri-apps/plugin-sql", async () => import("../test/fakeSqlPlugin"));

type Db = typeof import("./db");

const rows = <T>(sql: string, ...params: (string | number)[]) =>
  getTestDatabase().prepare(sql).all(...params) as T[];

const makeDue = () =>
  getTestDatabase()
    .prepare(`UPDATE review_items SET due_at = ?`)
    .run(new Date(Date.now() - 1000).toISOString());

let db: Db;

beforeEach(async () => {
  vi.resetModules();
  resetTestDatabase();
  db = await import("./db");
  await db.initialiseDatabase();
});

const wrong = (sourceType: "vocabulary" | "grammar", sourceId: string, expected = "x") => ({
  sourceType,
  sourceId,
  category: sourceType,
  prompt: `prompt for ${sourceId}`,
  expected,
  userAnswer: "wrong",
  correct: false,
});

describe("Week 4 Review records", () => {
  it("a wrong pronoun creates a grammar-009 mistake and a structured pronoun item", async () => {
    await db.recordAnswer(wrong("grammar", "pr-f-ihn-stift", "ihn"));

    expect(rows(`SELECT lesson_id, item_key FROM mistakes`)).toEqual([
      { lesson_id: "grammar-009", item_key: "grammar:pr-f-ihn-stift" },
    ]);

    const [item] = rows<{ exercise_json: string; interval_days: number; repetitions: number }>(
      `SELECT exercise_json, interval_days, repetitions FROM review_items`,
    );
    expect(item.interval_days).toBe(1);
    expect(item.repetitions).toBe(0);
    expect(JSON.parse(item.exercise_json)).toMatchObject({
      kind: "typed",
      concept: "pronoun",
      preferred: "ihn",
    });
  });

  it("keeps meaning, article, plural, accusative, pronoun, verb form, word order and negation apart", async () => {
    const answers = [
      wrong("vocabulary", "jacke"),
      wrong("vocabulary", "jacke#article"),
      wrong("vocabulary", "jacke#plural"),
      wrong("grammar", "iv-c-eine-jacke"),
      wrong("grammar", "pr-t-replace-tasche"),
      wrong("grammar", "iv-f-traegt"),
      wrong("grammar", "iv-r-heute-trifft"),
      wrong("grammar", "c4-neg-10a"),
    ];
    for (const answer of answers) await db.recordAnswer(answer);

    expect(rows(`SELECT item_key, lesson_id FROM mistakes ORDER BY item_key`)).toEqual([
      { item_key: "grammar:c4-neg-10a", lesson_id: "grammar-008" },
      { item_key: "grammar:iv-c-eine-jacke", lesson_id: "grammar-010" },
      { item_key: "grammar:iv-f-traegt", lesson_id: "grammar-010" },
      { item_key: "grammar:iv-r-heute-trifft", lesson_id: "grammar-010" },
      { item_key: "grammar:pr-t-replace-tasche", lesson_id: "grammar-009" },
      { item_key: "vocabulary:jacke", lesson_id: "vocab-004" },
      { item_key: "vocabulary:jacke#article", lesson_id: "vocab-004" },
      { item_key: "vocabulary:jacke#plural", lesson_id: "vocab-004" },
    ]);

    const concepts = rows<{ source_id: string; exercise_json: string }>(
      `SELECT source_id, exercise_json FROM review_items ORDER BY source_id`,
    ).map((row) => [row.source_id, JSON.parse(row.exercise_json).concept ?? JSON.parse(row.exercise_json).kind]);

    expect(concepts).toEqual([
      ["c4-neg-10a", "negation"],
      ["iv-c-eine-jacke", "accusative"],
      ["iv-f-traegt", "verb_form"],
      ["iv-r-heute-trifft", "word_order"],
      ["jacke", "vocab"],
      ["jacke#article", "noun_article"],
      ["jacke#plural", "noun_plural"],
      ["pr-t-replace-tasche", "pronoun"],
    ]);
  });

  it("increments a repeated mistake without touching the others", async () => {
    await db.recordAnswer(wrong("grammar", "iv-f-traegt"));
    await db.recordAnswer(wrong("grammar", "pr-c-mich"));
    await db.recordAnswer(wrong("grammar", "iv-f-traegt"));

    expect(rows(`SELECT item_key, times_missed FROM mistakes ORDER BY item_key`)).toEqual([
      { item_key: "grammar:iv-f-traegt", times_missed: 2 },
      { item_key: "grammar:pr-c-mich", times_missed: 1 },
    ]);
    expect(rows(`SELECT * FROM review_items`)).toHaveLength(2);
  });

  it("follows the unchanged ladder 1 → 3 → 7 → 14 → 30 → 60 days", async () => {
    await db.recordAnswer(wrong("grammar", "iv-c-siehst"));
    const intervals: number[] = [
      rows<{ interval_days: number }>(`SELECT interval_days FROM review_items`)[0].interval_days,
    ];

    for (let i = 0; i < 5; i += 1) {
      makeDue();
      const [item] = await db.getDueReviewItems();
      await db.applyReviewResult(item, true);
      intervals.push(rows<{ interval_days: number }>(`SELECT interval_days FROM review_items`)[0].interval_days);
    }

    expect(intervals).toEqual([1, 3, 7, 14, 30, 60]);
  });

  it("resets to 1 day after a wrong review and resolves the mistake after two correct ones", async () => {
    await db.recordAnswer(wrong("grammar", "pr-c-uns"));
    makeDue();
    let [item] = await db.getDueReviewItems();

    await db.applyReviewResult(item, true);
    await db.applyReviewResult(item, false);
    expect(rows(`SELECT interval_days, repetitions FROM review_items`)).toEqual([
      { interval_days: 1, repetitions: 0 },
    ]);
    expect(rows<{ times_missed: number }>(`SELECT times_missed FROM mistakes`)[0].times_missed).toBe(2);

    makeDue();
    [item] = await db.getDueReviewItems();
    await db.applyReviewResult(item, true);
    expect(rows<{ resolved_at: string | null }>(`SELECT resolved_at FROM mistakes`)[0].resolved_at).toBeNull();
    await db.applyReviewResult(item, true);
    expect(rows<{ resolved_at: string | null }>(`SELECT resolved_at FROM mistakes`)[0].resolved_at).not.toBeNull();
  });

  it("still loads a legacy (pre-structured) review item next to Week 4 items", async () => {
    getTestDatabase()
      .prepare(
        `INSERT INTO review_items (source_type, source_id, prompt, answer, due_at, updated_at)
         VALUES ('vocabulary', 'hallo', 'Hallo', 'Hello', ?, ?)`,
      )
      .run(new Date(Date.now() - 1000).toISOString(), new Date().toISOString());
    await db.recordAnswer(wrong("grammar", "pr-c-dich"));
    makeDue();

    const due = await db.getDueReviewItems();
    expect(due.map((item) => item.sourceId).sort()).toEqual(["hallo", "pr-c-dich"]);
    expect(due.find((item) => item.sourceId === "hallo")?.exerciseJson).toBeNull();
  });
});

describe("checkpoint-004 attempts", () => {
  const keys = ["vocabulary", "grammar", "reading", "listening", "writing", "speaking"] as const;
  const max = [8, 12, 4, 4, 6, 5];
  const required = [6, 9, 0, 2, 4, 3];

  const result = (scores: number[], passed: boolean) => {
    const total = scores.reduce((sum, value) => sum + value, 0);
    return {
      total,
      possible: 39,
      percent: Math.round((total / 39) * 100),
      sections: keys.map((key, i) => ({
        key, label: key, score: scores[i], max: max[i], required: required[i], passed: scores[i] >= required[i],
      })),
      overallPassed: total >= 32,
      passed,
      weakSections: [],
    };
  };

  it("inserts every attempt (retry adds a row) with all six section scores", async () => {
    await db.saveCheckpointAttempt("checkpoint-004", result([5, 8, 3, 2, 4, 3], false));
    await db.saveCheckpointAttempt("checkpoint-004", result([7, 11, 4, 3, 5, 4], true));

    const attempts = await db.getCheckpointAttempts("checkpoint-004");
    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toMatchObject({ total: 25, possible: 39, passed: false });
    expect(attempts[1]).toMatchObject({ total: 34, possible: 39, passed: true });
    expect(attempts[1].sections).toEqual({
      vocabulary: 7, grammar: 11, reading: 4, listening: 3, writing: 5, speaking: 4,
    });
  });

  it("leaves earlier checkpoint histories untouched and does not complete the task", async () => {
    getTestDatabase()
      .prepare(
        `INSERT INTO checkpoint_attempts (checkpoint_id, total_score, total_possible, section_scores_json, passed, completed_at)
         VALUES ('checkpoint-003', 27, 32, '{}', 1, ?)`,
      )
      .run(new Date().toISOString());
    const before = rows(`SELECT * FROM checkpoint_attempts WHERE checkpoint_id = 'checkpoint-003'`);

    await db.saveCheckpointAttempt("checkpoint-004", result([7, 11, 4, 3, 5, 4], true));

    expect(rows(`SELECT * FROM checkpoint_attempts WHERE checkpoint_id = 'checkpoint-003'`)).toEqual(before);
    expect(await db.getCompletedTaskIds()).toEqual([]);
    expect((await db.getPlannerData()).attemptedCheckpointIds.sort()).toEqual(["checkpoint-003", "checkpoint-004"]);
  });
});
