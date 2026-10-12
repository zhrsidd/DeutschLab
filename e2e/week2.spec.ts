import type { DatabaseSync } from "node:sqlite";

import { expect, test } from "./fixtures";

const WEEK_1_IDS = [
  "vocab-001",
  "pronunciation-001",
  "grammar-001",
  "grammar-002",
  "grammar-003",
  "listening-001",
  "speaking-001",
];

/** Pre-populates progress the way a returning learner's database would be. */
function seedCompleted(db: DatabaseSync, ids: string[]) {
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

const planSection = (page: import("@playwright/test").Page) =>
  page.locator("section", {
    has: page.getByRole("heading", { name: "Today's plan" }),
  });

test.describe("Week 2 (browser, mocked Tauri SQL)", () => {
  test("Today offers Week 2 vocabulary once Week 1 is mastered", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_IDS, "checkpoint-001"]);
    await page.goto("/");

    await expect(page.getByText(/Mastered/)).toBeVisible();

    const plan = planSection(page);
    await expect(plan.getByRole("button", { name: /Week 2 vocabulary/ })).toBeVisible();
    await expect(plan.getByRole("button", { name: /Week 2 vocabulary/ })).toContainText(
      "Next lesson",
    );

    await plan.getByRole("button", { name: /Week 2 vocabulary/ }).click();

    await expect(page.getByRole("heading", { name: "Week 2 vocabulary" })).toBeVisible();
    await expect(page.getByText("Week 2 · Vocabulary")).toBeVisible();
  });

  test("Week 2 first batch shows nouns with their article and plural", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_IDS, "checkpoint-001"]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /Week 2 vocabulary/ }).click();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await page.getByRole("button", { name: "Start batch" }).click();

    await expect(page.getByText(/Batch 1 of 7/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "die Familie" })).toBeVisible();
    await expect(page.getByText("Plural: die Familien")).toBeVisible();
  });

  test("haben comes next after Week 2 vocabulary", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_IDS, "checkpoint-001", "vocab-002"]);
    await page.goto("/");

    const plan = planSection(page);
    await expect(plan.getByRole("button", { name: /Week 2 vocabulary/ })).toHaveCount(0);
    await plan.getByRole("button", { name: /Learn how to use and conjugate haben/ }).click();

    await expect(page.getByRole("heading", { name: "haben", exact: true })).toBeVisible();
    await expect(page.getByText("Week 2 · Grammar")).toBeVisible();
  });

  test("before Week 1 mastery, Today plans Week 1 work and keeps Week 2 out of the plan", async ({
    page,
    db,
  }) => {
    seedCompleted(db, WEEK_1_IDS.slice(0, 2));
    await page.goto("/");

    const plan = planSection(page);
    await expect(plan.getByRole("button", { name: /Personal pronouns/ })).toBeVisible();
    await expect(plan.getByRole("button", { name: /Week 2 vocabulary/ })).toHaveCount(0);
    await expect(plan.getByRole("button", { name: /haben/ })).toHaveCount(0);
  });

  test("Week 2 is still listed in the curriculum and can be opened early", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Week 2", { exact: true })).toBeVisible();

    await page
      .getByRole("button", { name: /Learn family, daily life, places/ })
      .click();
    await page.getByRole("button", { name: "Start lesson" }).click();

    await expect(page.getByRole("heading", { name: "Week 2 vocabulary" })).toBeVisible();
  });

  test("Week 1 progress and the checkpoint warning ignore Week 2", async ({ page, db }) => {
    seedCompleted(db, WEEK_1_IDS);
    await page.goto("/");

    await expect(page.getByText(/7\s*of\s*8\s*Week 1 activities complete/)).toBeVisible();

    // All seven Week 1 lessons are done, so Today plans the checkpoint (not Week 2).
    const plan = planSection(page);
    await expect(plan.getByRole("button", { name: /Week 2 vocabulary/ })).toHaveCount(0);
    await plan.getByRole("button", { name: /Week 1 Checkpoint/ }).click();

    await expect(page.getByRole("heading", { name: "Week 1 Checkpoint" })).toBeVisible();
    await expect(page.getByText(/unfinished Week 1 lessons/)).toHaveCount(0);
  });
});
