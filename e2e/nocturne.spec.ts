import { expect, test } from "./fixtures";
import { GREETING, WEEK_3_MASTERED, goTo, seedCompleted } from "./helpers";

/*
 * The Nocturne shell (DESIGN.md): dark from the first paint, an opening
 * that never delays the app, navigation state and reduced motion.
 */
test.describe("Nocturne shell (browser, mocked Tauri SQL)", () => {
  test("paints obsidian before the app renders, with no white flash", async ({ page }) => {
    // Block the app's script and stylesheet: only index.html's inline CSS applies.
    await page.route(/\/assets\/index-.*\.(js|css)$/, (route) => route.abort());
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe("rgb(9, 8, 13)");
  });

  test("the opening reveals Home as soon as the database is ready, then leaves", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: GREETING })).toBeVisible();
    await expect(page.getByTestId("intro")).toHaveCount(0);
    // No fabricated loading percentages anywhere.
    await expect(page.locator("body")).not.toContainText(/\d+\s?%\s*(loaded|loading)/i);
  });

  test("the opening does not replay when navigating between sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("intro")).toHaveCount(0);

    for (const view of ["Course", "Practice", "Review", "Progress", "Settings", "Home"] as const) {
      await goTo(page, view);
      await expect(page.getByTestId("intro")).toHaveCount(0);
    }
  });

  test("navigation marks exactly one active destination", async ({ page, db }) => {
    seedCompleted(db, WEEK_3_MASTERED);
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });

    await goTo(page, "Progress");
    await expect(nav.getByRole("button", { name: /^Progress/ })).toHaveAttribute("aria-current", "page");
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(page.getByTestId("nav-indicator")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Your learning, measured" })).toBeVisible();
  });

  test("keyboard: Tab reaches the navigation with a visible focus ring", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("intro")).toHaveCount(0);

    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveText(/Home/);
    const outline = await focused.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).toBe("solid");
  });

  test("reduced motion: the app opens immediately and everything is readable", async ({ page, db }) => {
    seedCompleted(db, WEEK_3_MASTERED);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: GREETING })).toBeVisible();
    await expect(page.getByTestId("intro")).toHaveCount(0);

    // Entrance animations resolve at once, so content is fully opaque.
    const opacity = await page
      .getByRole("button", { name: /Everyday German in context/ })
      .evaluate((element) => getComputedStyle(element.closest("main") ?? element).opacity);
    expect(opacity).toBe("1");
  });
});
