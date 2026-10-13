import { expect, test } from "./fixtures";
import {
  WEEK_1_IDS,
  goTo,
  openWeek,
  seedCompleted,
} from "./helpers";

const planSection = (page: import("@playwright/test").Page) =>
  page.locator("section", {
    has: page.getByRole("heading", { name: "Today's plan" }),
  });

test.describe("Week 2 (browser, mocked Tauri SQL)", () => {
  test("Today offers Week 2 vocabulary once Week 1 is mastered", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_IDS, "checkpoint-001"]);
    await page.goto("/");
    await goTo(page, "Course");

    await expect(page.getByRole("region", { name: "Week 1 progress" })).toContainText("Mastered");
    await goTo(page, "Home");

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
    await openWeek(page, 2);

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
    await goTo(page, "Course");

    await expect(page.getByRole("region", { name: "Week 1 progress" })).toContainText("7 of 8 activities complete");
    await goTo(page, "Home");

    // All seven Week 1 lessons are done, so Today plans the checkpoint (not Week 2).
    const plan = planSection(page);
    await expect(plan.getByRole("button", { name: /Week 2 vocabulary/ })).toHaveCount(0);
    await plan.getByRole("button", { name: /Week 1 Checkpoint/ }).click();

    await expect(page.getByRole("heading", { name: "Week 1 Checkpoint" })).toBeVisible();
    await expect(page.getByText(/unfinished Week 1 lessons/)).toHaveCount(0);
  });
});
