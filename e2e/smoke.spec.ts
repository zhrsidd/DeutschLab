import { expect, test } from "./fixtures";

test.describe("DeutschLab smoke tests (browser, mocked Tauri SQL)", () => {
  test("app opens and Today renders with a generated plan", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Guten Morgen." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today's plan" })).toBeVisible();
    await expect(page.getByText("Study time today")).toBeVisible();

    // A fresh database plans the first curriculum lessons.
    await expect(
      page.getByRole("button", { name: /First vocabulary/ }).first(),
    ).toBeVisible();
  });

  test("changing the study-time budget updates the plan and is remembered", async ({
    page,
    db,
  }) => {
    await page.goto("/");

    const fifteen = page.getByRole("button", { name: "15 min", exact: true });
    const sixty = page.getByRole("button", { name: "60 min", exact: true });

    await expect(page.getByRole("button", { name: "30 min", exact: true })).toHaveClass(
      /bg-neutral-900/,
    );

    await fifteen.click();
    await expect(fifteen).toHaveClass(/bg-neutral-900/);
    await expect(page.getByText(/of 15 min/)).toBeVisible();

    await sixty.click();
    await expect(page.getByText(/of 60 min/)).toBeVisible();

    // Persisted in app_state, and restored after a reload.
    const saved = db
      .prepare(`SELECT value FROM app_state WHERE key = 'study_minutes'`)
      .get() as { value: string };
    expect(saved.value).toBe("60");

    await page.reload();
    await expect(page.getByRole("button", { name: "60 min", exact: true })).toHaveClass(
      /bg-neutral-900/,
    );
  });

  test("opens a lesson from the plan and navigates back", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /First vocabulary/ }).first().click();

    await expect(page.getByRole("heading", { name: "Week 1 vocabulary" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Begin lesson" })).toBeVisible();

    await page.getByRole("button", { name: /Back to today/ }).click();

    await expect(page.getByRole("heading", { name: "Today's plan" })).toBeVisible();
  });

  test("starts a vocabulary lesson and reaches the first learn card", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /First vocabulary/ }).first().click();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await page.getByRole("button", { name: "Start batch" }).click();

    await expect(page.getByText("Batch 1 of 9")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hallo" })).toBeVisible();
  });

  test("Review opens from the sidebar and shows the empty state", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /^Review/ }).click();

    await expect(page.getByRole("heading", { name: "Review", exact: true })).toBeVisible();
    await expect(page.getByText(/Nothing to review yet/)).toBeVisible();
    await expect(page.getByText("No mistakes recorded yet.")).toBeVisible();
  });

  test("the Week 1 checkpoint opens with its early-access warning", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Week 1 Checkpoint/ }).first().click();
    await page.getByRole("button", { name: "Start lesson" }).click();

    await expect(
      page.getByRole("heading", { name: "Week 1 Checkpoint" }),
    ).toBeVisible();
    await expect(page.getByText(/You still have unfinished Week 1 lessons/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Begin checkpoint" })).toBeVisible();
  });

  test("the Unit 1 curriculum view renders", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Unit 1/ }).click();

    await expect(page.getByRole("heading", { name: /Unit 1/ })).toBeVisible();
  });
});
