import { expect, test } from "./fixtures";
import { goTo } from "./helpers";

/*
 * AI v1.1 in the browser build: there is no native layer, so AI must be
 * clearly unavailable while every existing feature keeps working. (The
 * fixture throws on any unmocked Tauri command, so a stray AI call would
 * fail these tests.)
 */
test.describe("AI features without the native app", () => {
  test("Settings shows the AI section, off and unavailable, and AI tables exist", async ({ page, db }) => {
    await page.goto("/");
    await goTo(page, "Settings");

    await expect(page.getByRole("heading", { name: "AI feedback" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Optional AI feedback" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Optional AI feedback" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText("Usage information is approximate. Check Google AI Studio for authoritative limits.", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Gemini API key")).toHaveCount(0);

    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'ai_%' ORDER BY name`)
      .all()
      .map((row) => (row as { name: string }).name);
    expect(tables).toEqual(["ai_assessments", "ai_tutor_sessions", "ai_usage"]);
  });

  test("Practice offers the tutor and explains it needs the app", async ({ page }) => {
    await page.goto("/");
    await goTo(page, "Practice");

    await page.getByRole("button", { name: "Open the tutor" }).click();
    await expect(page.getByRole("heading", { name: "Deutsch mit KI" })).toBeVisible();
    await expect(page.getByText("AI feedback is available in the DeutschLab app.")).toBeVisible();

    await page.getByRole("button", { name: "Back to Practice" }).click();
    await expect(page.getByRole("heading", { name: "Practise by skill" })).toBeVisible();
  });
});
