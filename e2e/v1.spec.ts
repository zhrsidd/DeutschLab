import { readFileSync } from "node:fs";

import { expect, test } from "./fixtures";
import { WEEK_3_MASTERED, planSection, seedCompleted } from "./helpers";

test.describe("v1.0 shell (browser, mocked Tauri SQL)", () => {
  for (const width of [760, 1024, 1440]) {
    test(`Today has no horizontal overflow at ${width}px and Activities stay readable`, async ({
      page,
      db,
    }) => {
      seedCompleted(db, WEEK_3_MASTERED);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Today's plan" })).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);

      const activities = await page.getByRole("region", { name: "Activities" }).boundingBox();
      expect(activities?.width ?? 0).toBeGreaterThan(300);
    });
  }

  test("shows the current week and folds mastered weeks in Activities", async ({ page, db }) => {
    seedCompleted(db, WEEK_3_MASTERED);
    await page.goto("/");

    await expect(page.getByText("Unit 1 · October Foundations · Week 4")).toBeVisible();
    await expect(page.getByRole("region", { name: "Week 4 progress" })).toContainText("Current");

    const week1 = page.getByRole("button", { name: /^Week 1 Sounds/ });
    await expect(week1).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("button", { name: /Greetings, countries, school subjects/ })).toHaveCount(0);

    await week1.click();
    await expect(week1).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: /Greetings, countries, school subjects/ })).toBeVisible();

    // The selected activity defaults to the next one to do.
    await expect(page.getByRole("complementary", { name: "Selected activity" })).toContainText(
      "Everyday German in context",
    );
  });

  test("a lesson can be opened from the plan with the keyboard", async ({ page, db }) => {
    seedCompleted(db, WEEK_3_MASTERED);
    await page.goto("/");

    const first = planSection(page).getByRole("button").first();
    await first.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { name: "Everyday German in context" })).toBeVisible();
    await page.getByRole("button", { name: /Back to today/ }).click();
    await expect(page.getByRole("heading", { name: "Today's plan" })).toBeVisible();
  });

  test("Your data exports a complete, versioned JSON backup", async ({ page, db }) => {
    seedCompleted(db, ["vocab-001", "pronunciation-001"]);
    await page.goto("/");

    await page.getByRole("button", { name: "Your data" }).click();
    await expect(page.getByRole("heading", { name: "Your data" })).toBeVisible();
    // Snapshots need the native app.
    await expect(page.getByRole("button", { name: "Save snapshot" })).toBeDisabled();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export backup" }).click();
    const file = await download;

    expect(file.suggestedFilename()).toMatch(/^deutschlab-backup-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);
    const backup = JSON.parse(readFileSync((await file.path())!, "utf8"));
    expect(backup).toMatchObject({ format: "deutschlab-backup", version: 1, app: { name: "DeutschLab" } });
    expect(backup.tables.task_progress.map((row: { task_id: string }) => row.task_id).sort()).toEqual([
      "pronunciation-001",
      "vocab-001",
    ]);
    await expect(page.getByRole("status")).toContainText("Downloaded deutschlab-backup-");

    // Exporting changed nothing.
    expect(db.prepare("SELECT COUNT(*) AS n FROM task_progress").get()).toEqual({ n: 2 });
  });

  test("Unit 1 marks Weeks 5–16 as planned", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Unit 1" }).click();

    await expect(page.getByRole("region", { name: "October" })).toContainText("Available");
    await expect(page.getByRole("region", { name: "November" })).toContainText("Planned");
    await expect(page.getByRole("region", { name: "November" })).not.toContainText("Available");
  });
});
