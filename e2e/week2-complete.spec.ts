import { expect, test } from "./fixtures";
import {
  WEEK_1_MASTERED,
  WEEK_2_INSTRUCTIONAL,
  planSection,
  seedCompleted,
} from "./helpers";

test.describe("Finishing Week 2 (browser, mocked Tauri SQL)", () => {
  test("Today progresses from haben to common verbs", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_MASTERED, "vocab-002", "grammar-004"]);
    await page.goto("/");

    const plan = planSection(page);
    await expect(
      plan.getByRole("button", { name: /Common present-tense verbs/ }),
    ).toContainText("Next lesson");

    await plan.getByRole("button", { name: /Common present-tense verbs/ }).click();

    await expect(
      page.getByRole("heading", { name: "Common present-tense verbs" }),
    ).toBeVisible();
    await expect(page.getByText("Week 2 · Grammar")).toBeVisible();

    await page.getByRole("button", { name: "Begin lesson" }).click();
    await expect(page.getByText("arbeitest", { exact: true })).toBeVisible();
  });

  test("the daily plan follows the Week 2 order one task at a time", async ({ page, db }) => {
    // 15-minute budget: one item at a time, so the order is visible.
    db.exec(`CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`);
    db.prepare(`INSERT INTO app_state (key, value) VALUES ('study_minutes', '15')`).run();
    seedCompleted(db, [...WEEK_1_MASTERED, "vocab-002", "grammar-004", "grammar-005"]);

    await page.goto("/");

    await expect(
      planSection(page).getByRole("button", { name: /My daily life/ }),
    ).toBeVisible();
    await expect(planSection(page).getByRole("button", { name: /Week 2 reading/ })).toHaveCount(0);
  });

  test("writing-001 opens with sentence frames and a planning step", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_MASTERED, "vocab-002", "grammar-004", "grammar-005"]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /My daily life/ }).click();

    await expect(page.getByRole("heading", { name: "My daily life" })).toBeVisible();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await expect(page.getByText("Ich wohne in ...")).toBeVisible();

    await page.getByRole("button", { name: "Plan my paragraph" }).click();
    await page.getByRole("button", { name: "Start writing" }).click();

    await expect(page.getByLabel("Your paragraph")).toBeVisible();
    await expect(page.getByText("0 words", { exact: true })).toBeVisible();
    // No model paragraph before submission.
    await expect(page.getByText(/Compare your paragraph/)).toHaveCount(0);
  });

  test("a writing draft survives a reload through the mocked database", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_MASTERED, "vocab-002", "grammar-004", "grammar-005"]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /My daily life/ }).click();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await page.getByRole("button", { name: "Plan my paragraph" }).click();
    await page.getByRole("button", { name: "Start writing" }).click();

    const draft = "Ich heiße Anna. Ich wohne in Doha. Ich lerne Deutsch.";
    await page.getByLabel("Your paragraph").fill(draft);
    await expect(page.getByText("10 words", { exact: true })).toBeVisible();

    // The draft is written to SQLite (app_state) shortly after typing.
    await expect
      .poll(() => {
        const row = db
          .prepare(`SELECT value FROM app_state WHERE key = 'writing_draft:writing-001'`)
          .get() as { value: string } | undefined;
        return row?.value;
      })
      .toBe(draft);

    await page.reload();

    await planSection(page).getByRole("button", { name: /My daily life/ }).click();
    await expect(page.getByText(/saved draft \(10 words\)/)).toBeVisible();

    await page.getByRole("button", { name: "Begin lesson" }).click();
    await page.getByRole("button", { name: "Plan my paragraph" }).click();
    await page.getByRole("button", { name: "Start writing" }).click();

    await expect(page.getByLabel("Your paragraph")).toHaveValue(draft);
  });

  test("reading-001 opens with the first text and its questions", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_MASTERED, "vocab-002", "grammar-004", "grammar-005", "writing-001"]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /Week 2 reading/ }).click();

    await expect(page.getByRole("heading", { name: "Week 2 reading" })).toBeVisible();
    await page.getByRole("button", { name: "Begin lesson" }).click();

    await expect(page.getByText(/Hallo! Ich heiße Mona/)).toBeVisible();
    await page.getByRole("button", { name: "Teacher" }).click();
    await expect(page.getByText("Correct.")).toBeVisible();
  });

  test("listening-002 opens, and explains a missing German voice instead of failing the learner", async ({
    page,
    db,
  }) => {
    seedCompleted(db, [
      ...WEEK_1_MASTERED,
      "vocab-002",
      "grammar-004",
      "grammar-005",
      "writing-001",
      "reading-001",
    ]);
    // Make the no-voice path deterministic: a real browser may expose voices.
    await page.addInitScript(() => {
      window.speechSynthesis.getVoices = () => [];
    });
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /Week 2 listening/ }).click();
    await expect(page.getByRole("heading", { name: "Week 2 listening" })).toBeVisible();

    await expect(page.getByText(/Listening needs a German voice/)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: "Begin lesson" })).toHaveCount(0);
    await expect(page.getByText("Not quite.")).toHaveCount(0);
  });

  test("checkpoint-002 warns when opened early but does not lock", async ({ page, db }) => {
    seedCompleted(db, WEEK_1_MASTERED);
    await page.goto("/");

    // Not in Today's plan yet...
    await expect(planSection(page).getByRole("button", { name: /Week 2 Checkpoint/ })).toHaveCount(0);

    // ...but listed in the curriculum, and openable.
    await page.getByRole("button", { name: /Test your Week 2 vocabulary, grammar/ }).click();
    await page.getByRole("button", { name: "Start lesson" }).click();

    await expect(page.getByRole("heading", { name: "Week 2 Checkpoint" })).toBeVisible();
    await expect(page.getByText(/You still have unfinished Week 2 lessons/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Begin checkpoint" })).toBeEnabled();
    await expect(page.getByText("32", { exact: true })).toBeVisible();
  });

  test("checkpoint-002 becomes the next item once the six Week 2 tasks are done", async ({
    page,
    db,
  }) => {
    seedCompleted(db, [...WEEK_1_MASTERED, ...WEEK_2_INSTRUCTIONAL]);
    await page.goto("/");

    const plan = planSection(page);
    await expect(plan.getByRole("button", { name: /Week 2 Checkpoint/ })).toBeVisible();

    await plan.getByRole("button", { name: /Week 2 Checkpoint/ }).click();

    await expect(page.getByRole("heading", { name: "Week 2 Checkpoint" })).toBeVisible();
    await expect(page.getByText(/unfinished Week 2 lessons/)).toHaveCount(0);
  });

  test("shows the Week 2 Mastered state after checkpoint-002 is complete", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_MASTERED, ...WEEK_2_INSTRUCTIONAL, "checkpoint-002"]);
    await page.goto("/");

    await expect(page.getByText("Week 1 progress · Mastered")).toBeVisible();
    await expect(page.getByText("Week 2 progress · Mastered")).toBeVisible();
    await expect(page.getByText(/7 of 7 Week 2 activities complete/)).toBeVisible();
    await expect(planSection(page).getByText("You're done for today.")).toBeVisible();
  });

  test("Week 2 is not marked mastered before checkpoint-002", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_MASTERED, ...WEEK_2_INSTRUCTIONAL]);
    await page.goto("/");

    await expect(page.getByText("Week 2 progress")).toBeVisible();
    await expect(page.getByText("Week 2 progress · Mastered")).toHaveCount(0);
  });
});
