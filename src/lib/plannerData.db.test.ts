// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { starterTasks } from "../data/unit1";
import { getTestDatabase, resetTestDatabase } from "../test/fakeSqlPlugin";

import { generateDailyPlan } from "./dailyPlanner";

vi.mock("@tauri-apps/plugin-sql", async () => import("../test/fakeSqlPlugin"));

type Db = typeof import("./db");
let db: Db;

beforeEach(async () => {
  vi.resetModules();
  resetTestDatabase();
  db = await import("./db");
  await db.initialiseDatabase();
});

const past = () => new Date(Date.now() - 60_000).toISOString();
const future = () => new Date(Date.now() + 5 * 86_400_000).toISOString();

/** Mistakes with and without a due review, as the app would write them. */
function seed(count: number) {
  const sql = getTestDatabase();
  const review = sql.prepare(
    `INSERT INTO review_items (source_type, source_id, prompt, answer, due_at, updated_at) VALUES (?, ?, 'p', 'a', ?, ?)`,
  );
  const mistake = sql.prepare(
    `INSERT INTO mistakes (lesson_id, item_key, category, prompt, expected_answer, user_answer, created_at, times_missed, resolved_at)
     VALUES (?, ?, 'c', ?, 'e', 'u', ?, ?, ?)`,
  );
  const lessons = ["vocab-001", "grammar-009", "vocab-004", "grammar-007"];

  sql.exec("BEGIN");
  for (let i = 0; i < count; i += 1) {
    const type = i % 2 ? "grammar" : "vocabulary";
    review.run(type, `k${i}`, i % 3 === 0 ? past() : future(), past());
    mistake.run(lessons[i % 4], `${type}:k${i}`, `prompt ${i}`, past(), 1 + (i % 7), i % 11 === 0 ? past() : null);
  }
  sql.exec("COMMIT");
}

/** What getPlannerData returned before v1.0: every due key and every mistake. */
function unbounded() {
  const sql = getTestDatabase();
  const dueReviewKeys = (
    sql.prepare(`SELECT source_type, source_id FROM review_items WHERE due_at <= ?`).all(
      new Date(Date.now() + 86_400_000).toISOString(),
    ) as { source_type: string; source_id: string }[]
  ).map((row) => `${row.source_type}:${row.source_id}`);
  const unresolvedMistakes = (
    sql.prepare(`SELECT id, lesson_id, item_key, prompt, times_missed FROM mistakes WHERE resolved_at IS NULL`).all() as {
      id: number; lesson_id: string; item_key: string; prompt: string; times_missed: number;
    }[]
  ).map((row) => ({ id: row.id, lessonId: row.lesson_id, itemKey: row.item_key, prompt: row.prompt, timesMissed: row.times_missed }));
  return { dueReviewKeys, unresolvedMistakes };
}

describe("bounded planner data", () => {
  it("produces exactly the same plan as the old unbounded data", async () => {
    seed(3000);
    const bounded = await db.getPlannerData();
    const old = unbounded();

    for (const completed of [[], ["vocab-001"], starterTasks.slice(0, 20).map((t) => t.id)]) {
      for (const dismissed of [[], [bounded.unresolvedMistakes[0]?.id ?? -1]]) {
        const input = {
          tasks: starterTasks,
          completedTaskIds: completed,
          dueReviewCount: bounded.dueReviewCount,
          dismissedMistakeIds: dismissed,
          attemptedCheckpointIds: [],
          budgetMinutes: 30,
        };
        expect(generateDailyPlan({ ...input, ...bounded })).toEqual(generateDailyPlan({ ...input, ...old }));
      }
    }
  });

  it("returns at most PLANNER_MISTAKE_LIMIT candidates, none with a due review, strongest first", async () => {
    seed(3000);
    const { unresolvedMistakes } = await db.getPlannerData();

    expect(unresolvedMistakes.length).toBe(db.PLANNER_MISTAKE_LIMIT);
    const missed = unresolvedMistakes.map((m) => m.timesMissed);
    expect([...missed].sort((a, b) => b - a)).toEqual(missed);
    // k0, k3, k6 … have a due review.
    for (const mistake of unresolvedMistakes) {
      expect(Number(mistake.itemKey.split(":k")[1]) % 3, mistake.itemKey).not.toBe(0);
    }
  });

  it("looks up review items by their unique key, not with a scan", () => {
    const plan = getTestDatabase()
      .prepare(
        `EXPLAIN QUERY PLAN
         SELECT m.id FROM mistakes m WHERE m.resolved_at IS NULL AND NOT EXISTS (
           SELECT 1 FROM review_items r
           WHERE r.source_type = substr(m.item_key, 1, instr(m.item_key, ':') - 1)
             AND r.source_id = substr(m.item_key, instr(m.item_key, ':') + 1)
             AND r.due_at <= ?)
         ORDER BY m.times_missed DESC, m.id DESC LIMIT 200`,
      )
      .all(past()) as { detail: string }[];

    expect(plan.map((row) => row.detail).join(" | ")).toMatch(/SEARCH r USING INDEX sqlite_autoindex_review_items_1/);
  });
});

describe("Review mistakes list", () => {
  it("returns unresolved, most-missed mistakes first, capped at MISTAKE_LIST_LIMIT", async () => {
    seed(400);
    const rows = await db.getMistakes();

    expect(rows).toHaveLength(db.MISTAKE_LIST_LIMIT);
    expect(rows.every((row) => !row.resolved)).toBe(true);
    const missed = rows.map((row) => row.timesMissed);
    expect([...missed].sort((a, b) => b - a)).toEqual(missed);
  });

  it("returns everything when there are few mistakes", async () => {
    seed(30);
    const rows = await db.getMistakes();

    expect(rows).toHaveLength(30);
    expect(rows[rows.length - 1]?.resolved).toBe(true);
  });
});
