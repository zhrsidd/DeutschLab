import { expect, test } from "./fixtures";
import { WEEK_1_MASTERED, WEEK_2_INSTRUCTIONAL, planSection, seedCompleted } from "./helpers";

const WEEK_2_MASTERED = [...WEEK_1_MASTERED, ...WEEK_2_INSTRUCTIONAL, "checkpoint-002"];

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

  test("Today has nothing more to plan once grammar-008 is done", async ({ page, db }) => {
    seedCompleted(db, [
      ...WEEK_2_MASTERED, "vocab-003", "grammar-006", "grammar-007", "grammar-008",
    ]);
    await page.goto("/");

    await expect(planSection(page).getByText("You're done for today.")).toBeVisible();
  });
});
