import { expect, test } from "./fixtures";
import { WEEK_1_MASTERED, WEEK_2_INSTRUCTIONAL, planSection, seedCompleted } from "./helpers";

const WEEK_2_MASTERED = [...WEEK_1_MASTERED, ...WEEK_2_INSTRUCTIONAL, "checkpoint-002"];
const WEEK_3_THROUGH_GRAMMAR = ["vocab-003", "grammar-006", "grammar-007", "grammar-008"];
const WEEK_3_INSTRUCTIONAL = [
  ...WEEK_3_THROUGH_GRAMMAR, "reading-002", "listening-003", "writing-002",
];

test.describe("Week 3 (browser, mocked Tauri SQL)", () => {
  test("Today offers Week 3 vocabulary once Week 2 is mastered", async ({ page, db }) => {
    seedCompleted(db, WEEK_2_MASTERED);
    await page.goto("/");

    const plan = planSection(page);
    await expect(
      plan.getByRole("button", { name: /School, home and everyday objects/ }),
    ).toContainText("Next lesson");

    await plan.getByRole("button", { name: /School, home and everyday objects/ }).click();

    await expect(
      page.getByRole("heading", { name: "School, home and everyday objects" }),
    ).toBeVisible();
    await expect(page.getByText("Week 3 · Vocabulary")).toBeVisible();
    await expect(
      page.getByText(/Learn German nouns together with their articles/),
    ).toBeVisible();
  });

  test("the first batch shows nouns with article, plural and example", async ({ page, db }) => {
    seedCompleted(db, WEEK_2_MASTERED);
    await page.goto("/");

    await planSection(page)
      .getByRole("button", { name: /School, home and everyday objects/ })
      .click();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await page.getByRole("button", { name: "Start batch" }).click();

    await expect(page.getByText(/Batch 1 of 7/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "der Stift" })).toBeVisible();
    await expect(page.getByText("Plural: die Stifte")).toBeVisible();
    await expect(page.getByText("Der Stift ist neu.")).toBeVisible();

    await page.getByRole("button", { name: "Next word" }).click();
    await expect(page.getByRole("heading", { name: "der Bleistift" })).toBeVisible();
  });

  test("a batch check asks for the article and the plural", async ({ page, db }) => {
    seedCompleted(db, WEEK_2_MASTERED);
    await page.goto("/");

    await planSection(page)
      .getByRole("button", { name: /School, home and everyday objects/ })
      .click();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await page.getByRole("button", { name: "Start batch" }).click();

    for (let i = 0; i < 9; i += 1) {
      await page.getByRole("button", { name: "Next word" }).click();
    }
    await page.getByRole("button", { name: "Quick check" }).click();

    await expect(page.getByText(/School objects · check/)).toBeVisible();

    // Questions: meaning, noun + article, article, plural. Pick the first option each time.
    const optionButtons = page.locator("div.grid > button");

    for (const instruction of [
      "What does this mean?",
      "How do you say this in German?",
      "Choose the correct article.",
      "What is the plural?",
    ]) {
      await expect(page.getByText(instruction)).toBeVisible();
      await optionButtons.first().click();
      await page
        .getByRole("button", { name: /Next question|Next batch/ })
        .click();
    }

    await expect(page.getByText(/Batch 2 of 7/)).toBeVisible();
  });

  test("grammar-006 follows vocab-003 on Today", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, "vocab-003"]);
    await page.goto("/");

    const plan = planSection(page);
    await expect(
      plan.getByRole("button", { name: /School, home and everyday objects/ }),
    ).toHaveCount(0);
    await plan.getByRole("button", { name: /Nouns, articles and plurals/ }).click();

    await expect(
      page.getByRole("heading", { name: "Nouns, articles and plurals" }),
    ).toBeVisible();
    await expect(page.getByText("Week 3 · Grammar")).toBeVisible();

    await page.getByRole("button", { name: "Begin lesson" }).click();
    await expect(page.getByRole("heading", { name: "Every noun has a gender" })).toBeVisible();
    await expect(page.getByText("das Buch")).toBeVisible();
  });

  test("grammar-006 practice grades a typed article answer", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, "vocab-003"]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /Nouns, articles and plurals/ }).click();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start practice" }).click();

    await page.getByRole("button", { name: "feminine" }).click();
    await expect(page.getByText("Correct.")).toBeVisible();
  });

  test("before Week 2 mastery, Today keeps Week 3 out of the plan", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_1_MASTERED, ...WEEK_2_INSTRUCTIONAL]);
    await page.goto("/");

    const plan = planSection(page);
    await expect(plan.getByRole("button", { name: /Week 2 Checkpoint/ })).toBeVisible();
    await expect(
      plan.getByRole("button", { name: /School, home and everyday objects/ }),
    ).toHaveCount(0);
  });

  test("Week 3 is listed in the curriculum and can be opened early", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Week 3", { exact: true })).toBeVisible();

    await page
      .getByRole("button", { name: /Learn useful nouns with their articles and plurals/ })
      .click();
    await page.getByRole("button", { name: "Start lesson" }).click();

    await expect(
      page.getByRole("heading", { name: "School, home and everyday objects" }),
    ).toBeVisible();
  });

  test("grammar-007 follows grammar-006 and teaches the masculine change", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, "vocab-003", "grammar-006"]);
    await page.goto("/");

    const plan = planSection(page);
    await expect(plan.getByRole("button", { name: /Nouns, articles and plurals/ })).toHaveCount(0);
    await plan.getByRole("button", { name: /The accusative case/ }).click();

    await expect(page.getByRole("heading", { name: "The accusative case" })).toBeVisible();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await expect(page.getByRole("heading", { name: "Subject and direct object" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Only masculine changes")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start practice" }).click();

    // A wrong answer shows its explanation and the lesson carries on.
    await page.getByRole("button", { name: "Der Junge" }).click();
    await expect(page.getByText(/The boy \(der Junge\) is the subject/)).toBeVisible();
    await page.getByRole("button", { name: "Next question" }).click();
    await expect(page.getByText(/Ich esse den Apfel/)).toBeVisible();
  });

  test("grammar-008 follows grammar-007 and accepts a typed answer with Enter", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, "vocab-003", "grammar-006", "grammar-007"]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /Negation/ }).click();
    await expect(page.getByRole("heading", { name: "Negation — nicht and kein" })).toBeVisible();

    await page.getByRole("button", { name: "Begin lesson" }).click();
    for (let i = 0; i < 3; i += 1) await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start practice" }).click();

    // Seven choice questions come first; answer them to reach the typed ones.
    for (const answer of ["keine", "kein", "keinen", "nicht", "nicht", "keine", "keine"]) {
      await page.getByRole("button", { name: answer, exact: true }).click();
      await page.getByRole("button", { name: "Next question" }).click();
    }

    await page.getByLabel("Your answer").fill("Das ist kein Buch.");
    await page.getByLabel("Your answer").press("Enter");
    await expect(page.getByText("Correct.")).toBeVisible();
  });

  test("reading-002 follows grammar-008 and shows evidence after an answer", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, ...WEEK_3_THROUGH_GRAMMAR]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /Objects and descriptions/ }).click();
    await expect(page.getByRole("heading", { name: "Objects and descriptions" })).toBeVisible();

    await page.getByRole("button", { name: "Begin lesson" }).click();
    await expect(page.getByText(/Mona hat ein Zimmer/)).toBeVisible();

    await page.getByRole("button", { name: "A computer" }).click();
    await expect(page.getByText("Correct.")).toBeVisible();
    await expect(page.getByText(/“Sie hat keinen Computer\.”/)).toBeVisible();
  });

  test("listening-003 opens with Play and Slower and a hidden transcript", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, ...WEEK_3_THROUGH_GRAMMAR, "reading-002"]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /Objects and possession/ }).click();
    await expect(page.getByRole("heading", { name: "Objects and possession" })).toBeVisible();
    await page.getByRole("button", { name: "Begin lesson" }).click();

    // The browser has no German voice, so the lesson explains it instead of asking questions.
    const play = page.getByRole("button", { name: "Play audio" });
    const noVoice = page.getByText(/Listening needs a German voice/);
    await expect(play.or(noVoice)).toBeVisible();
    await expect(page.getByText("Transcript")).toHaveCount(0);
  });

  test("writing-002 keeps its draft after a reload", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, ...WEEK_3_THROUGH_GRAMMAR, "reading-002", "listening-003"]);
    await page.goto("/");

    await planSection(page).getByRole("button", { name: /My room and belongings/ }).click();
    await page.getByRole("button", { name: "Begin lesson" }).click();
    await expect(page.getByText("Das ist mein Zimmer.")).toBeVisible();
    await page.getByRole("button", { name: "Plan my paragraph" }).click();
    await page.getByRole("button", { name: "Start writing" }).click();

    const box = page.getByLabel("Your paragraph");
    await box.fill("Das ist mein Zimmer. Der Tisch ist groß.");
    await expect(page.getByText("8 words")).toBeVisible();
    await expect(page.getByText("Compare your paragraph")).toHaveCount(0);

    // Wait until the debounced save has reached the database, then reopen the app.
    await expect
      .poll(() => {
        const row = db
          .prepare("SELECT value FROM app_state WHERE key = ?")
          .get("writing_draft:writing-002") as { value: string } | undefined;
        return row?.value;
      })
      .toBe("Das ist mein Zimmer. Der Tisch ist groß.");
    await page.reload();

    await page.getByRole("button", { name: /My room and belongings/ }).first().click();
    await expect(page.getByText(/saved draft \(8 words\)/)).toBeVisible();
  });

  test("checkpoint-003 is offered only after every Week 3 lesson, and warns if opened early", async ({
    page,
    db,
  }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, ...WEEK_3_THROUGH_GRAMMAR, "reading-002", "listening-003"]);
    await page.goto("/");

    await expect(
      planSection(page).getByRole("button", { name: /Week 3 Checkpoint/ }),
    ).toHaveCount(0);

    // Opening it early from the curriculum is allowed, with a warning.
    await page.getByRole("button", { name: /Test your Week 3 vocabulary/ }).click();
    await page.getByRole("button", { name: "Start lesson" }).click();
    await expect(page.getByRole("heading", { name: "Week 3 Checkpoint" })).toBeVisible();
    await expect(page.getByText(/You still have unfinished Week 3 lessons/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Begin checkpoint" })).toBeEnabled();
  });

  test("Today prioritises checkpoint-003 once all Week 3 lessons are done", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, ...WEEK_3_INSTRUCTIONAL]);
    await page.goto("/");

    await expect(page.getByText(/7 of 8 Week 3 activities complete/)).toBeVisible();
    await planSection(page).getByRole("button", { name: /Week 3 Checkpoint/ }).click();

    await expect(page.getByRole("heading", { name: "Week 3 Checkpoint" })).toBeVisible();
    await expect(page.getByText(/unfinished Week 3 lessons/)).toHaveCount(0);
    await expect(page.getByText("Week 3 · Checkpoint")).toBeVisible();
  });

  test("shows Week 3 Mastered and moves on to Week 4 after checkpoint-003", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, ...WEEK_3_INSTRUCTIONAL, "checkpoint-003"]);
    await page.goto("/");

    await expect(page.getByText("Week 3 progress · Mastered")).toBeVisible();
    await expect(page.getByText(/8 of 8 Week 3 activities complete/)).toBeVisible();
    await expect(page.getByText("Week 2 progress · Mastered")).toBeVisible();
    await expect(
      planSection(page).getByRole("button", { name: /Everyday German in context/ }),
    ).toContainText("Next lesson");
  });

  test("Week 3 stays unmastered before checkpoint-003", async ({ page, db }) => {
    seedCompleted(db, [...WEEK_2_MASTERED, ...WEEK_3_INSTRUCTIONAL]);
    await page.goto("/");

    await expect(page.getByText("Week 3 progress", { exact: false })).toBeVisible();
    await expect(page.getByText("Week 3 progress · Mastered")).toHaveCount(0);
  });
});
