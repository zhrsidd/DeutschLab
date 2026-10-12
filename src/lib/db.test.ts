// @vitest-environment node
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../test/fakeSqlPlugin";

vi.mock("@tauri-apps/plugin-sql", async () => import("../test/fakeSqlPlugin"));

type Db = typeof import("./db");

/** Fresh module graph + empty in-memory SQLite for every test. */
async function freshDb(): Promise<Db> {
  vi.resetModules();
  resetTestDatabase();

  return import("./db");
}

const rows = <T>(sql: string, ...params: (string | number)[]) =>
  getTestDatabase().prepare(sql).all(...params) as T[];

const columns = (table: string) =>
  rows<{ name: string }>(`PRAGMA table_info(${table})`).map((c) => c.name);

const isoDaysFromNow = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

let db: Db;

beforeEach(async () => {
  db = await freshDb();
});

describe("migrations", () => {
  it("creates every table", async () => {
    await db.initialiseDatabase();

    const tables = rows<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table'`,
    ).map((t) => t.name);

    for (const name of [
      "task_progress",
      "app_state",
      "lesson_attempts",
      "mistakes",
      "review_items",
      "checkpoint_attempts",
    ]) {
      expect(tables).toContain(name);
    }
  });

  it("is idempotent and keeps existing data", async () => {
    await db.initialiseDatabase();
    await db.markTaskComplete("vocab-001");
    await db.setStudyMinutes(45);

    await db.initialiseDatabase();
    await db.initialiseDatabase();

    expect(await db.getCompletedTaskIds()).toEqual(["vocab-001"]);
    expect(await db.getStudyMinutes()).toBe(45);
    expect(columns("review_items").filter((c) => c === "exercise_json")).toHaveLength(1);
  });

  it("upgrades a pre-v0.4A review_items table without losing rows", async () => {
    getTestDatabase().exec(`
      CREATE TABLE review_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        answer TEXT NOT NULL,
        audio_text TEXT,
        due_at TEXT NOT NULL,
        interval_days INTEGER NOT NULL DEFAULT 1,
        ease REAL NOT NULL DEFAULT 2.5,
        repetitions INTEGER NOT NULL DEFAULT 0,
        last_result TEXT,
        updated_at TEXT NOT NULL,
        UNIQUE (source_type, source_id)
      );
      INSERT INTO review_items
        (source_type, source_id, prompt, answer, due_at, updated_at)
      VALUES ('vocabulary', 'danke', 'What does "Danke" mean?', 'Thank you',
              '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z');
    `);

    expect(columns("review_items")).not.toContain("exercise_json");

    await db.initialiseDatabase();

    expect(columns("review_items")).toContain("exercise_json");

    const legacy = rows<{ source_id: string; exercise_json: string | null }>(
      `SELECT source_id, exercise_json FROM review_items`,
    );

    expect(legacy).toEqual([{ source_id: "danke", exercise_json: null }]);

    // The old row is still returned and flagged for the legacy fallback.
    const due = await db.getDueReviewItems();
    expect(due).toHaveLength(1);
    expect(due[0].exerciseJson).toBeNull();
  });
});

describe("mistakes", () => {
  const miss = {
    sourceType: "grammar" as const,
    sourceId: "f-ich",
    category: "grammar · fill",
    prompt: "Complete: Ich ___ Schüler.",
    expected: "bin",
    userAnswer: "bist",
    correct: false,
  };

  it("increments times_missed instead of duplicating an unresolved mistake", async () => {
    await db.initialiseDatabase();

    await db.recordAnswer(miss);
    await db.recordAnswer({ ...miss, userAnswer: "ist" });
    await db.recordAnswer({ ...miss, userAnswer: "sind" });

    const all = rows<{ times_missed: number; user_answer: string }>(
      `SELECT times_missed, user_answer FROM mistakes`,
    );

    expect(all).toEqual([{ times_missed: 3, user_answer: "sind" }]);
  });

  it("keeps one review item per concept and schedules it for tomorrow", async () => {
    await db.initialiseDatabase();

    await db.recordAnswer(miss);
    await db.recordAnswer(miss);

    const items = rows<{ repetitions: number; interval_days: number; exercise_json: string }>(
      `SELECT repetitions, interval_days, exercise_json FROM review_items`,
    );

    expect(items).toHaveLength(1);
    expect(items[0].repetitions).toBe(0);
    expect(items[0].interval_days).toBe(1);
    expect(JSON.parse(items[0].exercise_json).kind).toBe("typed");
  });

  it("does not create mistakes for correct answers", async () => {
    await db.initialiseDatabase();

    await db.recordAnswer({ ...miss, correct: true });

    expect(rows(`SELECT * FROM mistakes`)).toHaveLength(0);
    expect(rows(`SELECT * FROM review_items`)).toHaveLength(0);
  });

  it("adds a correct first answer to review only when asked", async () => {
    await db.initialiseDatabase();

    await db.recordAnswer({ ...miss, correct: true, enterOnCorrect: true });

    expect(rows(`SELECT * FROM review_items`)).toHaveLength(1);
    expect(rows(`SELECT * FROM mistakes`)).toHaveLength(0);
  });

  it("opens a fresh row for a mistake that was already resolved", async () => {
    await db.initialiseDatabase();

    await db.recordAnswer(miss);
    getTestDatabase().exec(
      `UPDATE mistakes SET resolved_at = '2026-01-01T00:00:00.000Z'`,
    );
    await db.recordAnswer(miss);

    expect(rows(`SELECT * FROM mistakes`)).toHaveLength(2);
  });

  it("resolves a mistake after two correct reviews in a row", async () => {
    await db.initialiseDatabase();
    await db.recordAnswer(miss);

    getTestDatabase().exec(`UPDATE review_items SET due_at = '2020-01-01T00:00:00.000Z'`);

    let [item] = await db.getDueReviewItems();
    await db.applyReviewResult(item, true);

    expect(rows<{ resolved_at: string | null }>(`SELECT resolved_at FROM mistakes`)[0].resolved_at).toBeNull();

    getTestDatabase().exec(`UPDATE review_items SET due_at = '2020-01-01T00:00:00.000Z'`);
    [item] = await db.getDueReviewItems();
    await db.applyReviewResult(item, true);

    expect(rows<{ resolved_at: string | null }>(`SELECT resolved_at FROM mistakes`)[0].resolved_at).not.toBeNull();
  });

  it("reschedules to tomorrow and reopens the mistake on 'Again'", async () => {
    await db.initialiseDatabase();
    await db.recordAnswer(miss);
    getTestDatabase().exec(`UPDATE review_items SET due_at = '2020-01-01T00:00:00.000Z', repetitions = 2, interval_days = 7`);

    const [item] = await db.getDueReviewItems();
    await db.applyReviewResult(item, false);

    const after = rows<{ repetitions: number; interval_days: number }>(
      `SELECT repetitions, interval_days FROM review_items`,
    )[0];

    expect(after).toEqual({ repetitions: 0, interval_days: 1 });
    expect(rows<{ times_missed: number }>(`SELECT times_missed FROM mistakes`)[0].times_missed).toBe(2);
  });

  it("ignores a result for a review item that was deleted mid-session", async () => {
    await db.initialiseDatabase();
    await db.recordAnswer(miss);
    getTestDatabase().exec(`UPDATE review_items SET due_at = '2020-01-01T00:00:00.000Z'`);

    const [item] = await db.getDueReviewItems();
    getTestDatabase().exec(`DELETE FROM review_items`);

    await expect(db.applyReviewResult(item, true)).resolves.toBeUndefined();
  });
});

describe("review queries", () => {
  async function seedDue(count: number) {
    await db.initialiseDatabase();

    const insert = getTestDatabase().prepare(
      `INSERT INTO review_items
         (source_type, source_id, prompt, answer, due_at, updated_at)
       VALUES ('vocabulary', ?, 'p', 'a', ?, ?)`,
    );

    for (let i = 0; i < count; i += 1) {
      insert.run(`seed-${i}`, "2020-01-01T00:00:00.000Z", "2020-01-01T00:00:00.000Z");
    }
  }

  it("respects the requested session limit", async () => {
    await seedDue(30);

    expect(await db.getDueReviewItems(15)).toHaveLength(15);
    expect(await db.getDueReviewItems(1)).toHaveLength(1);
  });

  it("defaults to 20 items", async () => {
    await seedDue(30);

    expect(await db.getDueReviewItems()).toHaveLength(20);
  });

  it("returns fewer items when fewer are due", async () => {
    await seedDue(3);

    expect(await db.getDueReviewItems(15)).toHaveLength(3);
  });

  it("counts due items and finds the next review date", async () => {
    await seedDue(2);
    getTestDatabase()
      .prepare(
        `INSERT INTO review_items (source_type, source_id, prompt, answer, due_at, updated_at)
         VALUES ('vocabulary', 'later', 'p', 'a', ?, ?)`,
      )
      .run(isoDaysFromNow(5), isoDaysFromNow(0));

    const stats = await db.getReviewStats();

    expect(stats.dueToday).toBe(2);
    expect(stats.nextDueAt).not.toBeNull();
  });

  it("returns zero due items for an empty database", async () => {
    await db.initialiseDatabase();

    expect(await db.getDueReviewItems()).toEqual([]);
    expect((await db.getReviewStats()).dueToday).toBe(0);
  });
});

describe("checkpoint attempts", () => {
  const result = (total: number, passed: boolean) => ({
    total,
    possible: 34,
    percent: Math.round((total / 34) * 100),
    sections: [
      { key: "vocabulary" as const, label: "Vocabulary", score: 6, max: 8, required: 6, passed: true },
      { key: "grammar" as const, label: "Grammar", score: 4, max: 8, required: 6, passed: false },
      { key: "reading" as const, label: "Reading", score: 3, max: 4, required: 0, passed: true },
      { key: "listening" as const, label: "Listening", score: 3, max: 4, required: 2, passed: true },
      { key: "writing" as const, label: "Writing self-check", score: 4, max: 5, required: 3, passed: true },
      { key: "speaking" as const, label: "Speaking self-check", score: 4, max: 5, required: 3, passed: true },
    ],
    overallPassed: passed,
    passed,
    weakSections: passed ? [] : ["grammar" as const],
  });

  it("inserts a new row for every attempt and never overwrites", async () => {
    await db.initialiseDatabase();

    await db.saveCheckpointAttempt("checkpoint-001", result(24, false));
    await db.saveCheckpointAttempt("checkpoint-001", result(29, true));

    const attempts = await db.getCheckpointAttempts("checkpoint-001");

    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toMatchObject({ total: 24, passed: false });
    expect(attempts[1]).toMatchObject({ total: 29, passed: true });
    expect(attempts[0].id).not.toBe(attempts[1].id);
  });

  it("stores section scores that round-trip", async () => {
    await db.initialiseDatabase();
    await db.saveCheckpointAttempt("checkpoint-001", result(24, false));

    const [attempt] = await db.getCheckpointAttempts("checkpoint-001");

    expect(attempt.sections).toEqual({
      vocabulary: 6,
      grammar: 4,
      reading: 3,
      listening: 3,
      writing: 4,
      speaking: 4,
    });
  });

  it("does not mark the checkpoint task complete by itself", async () => {
    await db.initialiseDatabase();
    await db.saveCheckpointAttempt("checkpoint-001", result(24, false));

    expect(await db.getCompletedTaskIds()).toEqual([]);
  });

  it("feeds the planner so a failed attempt is known", async () => {
    await db.initialiseDatabase();
    await db.saveCheckpointAttempt("checkpoint-001", result(24, false));

    expect((await db.getPlannerData()).attemptedCheckpointIds).toEqual([
      "checkpoint-001",
    ]);
  });
});

describe("checkpoint-002 attempts", () => {
  const section = (
    key: "vocabulary" | "grammar" | "reading" | "listening" | "writing",
    label: string,
    score: number,
    max: number,
    required: number,
  ) => ({ key, label, score, max, required, passed: score >= required });

  const week2Result = (grammar: number, passed: boolean) => ({
    total: 8 + grammar + 4 + 4 + 6,
    possible: 32,
    percent: 90,
    sections: [
      section("vocabulary", "Vocabulary", 8, 8, 6),
      section("grammar", "Grammar", grammar, 10, 7),
      section("reading", "Reading", 4, 4, 0),
      section("listening", "Listening", 4, 4, 2),
      section("writing", "Writing self-check", 6, 6, 4),
    ],
    overallPassed: true,
    passed,
    weakSections: passed ? [] : ["grammar" as const],
  });

  const week1Result = {
    total: 24,
    possible: 34,
    percent: 71,
    sections: [
      section("vocabulary", "Vocabulary", 6, 8, 6),
      section("grammar", "Grammar", 4, 8, 6),
      section("reading", "Reading", 3, 4, 0),
      section("listening", "Listening", 3, 4, 2),
      section("writing", "Writing self-check", 4, 5, 3),
      { key: "speaking" as const, label: "Speaking self-check", score: 4, max: 5, required: 3, passed: true },
    ],
    overallPassed: false,
    passed: false,
    weakSections: ["grammar" as const],
  };

  it("retries insert new rows and never overwrite earlier attempts", async () => {
    await db.initialiseDatabase();

    await db.saveCheckpointAttempt("checkpoint-002", week2Result(6, false));
    await db.saveCheckpointAttempt("checkpoint-002", week2Result(9, true));

    const attempts = await db.getCheckpointAttempts("checkpoint-002");

    expect(attempts).toHaveLength(2);
    expect(attempts.map((a) => a.passed)).toEqual([false, true]);
    expect(attempts[0].id).not.toBe(attempts[1].id);
    expect(attempts[0].total).toBe(8 + 6 + 4 + 4 + 6);
    expect(attempts[1].total).toBe(8 + 9 + 4 + 4 + 6);
  });

  it("reads Week 2 section scores with the Week 2 layout (no speaking)", async () => {
    await db.initialiseDatabase();
    await db.saveCheckpointAttempt("checkpoint-002", week2Result(6, false));

    const [attempt] = await db.getCheckpointAttempts("checkpoint-002");

    expect(attempt.sections).toEqual({
      vocabulary: 8,
      grammar: 6,
      reading: 4,
      listening: 4,
      writing: 6,
    });
  });

  it("leaves checkpoint-001 history untouched", async () => {
    await db.initialiseDatabase();
    await db.saveCheckpointAttempt("checkpoint-001", week1Result);

    const before = await db.getCheckpointAttempts("checkpoint-001");

    await db.saveCheckpointAttempt("checkpoint-002", week2Result(6, false));
    await db.saveCheckpointAttempt("checkpoint-002", week2Result(9, true));

    const after = await db.getCheckpointAttempts("checkpoint-001");

    expect(after).toEqual(before);
    expect(after).toHaveLength(1);
    expect(after[0].sections).toMatchObject({ speaking: 4 });
  });

  it("keeps the two checkpoints' attempts apart", async () => {
    await db.initialiseDatabase();
    await db.saveCheckpointAttempt("checkpoint-001", week1Result);
    await db.saveCheckpointAttempt("checkpoint-002", week2Result(9, true));

    expect(await db.getCheckpointAttempts("checkpoint-001")).toHaveLength(1);
    expect(await db.getCheckpointAttempts("checkpoint-002")).toHaveLength(1);
    expect((await db.getPlannerData()).attemptedCheckpointIds.sort()).toEqual([
      "checkpoint-001",
      "checkpoint-002",
    ]);
  });

  it("does not complete the task by saving a passing attempt", async () => {
    await db.initialiseDatabase();
    await db.saveCheckpointAttempt("checkpoint-002", week2Result(9, true));

    expect(await db.getCompletedTaskIds()).toEqual([]);

    await db.markTaskComplete("checkpoint-002");

    expect(await db.getCompletedTaskIds()).toEqual(["checkpoint-002"]);
  });
});

describe("writing drafts", () => {
  it("returns an empty draft before anything is saved", async () => {
    await db.initialiseDatabase();

    expect(await db.getWritingDraft("writing-001")).toBe("");
  });

  it("saves, overwrites and restores a draft", async () => {
    await db.initialiseDatabase();

    await db.saveWritingDraft("writing-001", "Ich heiße Anna.");
    await db.saveWritingDraft("writing-001", "Ich heiße Anna. Ich wohne in Doha.");

    expect(await db.getWritingDraft("writing-001")).toBe("Ich heiße Anna. Ich wohne in Doha.");
    expect(rows(`SELECT * FROM app_state WHERE key LIKE 'writing_draft:%'`)).toHaveLength(1);
  });

  it("survives a restart (fresh module graph, same database)", async () => {
    await db.initialiseDatabase();
    await db.saveWritingDraft("writing-001", "Hallo, ich bin Anna.");

    vi.resetModules();
    const reopened = await import("./db");
    await reopened.initialiseDatabase(); // migrations are idempotent

    expect(await reopened.getWritingDraft("writing-001")).toBe("Hallo, ich bin Anna.");
  });

  it("keeps drafts for different tasks apart and clears only the chosen one", async () => {
    await db.initialiseDatabase();
    await db.saveWritingDraft("writing-001", "eins");
    await db.saveWritingDraft("writing-002", "zwei");

    await db.clearWritingDraft("writing-001");

    expect(await db.getWritingDraft("writing-001")).toBe("");
    expect(await db.getWritingDraft("writing-002")).toBe("zwei");
  });

  it("does not disturb the study-time preference sharing app_state", async () => {
    await db.initialiseDatabase();
    await db.setStudyMinutes(45);
    await db.saveWritingDraft("writing-001", "text");
    await db.clearWritingDraft("writing-001");

    expect(await db.getStudyMinutes()).toBe(45);
  });

  it("never creates mistakes or review items", async () => {
    await db.initialiseDatabase();
    await db.saveWritingDraft("writing-001", "Ich bin Anna.");
    await db.saveLessonAttempt("writing-001", 4, 6);

    expect(rows(`SELECT * FROM mistakes`)).toHaveLength(0);
    expect(rows(`SELECT * FROM review_items`)).toHaveLength(0);
  });
});

describe("mistakes traced to the right lesson", () => {
  it("records grammar-005 and vocab-002 mistakes with their own lesson ids", async () => {
    await db.initialiseDatabase();

    await db.recordAnswer({
      sourceType: "grammar",
      sourceId: "cv-f-du-sprechen",
      category: "grammar · fill",
      prompt: "Du ___ Deutsch. (sprechen)",
      expected: "sprichst",
      userAnswer: "sprechst",
      correct: false,
    });
    await db.recordAnswer({
      sourceType: "vocabulary",
      sourceId: "mutter",
      category: "vocabulary",
      prompt: 'What does "die Mutter" mean?',
      expected: "mother",
      userAnswer: "father",
      correct: false,
    });
    await db.recordAnswer({
      sourceType: "vocabulary",
      sourceId: "danke",
      category: "vocabulary",
      prompt: 'What does "Danke" mean?',
      expected: "Thank you",
      userAnswer: "Please",
      correct: false,
    });

    const lessons = rows<{ item_key: string; lesson_id: string }>(
      `SELECT item_key, lesson_id FROM mistakes ORDER BY id`,
    );

    expect(lessons).toEqual([
      { item_key: "grammar:cv-f-du-sprechen", lesson_id: "grammar-005" },
      { item_key: "vocabulary:mutter", lesson_id: "vocab-002" },
      { item_key: "vocabulary:danke", lesson_id: "vocab-001" },
    ]);
  });

  it("stores structured review data for grammar-005 and Week 2 vocabulary", async () => {
    await db.initialiseDatabase();

    await db.recordAnswer({
      sourceType: "grammar",
      sourceId: "cv-t-sie-schlafen",
      category: "grammar · typed",
      prompt: "She sleeps.",
      expected: "Sie schläft.",
      userAnswer: "Sie schlaft.",
      correct: false,
    });
    await db.recordAnswer({
      sourceType: "vocabulary",
      sourceId: "grossmutter",
      category: "vocabulary",
      prompt: "p",
      expected: "grandmother",
      userAnswer: "x",
      correct: false,
    });

    const stored = rows<{ source_id: string; exercise_json: string }>(
      `SELECT source_id, exercise_json FROM review_items ORDER BY id`,
    );

    expect(stored.map((r) => JSON.parse(r.exercise_json).kind)).toEqual(["typed", "vocab"]);
  });
});

describe("study-time preference", () => {
  it("returns null before anything is saved, then the saved value", async () => {
    await db.initialiseDatabase();

    expect(await db.getStudyMinutes()).toBeNull();

    await db.setStudyMinutes(15);
    await db.setStudyMinutes(60);

    expect(await db.getStudyMinutes()).toBe(60);
    expect(rows(`SELECT * FROM app_state WHERE key = 'study_minutes'`)).toHaveLength(1);
  });
});

it("node:sqlite is available for the DB tests", () => {
  expect(new DatabaseSync(":memory:")).toBeTruthy();
});
