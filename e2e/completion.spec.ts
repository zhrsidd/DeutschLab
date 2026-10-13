import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { WEEK_1_MASTERED, goTo, planSection, seedCompleted } from "./helpers";

/*
 * Completion moments appear only after the completion is saved, and only
 * the first time (DESIGN.md §13). writing-001 is short enough to finish in
 * a browser test: plan, write, self-check, finish.
 */
const BEFORE_WRITING = [...WEEK_1_MASTERED, "vocab-002", "grammar-004", "grammar-005"];

async function finishWriting(page: Page) {
  await page.getByRole("button", { name: "Begin lesson" }).click();
  await page.getByRole("button", { name: "Plan my paragraph" }).click();
  await page.getByRole("button", { name: "Start writing" }).click();
  await page.getByLabel("Your paragraph").fill("Ich heiße Anna. Ich wohne in Berlin. Ich lerne Deutsch.");
  await page.getByRole("button", { name: /Submit writing/ }).click();
  for (const box of await page.getByRole("checkbox").all()) await box.click();
  await page.getByRole("button", { name: /See results/ }).click();
  await page.getByRole("button", { name: "Finish lesson" }).click();
}

test.describe("Completion moments (browser, mocked Tauri SQL)", () => {
  test("a first completion is celebrated after it is saved, and never replayed", async ({ page, db }) => {
    seedCompleted(db, BEFORE_WRITING);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /My daily life/ }).click();
    await finishWriting(page);

    const moment = page.getByTestId("celebration-lesson");
    await expect(moment).toBeVisible();
    await expect(moment).toContainText("My daily life complete. Week 2: 4 of 7 activities.");
    // Already persisted when the moment is shown.
    expect(db.prepare("SELECT completed FROM task_progress WHERE task_id = 'writing-001'").get()).toEqual({
      completed: 1,
    });
    // It leaves on its own and never blocks the plan for long.
    await expect(moment).toHaveCount(0, { timeout: 4000 });
    await expect(page.getByRole("heading", { name: "Today's plan" })).toBeVisible();

    // Finishing the same lesson again does not replay it.
    await goTo(page, "Course");
    await page.getByRole("button", { name: /My daily life/ }).first().click();
    await page.getByRole("button", { name: "Review lesson" }).click();
    await finishWriting(page);
    await expect(page.getByRole("heading", { name: "Today's plan" })).toBeVisible();
    await expect(page.getByTestId("celebration-lesson")).toHaveCount(0);
  });

  test("nothing is celebrated when the completion cannot be saved", async ({ page, db }) => {
    seedCompleted(db, BEFORE_WRITING);
    await page.goto("/");
    await planSection(page).getByRole("button", { name: /My daily life/ }).click();

    // Make the completion write fail: task_progress becomes a read-only view.
    db.exec(`
      ALTER TABLE task_progress RENAME TO task_progress_saved;
      CREATE VIEW task_progress AS SELECT * FROM task_progress_saved;
    `);
    await finishWriting(page);

    await expect(page.getByText(/could not mark the lesson as complete/)).toBeVisible();
    await expect(page.getByTestId("celebration-lesson")).toHaveCount(0);
  });
});
