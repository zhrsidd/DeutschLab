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

export const WEEK_2_MASTERED = [...WEEK_1_MASTERED, ...WEEK_2_INSTRUCTIONAL, "checkpoint-002"];

export const WEEK_3_MASTERED = [
  ...WEEK_2_MASTERED,
  "vocab-003",
  "grammar-006",
  "grammar-007",
  "grammar-008",
  "reading-002",
  "listening-003",
  "writing-002",
  "checkpoint-003",
];

export const WEEK_4_INSTRUCTIONAL = [
  "vocab-004",
  "grammar-009",
  "grammar-010",
  "reading-003",
  "listening-004",
  "writing-003",
  "speaking-002",
];

/** Opens one of the six main destinations from the shell navigation. */
export const goTo = (
  page: Page,
  view: "Home" | "Course" | "Practice" | "Review" | "Progress" | "Settings",
) =>
  page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: new RegExp(`^${view}`) })
    .click();

/** The greeting depends on the local time of day. */
export const GREETING = /^Guten (Morgen|Tag|Abend)\.$/;

/** Opens Course and expands a week (only the current week starts open). */
export async function openWeek(page: Page, week: number) {
  await goTo(page, "Course");
  const toggle = page.getByRole("button", { name: new RegExp(`^Week ${week} `) }).first();
  if ((await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
}
