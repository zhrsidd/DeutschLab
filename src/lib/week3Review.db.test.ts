// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../test/fakeSqlPlugin";

vi.mock("@tauri-apps/plugin-sql", async () => import("../test/fakeSqlPlugin"));

type Db = typeof import("./db");

const rows = <T>(sql: string, ...params: (string | number)[]) =>
  getTestDatabase().prepare(sql).all(...params) as T[];

let db: Db;

beforeEach(async () => {
  vi.resetModules();
  resetTestDatabase();
  db = await import("./db");
  await db.initialiseDatabase();
});

const article = {
  sourceType: "vocabulary" as const,
  sourceId: "tisch#article",
  category: "vocabulary",
  prompt: 'What is the article of "Tisch"?',
  expected: "der Tisch",
  userAnswer: "die",
  correct: false,
};

const plural = {
  ...article,
  sourceId: "buch#plural",
  prompt: 'What is the plural of "das Buch"?',
  expected: "die Bücher",
  userAnswer: "die Buchs",
};

describe("article-aware Review records", () => {
  it("a wrong article creates a mistake and a structured review item", async () => {
    await db.recordAnswer(article);

    const mistakes = rows<{ lesson_id: string; item_key: string; expected_answer: string }>(
      `SELECT lesson_id, item_key, expected_answer FROM mistakes`,
    );
    expect(mistakes).toEqual([
      { lesson_id: "vocab-003", item_key: "vocabulary:tisch#article", expected_answer: "der Tisch" },
    ]);

    const [item] = rows<{ source_id: string; exercise_json: string; repetitions: number }>(
      `SELECT source_id, exercise_json, repetitions FROM review_items`,
    );
    expect(item.source_id).toBe("tisch#article");
    expect(item.repetitions).toBe(0);
    expect(JSON.parse(item.exercise_json)).toMatchObject({
      kind: "typed",
      concept: "noun_article",
      preferred: "der",
      prompt: "___ Tisch",
    });
  });

  it("a wrong plural creates a mistake with plural metadata", async () => {
    await db.recordAnswer(plural);

    const [item] = rows<{ exercise_json: string }>(`SELECT exercise_json FROM review_items`);
    expect(JSON.parse(item.exercise_json)).toMatchObject({
      concept: "noun_plural",
      preferred: "die Bücher",
    });
    expect(rows(`SELECT * FROM mistakes`)).toHaveLength(1);
  });

  it("keeps meaning, article and plural of one noun as separate review items", async () => {
    await db.recordAnswer({ ...article, sourceId: "buch", prompt: 'What does "das Buch" mean?', expected: "book", userAnswer: "pen" });
    await db.recordAnswer({ ...article, sourceId: "buch#article", expected: "das Buch" });
    await db.recordAnswer(plural);

    const ids = rows<{ source_id: string }>(
      `SELECT source_id FROM review_items ORDER BY source_id`,
    ).map((r) => r.source_id);

    expect(ids).toEqual(["buch", "buch#article", "buch#plural"]);
    expect(rows(`SELECT * FROM mistakes`)).toHaveLength(3);
  });

  it("repeats of the same article mistake increment times_missed", async () => {
    await db.recordAnswer(article);
    await db.recordAnswer({ ...article, userAnswer: "das" });

    expect(rows<{ times_missed: number }>(`SELECT times_missed FROM mistakes`)).toEqual([
      { times_missed: 2 },
    ]);
    expect(rows(`SELECT * FROM review_items`)).toHaveLength(1);
  });

  it("enters a correct article only when asked, without a mistake", async () => {
    await db.recordAnswer({ ...article, correct: true });
    expect(rows(`SELECT * FROM review_items`)).toHaveLength(0);

    await db.recordAnswer({ ...article, correct: true, enterOnCorrect: true });
    expect(rows(`SELECT * FROM review_items`)).toHaveLength(1);
    expect(rows(`SELECT * FROM mistakes`)).toHaveLength(0);
  });

  it("loads article items as due reviews with their stored exercise", async () => {
    await db.recordAnswer(article);

    const stored = rows<{ id: number }>(`SELECT id FROM review_items`)[0];
    getTestDatabase()
      .prepare(`UPDATE review_items SET due_at = ? WHERE id = ?`)
      .run(new Date(Date.now() - 1000).toISOString(), stored.id);

    const due = await db.getDueReviewItems();
    expect(due).toHaveLength(1);
    expect(due[0].sourceId).toBe("tisch#article");
    expect(JSON.parse(due[0].exerciseJson!).concept).toBe("noun_article");
  });

  it("leaves Week 1 and Week 2 vocabulary records unchanged", async () => {
    await db.recordAnswer({
      sourceType: "vocabulary",
      sourceId: "mutter",
      category: "vocabulary",
      prompt: 'How do you say "mother" in German?',
      expected: "die Mutter",
      userAnswer: "Vater",
      correct: false,
    });

    const [item] = rows<{ source_id: string; exercise_json: string }>(
      `SELECT source_id, exercise_json FROM review_items`,
    );
    expect(item.source_id).toBe("mutter");
    expect(JSON.parse(item.exercise_json).kind).toBe("vocab");
    expect(JSON.parse(item.exercise_json).germanAnswers).toContain("Mutter");
    expect(rows<{ lesson_id: string }>(`SELECT lesson_id FROM mistakes`)[0].lesson_id).toBe("vocab-002");
  });
});

describe("case-aware Review records", () => {
  const accusative = {
    sourceType: "grammar" as const,
    sourceId: "acc-c-den-tisch",
    category: "grammar · choice",
    prompt: "Ich habe ___ Tisch.",
    expected: "den",
    userAnswer: "der",
    correct: false,
  };

  it("a wrong accusative creates its own mistake, apart from #article", async () => {
    await db.recordAnswer(article);
    await db.recordAnswer(accusative);

    const mistakes = rows<{ item_key: string; lesson_id: string }>(
      `SELECT item_key, lesson_id FROM mistakes ORDER BY item_key`,
    );
    expect(mistakes).toEqual([
      { item_key: "grammar:acc-c-den-tisch", lesson_id: "grammar-007" },
      { item_key: "vocabulary:tisch#article", lesson_id: "vocab-003" },
    ]);

    const reviews = rows<{ source_type: string; source_id: string }>(
      `SELECT source_type, source_id FROM review_items ORDER BY source_id`,
    );
    expect(reviews).toHaveLength(2);

    const stored = rows<{ exercise_json: string }>(
      `SELECT exercise_json FROM review_items WHERE source_id = 'acc-c-den-tisch'`,
    )[0];
    expect(JSON.parse(stored.exercise_json)).toMatchObject({
      kind: "choice",
      concept: "accusative",
      answer: "den",
    });
  });

  it("missing the accusative does not touch the article review item", async () => {
    await db.recordAnswer(article);
    const before = rows(`SELECT * FROM review_items WHERE source_id = 'tisch#article'`);

    await db.recordAnswer(accusative);
    await db.recordAnswer({ ...accusative, userAnswer: "das" });

    expect(rows(`SELECT * FROM review_items WHERE source_id = 'tisch#article'`)).toEqual(before);
    expect(
      rows<{ times_missed: number }>(
        `SELECT times_missed FROM mistakes WHERE item_key = 'grammar:acc-c-den-tisch'`,
      ),
    ).toEqual([{ times_missed: 2 }]);
  });

  it("a wrong kein form creates a negation review item", async () => {
    await db.recordAnswer({
      sourceType: "grammar",
      sourceId: "neg-c-stift",
      category: "grammar · choice",
      prompt: "Ich habe ___ Stift.",
      expected: "keinen",
      userAnswer: "kein",
      correct: false,
    });

    const [item] = rows<{ exercise_json: string; repetitions: number; interval_days: number }>(
      `SELECT exercise_json, repetitions, interval_days FROM review_items`,
    );
    expect(JSON.parse(item.exercise_json)).toMatchObject({ concept: "negation", answer: "keinen" });
    expect(item.repetitions).toBe(0);
    expect(item.interval_days).toBe(1);
    expect(rows<{ lesson_id: string }>(`SELECT lesson_id FROM mistakes`)).toEqual([
      { lesson_id: "grammar-008" },
    ]);
  });

  it("keeps the scheduling of older grammar items unchanged", async () => {
    await db.recordAnswer({
      sourceType: "grammar",
      sourceId: "hb-c-er",
      category: "grammar · choice",
      prompt: "Er ___ Physik. (haben)",
      expected: "hat",
      userAnswer: "habe",
      correct: false,
    });
    await db.recordAnswer(accusative);

    const items = rows<{ source_id: string; interval_days: number; repetitions: number }>(
      `SELECT source_id, interval_days, repetitions FROM review_items ORDER BY source_id`,
    );
    expect(items).toEqual([
      { source_id: "acc-c-den-tisch", interval_days: 1, repetitions: 0 },
      { source_id: "hb-c-er", interval_days: 1, repetitions: 0 },
    ]);
    expect(rows<{ lesson_id: string }>(`SELECT lesson_id FROM mistakes WHERE item_key = 'grammar:hb-c-er'`)).toEqual([
      { lesson_id: "grammar-004" },
    ]);
  });
});

describe("checkpoint-003 attempts and Week 3 Review independence", () => {
  const result = (
    scores: [number, number, number, number, number],
    passed: boolean,
  ) => {
    const keys = ["vocabulary", "grammar", "reading", "listening", "writing"] as const;
    const max = [8, 10, 4, 4, 6];
    const required = [6, 7, 0, 2, 4];
    const total = scores.reduce((sum, value) => sum + value, 0);

    return {
      total,
      possible: 32,
      percent: Math.round((total / 32) * 100),
      sections: keys.map((key, i) => ({
        key,
        label: key,
        score: scores[i],
        max: max[i],
        required: required[i],
        passed: scores[i] >= required[i],
      })),
      overallPassed: passed,
      passed,
      weakSections: [],
    };
  };

  it("saves each attempt as a new row with Week 3 section scores", async () => {
    await db.saveCheckpointAttempt("checkpoint-003", result([5, 6, 3, 3, 4], false));
    await db.saveCheckpointAttempt("checkpoint-003", result([7, 8, 4, 3, 5], true));

    const attempts = await db.getCheckpointAttempts("checkpoint-003");

    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toMatchObject({ total: 21, possible: 32, passed: false });
    expect(attempts[1]).toMatchObject({ total: 27, passed: true });
    expect(attempts[1].sections).toEqual({
      vocabulary: 7, grammar: 8, reading: 4, listening: 3, writing: 5,
    });
    expect(attempts[0].id).not.toBe(attempts[1].id);
  });

  it("preserves existing checkpoint-001 and checkpoint-002 histories", async () => {
    await db.saveCheckpointAttempt("checkpoint-002", result([6, 7, 4, 3, 6], true));
    const before = await db.getCheckpointAttempts("checkpoint-002");

    await db.saveCheckpointAttempt("checkpoint-003", result([5, 6, 3, 3, 4], false));

    expect(await db.getCheckpointAttempts("checkpoint-002")).toEqual(before);
    expect(await db.getCheckpointAttempts("checkpoint-001")).toEqual([]);
    expect(await db.getCheckpointAttempts("checkpoint-003")).toHaveLength(1);
  });

  it("does not mark checkpoint-003 complete by saving an attempt, and tells the planner", async () => {
    await db.saveCheckpointAttempt("checkpoint-003", result([7, 8, 4, 3, 5], true));

    expect(await db.getCompletedTaskIds()).toEqual([]);
    expect((await db.getPlannerData()).attemptedCheckpointIds).toEqual(["checkpoint-003"]);

    await db.markTaskComplete("checkpoint-003");
    expect(await db.getCompletedTaskIds()).toEqual(["checkpoint-003"]);
  });

  it("tracks gender, plural, accusative and negation as four independent review items", async () => {
    const base = { category: "x", correct: false, userAnswer: "wrong" };

    await db.recordAnswer({ ...base, sourceType: "vocabulary", sourceId: "tisch#article", prompt: "a", expected: "der Tisch" });
    await db.recordAnswer({ ...base, sourceType: "vocabulary", sourceId: "tisch#plural", prompt: "b", expected: "die Tische" });
    await db.recordAnswer({ ...base, sourceType: "grammar", sourceId: "c3-acc-5a", prompt: "c", expected: "den" });
    await db.recordAnswer({ ...base, sourceType: "grammar", sourceId: "c3-neg-7b", prompt: "d", expected: "keinen" });

    const lessons = rows<{ item_key: string; lesson_id: string }>(
      `SELECT item_key, lesson_id FROM mistakes ORDER BY item_key`,
    );
    expect(lessons).toEqual([
      { item_key: "grammar:c3-acc-5a", lesson_id: "grammar-007" },
      { item_key: "grammar:c3-neg-7b", lesson_id: "grammar-008" },
      { item_key: "vocabulary:tisch#article", lesson_id: "vocab-003" },
      { item_key: "vocabulary:tisch#plural", lesson_id: "vocab-003" },
    ]);
    expect(rows(`SELECT * FROM review_items`)).toHaveLength(4);

    // Repeating one miss leaves the other three untouched.
    await db.recordAnswer({ ...base, sourceType: "grammar", sourceId: "c3-acc-5a", prompt: "c", expected: "den" });
    expect(
      rows<{ item_key: string; times_missed: number }>(
        `SELECT item_key, times_missed FROM mistakes ORDER BY item_key`,
      ).map((r) => r.times_missed),
    ).toEqual([2, 1, 1, 1]);
  });

  it("keeps SRS intervals and mistake resolution unchanged for Week 3 items", async () => {
    await db.recordAnswer({
      sourceType: "vocabulary", sourceId: "buch#plural", category: "x",
      prompt: "p", expected: "die Bücher", userAnswer: "z", correct: false,
    });
    getTestDatabase()
      .prepare(`UPDATE review_items SET due_at = ?`)
      .run(new Date(Date.now() - 1000).toISOString());

    const [item] = await db.getDueReviewItems();
    expect(item.sourceId).toBe("buch#plural");

    // Same scheduler as every other item: two correct reviews resolve the mistake.
    await db.applyReviewResult(item, true);
    expect(rows<{ resolved_at: string | null }>(`SELECT resolved_at FROM mistakes`)[0].resolved_at).toBeNull();

    await db.applyReviewResult(item, true);
    expect(rows<{ resolved_at: string | null }>(`SELECT resolved_at FROM mistakes`)[0].resolved_at).not.toBeNull();

    const [row] = rows<{ interval_days: number; repetitions: number }>(
      `SELECT interval_days, repetitions FROM review_items`,
    );
    expect(row.repetitions).toBe(2);
    expect(row.interval_days).toBeGreaterThan(1);
  });
});
