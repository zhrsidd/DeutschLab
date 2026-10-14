import type { DatabaseSync } from "node:sqlite";

import { expect, test } from "./fixtures";
import {
  WEEK_3_MASTERED,
  WEEK_4_INSTRUCTIONAL,
  goTo,
  openWeek,
  planSection,
  seedCompleted,
} from "./helpers";

/** A due review item, shaped like a row written by an older app version. */
function seedDueReview(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS review_items (
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
    )
  `);
  db.prepare(
    `INSERT INTO review_items (source_type, source_id, prompt, answer, due_at, updated_at)
     VALUES ('grammar', 'pr-c-mich', 'p', 'mich', ?, ?)`,
  ).run(new Date(Date.now() - 60_000).toISOString(), new Date().toISOString());
}

test.describe("Week 4 (browser, mocked Tauri SQL)", () => {
  test("Today offers Week 4 vocabulary once Week 3 is mastered", async ({ page, db }) => {
    seedCompleted(db, WEEK_3_MASTERED);
    await page.goto("/");

    const next = planSection(page).getByRole("button", { name: /Everyday German in context/ });
    await expect(next).toContainText("Next lesson");
    await next.click();

    await expect(page.getByRole("heading", { name: "Everyday German in context" })).toBeVisible();
    await expect(page.getByText("Week 4 · Vocabulary")).toBeVisible();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await page.getByRole("button", { name: "Start batch" }).click();

    await expect(page.getByText(/Batch 1 of 9/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "sehen" })).toBeVisible();
    await expect(page.getByText(/du siehst, er\/sie\/es sieht/)).toBeVisible();
  });

  test("grammar-009 teaches the accusative pronoun table", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_3_MASTERED, "vocab-004"]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /Accusative pronouns/ }).click();
    await expect(page.getByText("Week 4 · Grammar")).toBeVisible();
    await expect(page.getByText("13/16", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Begin lesson" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "The accusative pronouns" })).toBeVisible();
    await expect(page.getByText("euch", { exact: true })).toBeVisible();
  });

  test("writing-003 keeps its draft after a reload", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_3_MASTERED, ...WEEK_4_INSTRUCTIONAL.slice(0, 5)]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /Describing everyday life/ }).click();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await page.getByRole("button", { name: "Plan my paragraph" }).click();
    await page.getByRole("button", { name: "Start writing" }).click();

    await page.getByLabel("Your paragraph").fill("Ich heiße Omar. Ich fahre Fahrrad.");
    await expect
      .poll(() => {
        const row = db
          .prepare("SELECT value FROM app_state WHERE key = ?")
          .get("writing_draft:writing-003") as { value: string } | undefined;
        return row?.value;
      })
      .toBe("Ich heiße Omar. Ich fahre Fahrrad.");

    await page.reload();
    await page.getByRole("button", { name: /Describing everyday life/ }).first().click();
    await expect(page.getByText(/saved draft \(6 words\)/)).toBeVisible();
  });

  test("speaking-002 opens as a 2–3 minute guided talk", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_3_MASTERED, ...WEEK_4_INSTRUCTIONAL.slice(0, 6)]);
    await page.goto("/");

    await planSection(page)
      .getByRole("button", { name: /Introducing myself and my daily life/ })
      .click();
    await expect(page.getByText("Week 4 · Speaking")).toBeVisible();
    await expect(page.getByText("2–3 min", { exact: true })).toBeVisible();
  });

  test("checkpoint-004 waits for every Week 4 lesson and warns if opened early", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_3_MASTERED, ...WEEK_4_INSTRUCTIONAL.slice(0, 6)]);
    await page.goto("/");

    await expect(
      planSection(page).getByRole("button", { name: /October Foundations Checkpoint/ }),
    ).toHaveCount(0);

    await openWeek(page, 4);
    await page.getByRole("button", { name: /The Week 4 mastery check and October assessment/ }).click();
    await page.getByRole("button", { name: "Start lesson" }).click();
    await expect(page.getByRole("heading", { name: "October Foundations Checkpoint" })).toBeVisible();
    await expect(page.getByText(/You still have unfinished Week 4 lessons/)).toBeVisible();
    await expect(page.getByText(/80% overall \(32\/39\)/)).toBeVisible();
  });

  test("Today prioritises checkpoint-004 once all Week 4 lessons are done", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_3_MASTERED, ...WEEK_4_INSTRUCTIONAL]);
    await page.goto("/");
    await goTo(page, "Course");

    await expect(page.getByRole("region", { name: "Week 4 progress" })).toContainText("7 of 8 activities complete");
    await goTo(page, "Home");
    await planSection(page).getByRole("button", { name: /October Foundations Checkpoint/ }).click();
    await expect(page.getByText("Week 4 · Checkpoint")).toBeVisible();
    await expect(page.getByText(/unfinished Week 4 lessons/)).toHaveCount(0);
  });

  test("after checkpoint-004: Week 4 completed, October complete, reviews still offered", async ({
    page,
    db,
  }) => {
    seedCompleted(db, [...WEEK_3_MASTERED, ...WEEK_4_INSTRUCTIONAL, "checkpoint-004"]);
    seedDueReview(db);
    await page.goto("/");
    await goTo(page, "Course");

    await expect(page.getByRole("region", { name: "Week 4 progress" })).toContainText("Completed");
    await goTo(page, "Home");
    await expect(page.getByText(/October Foundations complete/).first()).toBeVisible();

    const review = planSection(page).getByRole("button", { name: /1 review due/ });
    await expect(review).toBeVisible();
    await expect(planSection(page).getByRole("button", { name: /Week 5|Modal/ })).toHaveCount(0);
  });
});
