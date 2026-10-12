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
