// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../test/fakeSqlPlugin";

vi.mock("@tauri-apps/plugin-sql", async () => import("../test/fakeSqlPlugin"));

type Db = typeof import("./db");

const rows = <T>(sql: string, ...params: (string | number)[]) =>
  getTestDatabase().prepare(sql).all(...params) as T[];

const indexNames = () =>
  rows<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name`,
  ).map((row) => row.name);

const plan = (sql: string) =>
  rows<{ detail: string }>(`EXPLAIN QUERY PLAN ${sql}`)
    .map((row) => row.detail)
    .join(" ; ");

async function freshDb(): Promise<Db> {
  vi.resetModules();
  resetTestDatabase();

  return import("./db");
}

/**
 * The schema of a database written by v0.3 (before exercise_json and the
 * v0.8 indexes), with the kind of rows a real learner would have.
 */
function createLegacyDatabase() {
  const sqlite = getTestDatabase();

  sqlite.exec(`
    CREATE TABLE task_progress (task_id TEXT PRIMARY KEY NOT NULL, completed INTEGER NOT NULL DEFAULT 0, completed_at TEXT);
    CREATE TABLE app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE lesson_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, completed_at TEXT NOT NULL);
    CREATE TABLE mistakes (id INTEGER PRIMARY KEY AUTOINCREMENT, lesson_id TEXT NOT NULL, item_key TEXT NOT NULL, category TEXT NOT NULL, prompt TEXT NOT NULL, expected_answer TEXT NOT NULL, user_answer TEXT NOT NULL, created_at TEXT NOT NULL, resolved_at TEXT, times_missed INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE review_items (id INTEGER PRIMARY KEY AUTOINCREMENT, source_type TEXT NOT NULL, source_id TEXT NOT NULL, prompt TEXT NOT NULL, answer TEXT NOT NULL, audio_text TEXT, due_at TEXT NOT NULL, interval_days INTEGER NOT NULL DEFAULT 1, ease REAL NOT NULL DEFAULT 2.5, repetitions INTEGER NOT NULL DEFAULT 0, last_result TEXT, updated_at TEXT NOT NULL, UNIQUE (source_type, source_id));
    CREATE TABLE checkpoint_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, checkpoint_id TEXT NOT NULL, total_score INTEGER NOT NULL, total_possible INTEGER NOT NULL, section_scores_json TEXT NOT NULL, passed INTEGER NOT NULL, completed_at TEXT NOT NULL);

    INSERT INTO task_progress VALUES ('vocab-001', 1, '2026-10-11T10:00:00.000Z'), ('pronunciation-001', 1, '2026-10-11T11:00:00.000Z');
    INSERT INTO app_state VALUES ('study_minutes', '45'), ('writing_draft:writing-001', 'Ich heiße Anna.');
    INSERT INTO lesson_attempts VALUES (1, 'vocab-001', 20, 24, '2026-10-11T10:00:00.000Z');
    INSERT INTO mistakes (lesson_id, item_key, category, prompt, expected_answer, user_answer, created_at, times_missed)
      VALUES ('vocab-001', 'vocabulary:danke', 'vocabulary', 'What does "Danke" mean?', 'Thank you', 'Please', '2026-10-11T10:05:00.000Z', 2);
    INSERT INTO review_items (source_type, source_id, prompt, answer, audio_text, due_at, updated_at)
      VALUES ('vocabulary', 'danke', 'What does "Danke" mean?', 'Thank you', 'Danke', '2026-10-12T10:05:00.000Z', '2026-10-11T10:05:00.000Z');
    INSERT INTO checkpoint_attempts (checkpoint_id, total_score, total_possible, section_scores_json, passed, completed_at)
      VALUES ('checkpoint-001', 24, 34, '{"vocabulary":6,"grammar":4,"reading":3,"listening":3,"writing":4,"speaking":4}', 0, '2026-10-11T12:00:00.000Z');
  `);
}

let db: Db;

beforeEach(async () => {
  db = await freshDb();
});

describe("v0.8 indexes", () => {
  it("are created on a fresh database", async () => {
    await db.initialiseDatabase();

    expect(indexNames()).toEqual(["idx_mistakes_open_key", "idx_review_items_due"]);
  });

  it("are added to an existing database without touching any row", async () => {
    createLegacyDatabase();
    const before = {
      tasks: rows(`SELECT * FROM task_progress ORDER BY task_id`),
      state: rows(`SELECT * FROM app_state ORDER BY key`),
      attempts: rows(`SELECT * FROM lesson_attempts`),
      mistakes: rows(`SELECT * FROM mistakes`),
      checkpoints: rows(`SELECT * FROM checkpoint_attempts`),
    };
    const reviewBefore = rows<Record<string, unknown>>(`SELECT * FROM review_items`);

    await db.initialiseDatabase();

    expect(indexNames()).toEqual(["idx_mistakes_open_key", "idx_review_items_due"]);
    expect(rows(`SELECT * FROM task_progress ORDER BY task_id`)).toEqual(before.tasks);
    expect(rows(`SELECT * FROM app_state ORDER BY key`)).toEqual(before.state);
    expect(rows(`SELECT * FROM lesson_attempts`)).toEqual(before.attempts);
    expect(rows(`SELECT * FROM mistakes`)).toEqual(before.mistakes);
    expect(rows(`SELECT * FROM checkpoint_attempts`)).toEqual(before.checkpoints);

    // The review row only gained the nullable exercise_json column.
    const [after] = rows<Record<string, unknown>>(`SELECT * FROM review_items`);
    expect(after).toEqual({ ...reviewBefore[0], exercise_json: null });
  });

  it("is idempotent across repeated starts", async () => {
    createLegacyDatabase();

    await db.initialiseDatabase();
    await db.initialiseDatabase();
    await db.initialiseDatabase();

    expect(indexNames()).toHaveLength(2);
    expect(rows(`SELECT * FROM review_items`)).toHaveLength(1);
    expect(rows<{ name: string }>(`PRAGMA table_info(review_items)`).filter((c) => c.name === "exercise_json")).toHaveLength(1);
  });

  it("keeps legacy rows usable by the app after migration", async () => {
    createLegacyDatabase();
    await db.initialiseDatabase();

    expect(await db.getCompletedTaskIds()).toEqual(["vocab-001", "pronunciation-001"]);
    expect(await db.getStudyMinutes()).toBe(45);
    expect(await db.getWritingDraft("writing-001")).toBe("Ich heiße Anna.");
    expect(await db.getCheckpointAttempts("checkpoint-001")).toHaveLength(1);

    const [mistake] = await db.getMistakes();
    expect(mistake).toMatchObject({ lessonId: "vocab-001", timesMissed: 2, resolved: false });

    // The legacy review row (no exercise_json) is still returned as a legacy card.
    getTestDatabase().prepare(`UPDATE review_items SET due_at = '2000-01-01T00:00:00.000Z'`).run();
    const [due] = await db.getDueReviewItems();
    expect(due).toMatchObject({ sourceId: "danke", exerciseJson: null });
  });

  it("let the due-date and open-mistake queries use an index", async () => {
    await db.initialiseDatabase();

    expect(plan(`SELECT * FROM review_items WHERE due_at <= '2030' ORDER BY due_at ASC LIMIT 20`)).toMatch(
      /USING (COVERING )?INDEX idx_review_items_due/,
    );
    expect(plan(`SELECT COUNT(*) FROM review_items WHERE due_at <= '2030'`)).toMatch(
      /idx_review_items_due/,
    );
    expect(
      plan(`SELECT id FROM mistakes WHERE item_key = 'vocabulary:tisch#article' AND resolved_at IS NULL LIMIT 1`),
    ).toMatch(/idx_mistakes_open_key/);
  });

  it("do not change what the Review and mistake queries return", async () => {
    await db.initialiseDatabase();

    const miss = {
      sourceType: "vocabulary" as const,
      sourceId: "tisch#article",
      category: "vocabulary",
      prompt: "p",
      expected: "der Tisch",
      userAnswer: "die",
      correct: false,
    };

    await db.recordAnswer(miss);
    await db.recordAnswer({ ...miss, userAnswer: "das" });

    expect(rows<{ times_missed: number }>(`SELECT times_missed FROM mistakes`)).toEqual([{ times_missed: 2 }]);

    getTestDatabase().prepare(`UPDATE review_items SET due_at = '2000-01-01T00:00:00.000Z'`).run();
    expect((await db.getReviewStats()).dueToday).toBe(1);
    expect(await db.getDueReviewItems()).toHaveLength(1);
  });
});
