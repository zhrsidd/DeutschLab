import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../../test/fakeSqlPlugin";
import { assessmentJson, createFakeAI, providerResult, type FakeAI } from "../../test/fakeAI";

vi.mock("@tauri-apps/plugin-sql", async () => import("../../test/fakeSqlPlugin"));

const holder = vi.hoisted(() => ({ ai: null as unknown as FakeAI }));
vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => holder.ai.isTauri,
  invoke: (...args: unknown[]) => holder.ai.invoke(...args),
}));

import { initialiseDatabase } from "../../lib/db";
import { updateAISettings } from "../../lib/ai/settings";

import AIWritingExaminer from "./AIWritingExaminer";

const TASK = { prompt: "Write about your family.", targetWords: { min: 40, max: 60 }, cues: ["family"], checklist: ["I used haben"] };
const TEXT = "Ich habe ein Bruder. Er heißt Ali. Ich habe auch eine Schwester.";

const rows = (sql: string) => getTestDatabase().prepare(sql).all();

function renderExaminer(text = TEXT, onOpenLesson = vi.fn()) {
  const user = userEvent.setup({ delay: null });
  const view = render(<AIWritingExaminer taskId="writing-003" task={TASK} text={text} onOpenLesson={onOpenLesson} />);
  return { user, onOpenLesson, ...view };
}

beforeEach(async () => {
  resetTestDatabase();
  holder.ai = createFakeAI();
  await initialiseDatabase();
});

describe("AIWritingExaminer", () => {
  it("is a quiet note outside the native app (lessons stay offline-first)", async () => {
    holder.ai.isTauri = false;
    renderExaminer();
    expect(await screen.findByText("AI feedback is available in the DeutschLab app.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Assess with AI/ })).not.toBeInTheDocument();
    expect(holder.ai.invoke).not.toHaveBeenCalled();
  });

  it("explains how to turn it on when disabled", async () => {
    renderExaminer();
    expect(await screen.findByText(/Optional AI feedback is off/)).toBeInTheDocument();
  });

  it("asks for consent first, then shows structured, advisory feedback and saves it", async () => {
    await updateAISettings({ enabled: true });
    // grammar-007 is a Week 3 lesson: out of scope for this Week 1 learner.
    holder.ai.generate.mockResolvedValue(providerResult(assessmentJson({ recommended_lessons: ["grammar-002", "grammar-007"] })));
    const { user, onOpenLesson } = renderExaminer();

    await user.click(await screen.findByRole("button", { name: "Assess with AI" }));
    expect(screen.getByRole("region", { name: "Before you send" })).toHaveTextContent(/may use submitted content to improve its products/);
    expect(holder.ai.generate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "I understand, continue" }));

    const feedback = await screen.findByRole("region", { name: "AI feedback" });
    expect(feedback).toHaveTextContent("13 / 20");
    expect(feedback).toHaveTextContent(/not a CEFR grade/);
    expect(feedback).toHaveTextContent("einen Bruder");
    expect(feedback).toHaveTextContent(/After haben, use the accusative/);
    expect(feedback).toHaveTextContent("Error");

    // The request went to the configured model with the rubric schema.
    const request = holder.ai.generate.mock.calls[0][0];
    expect(request.model).toBe("gemini-3.8-flash");
    expect(request.responseSchema.properties.scores).toBeDefined();
    expect(request.turns[0].text).toContain(`<learner_text>\n${TEXT}\n</learner_text>`);
    expect(request.turns[0].text).toMatch(/working on Week 1/);

    expect(feedback).toHaveTextContent(/not part of your course so far was removed/);
    await user.click(screen.getByRole("button", { name: /Regular verbs/ }));
    expect(onOpenLesson).toHaveBeenCalledWith("grammar-002");

    expect(rows("SELECT task_id, score, max_score, input_source FROM ai_assessments")).toEqual([
      { task_id: "writing-003", score: 13, max_score: 20, input_source: "typed" },
    ]);
    // Advisory only: no lesson attempt, completion, mistake or review item.
    for (const table of ["lesson_attempts", "task_progress", "mistakes", "review_items", "checkpoint_attempts"]) {
      expect(rows(`SELECT * FROM ${table}`), table).toEqual([]);
    }
  });

  it("links a reassessment of a revised draft to the earlier feedback", async () => {
    await updateAISettings({ enabled: true, consentedAt: new Date().toISOString() });
    holder.ai.generate.mockResolvedValue(providerResult(assessmentJson()));
    const { user, rerender } = renderExaminer();

    await user.click(await screen.findByRole("button", { name: "Assess with AI" }));
    await screen.findByRole("region", { name: "AI feedback" });

    const revised = "Ich habe einen Bruder. Er heißt Ali. Ich habe auch eine Schwester.";
    holder.ai.generate.mockResolvedValue(providerResult(assessmentJson({ corrections: [], revised_text: revised })));
    rerender(<AIWritingExaminer taskId="writing-003" task={TASK} text={revised} />);
    expect(screen.getByText(/changed your text since this feedback/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reassess my revision" }));
    await screen.findByText(/No corrections/);

    const saved = rows("SELECT id, revision_of FROM ai_assessments ORDER BY created_at, rowid") as { id: string; revision_of: string | null }[];
    expect(saved).toHaveLength(2);
    expect(saved[1].revision_of).toBe(saved[0].id);
  });

  it("recovers from malformed output without saving a score", async () => {
    await updateAISettings({ enabled: true, consentedAt: new Date().toISOString() });
    holder.ai.generate.mockResolvedValue(providerResult("Great work! 20/20"));
    const { user } = renderExaminer();

    await user.click(await screen.findByRole("button", { name: "Assess with AI" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be used/);
    expect(rows("SELECT * FROM ai_assessments")).toEqual([]);
    expect(rows("SELECT outcome FROM ai_usage")).toEqual([{ outcome: "invalid_output" }]);
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("handles a rate limit without retrying by itself", async () => {
    await updateAISettings({ enabled: true, consentedAt: new Date().toISOString() });
    holder.ai.generate.mockRejectedValue({ kind: "rate_limited", retry_after_seconds: 30 });
    const { user } = renderExaminer();

    await user.click(await screen.findByRole("button", { name: "Assess with AI" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/rate limit/);
    expect(alert).toHaveTextContent(/about 30 s/);
    expect(screen.getByRole("button", { name: /Try again in 30 s/ })).toBeDisabled();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(holder.ai.generate).toHaveBeenCalledTimes(1);
  });

  it("stops at the daily limit before sending", async () => {
    await updateAISettings({ enabled: true, consentedAt: new Date().toISOString(), dailyRequestLimit: 1 });
    getTestDatabase()
      .prepare(`INSERT INTO ai_usage (occurred_at, feature, model, outcome) VALUES (?, 'tutor', 'm', 'ok')`)
      .run(new Date().toISOString());
    const { user } = renderExaminer();

    await user.click(await screen.findByRole("button", { name: "Assess with AI" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/request limit is used up/);
    expect(holder.ai.generate).not.toHaveBeenCalled();
  });

  it("needs a few words first", async () => {
    await updateAISettings({ enabled: true });
    renderExaminer("Ich heiße");
    await waitFor(() => expect(screen.getByRole("button", { name: "Assess with AI" })).toBeDisabled());
  });
});
