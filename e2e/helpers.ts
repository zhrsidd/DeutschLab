import type { DatabaseSync } from "node:sqlite";

import type { Page } from "@playwright/test";

export const WEEK_1_IDS = [
  "vocab-001",
  "pronunciation-001",
  "grammar-001",
  "grammar-002",
  "grammar-003",
  "listening-001",
  "speaking-001",
];

export const WEEK_1_MASTERED = [...WEEK_1_IDS, "checkpoint-001"];

export const WEEK_2_INSTRUCTIONAL = [
  "vocab-002",
  "grammar-004",
  "grammar-005",
  "writing-001",
  "reading-001",
  "listening-002",
];

/** Pre-populates progress the way a returning learner's database would be. */
export function seedCompleted(db: DatabaseSync, ids: string[]) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_progress (
      task_id TEXT PRIMARY KEY NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT
    )
  `);

  const insert = db.prepare(
    `INSERT INTO task_progress (task_id, completed, completed_at) VALUES (?, 1, ?)`,
  );

  for (const id of ids) insert.run(id, new Date().toISOString());
}

export const planSection = (page: Page) =>
  page.locator("section", {
    has: page.getByRole("heading", { name: "Today's plan" }),
  });
