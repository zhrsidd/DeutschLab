import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../../test/fakeSqlPlugin";
import { createFakeAI, providerResult, type FakeAI } from "../../test/fakeAI";

vi.mock("@tauri-apps/plugin-sql", async () => import("../../test/fakeSqlPlugin"));

const holder = vi.hoisted(() => ({ ai: null as unknown as FakeAI }));
vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => holder.ai.isTauri,
  invoke: (...args: unknown[]) => holder.ai.invoke(...args),
}));

import { starterTasks } from "../../data/unit1";
import { initialiseDatabase, markTaskComplete } from "../../lib/db";
import { updateAISettings } from "../../lib/ai/settings";

import TutorView from "./TutorView";

const rows = (sql: string) => getTestDatabase().prepare(sql).all();

const reply = (overrides: Record<string, unknown> = {}) =>
  providerResult(
    { reply: "Toll! Wie heißt dein Bruder?", english_help: "Great! What is your brother called?", corrections: [], new_words: [], ...overrides },
    "gemini-3.5-flash-lite",
  );

beforeEach(async () => {
  resetTestDatabase();
  holder.ai = createFakeAI();
  await initialiseDatabase();
  await updateAISettings({ enabled: true, consentedAt: new Date().toISOString() });
  // A Week 4 learner: Weeks 1–3 completed and checkpoints passed.
  for (const task of starterTasks.filter((t) => (t.week ?? 1) <= 3)) await markTaskComplete(task.id);
});

function setup() {
  const user = userEvent.setup({ delay: null });
  const startLesson = vi.fn();
  render(<TutorView onBack={vi.fn()} startLesson={startLesson} />);
  return { user, startLesson };
}

describe("TutorView", () => {
  it("offers only topics the learner has reached", async () => {
    setup();
    expect(await screen.findByRole("button", { name: "Food" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Daily routines/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Daily routines/ })).toHaveTextContent("from Week 7");
    expect(screen.getByText(/Week 4 German/)).toBeInTheDocument();
  });

  it("runs a guided conversation with immediate corrections and saves it", async () => {
    holder.ai.generate.mockResolvedValue(
      reply({ corrections: [{ original: "ein Bruder", corrected: "einen Bruder", explanation: "Masculine accusative after haben." }] }),
    );
    const { user } = setup();

    await user.click(await screen.findByRole("button", { name: "Family" }));
    await user.click(screen.getByRole("button", { name: "Start conversation" }));

    expect(screen.getByText("Hallo! Hast du Geschwister?")).toBeInTheDocument();
    expect(holder.ai.generate).not.toHaveBeenCalled(); // the opener is local

    await user.type(screen.getByLabelText("Your answer"), "Ja, ich habe ein Bruder.{Enter}");

    expect(await screen.findByText("Toll! Wie heißt dein Bruder?")).toBeInTheDocument();
    const corrections = screen.getByRole("list", { name: "Corrections" });
    expect(within(corrections).getByText("einen Bruder")).toBeInTheDocument();
    expect(screen.getByText("Turn 1 of 15")).toBeInTheDocument();
    expect(screen.getByLabelText("Your answer")).toHaveValue("");

    const request = holder.ai.generate.mock.calls[0][0];
    expect(request.model).toBe("gemini-3.5-flash-lite");
    expect(request.systemInstruction).toMatch(/Topic: Family/);
    expect(request.systemInstruction).toMatch(/Corrections: immediate/);
    expect(request.systemInstruction).toMatch(/Week 4/);
    expect(request.systemInstruction).toMatch(/Hast du Geschwister/);
    expect(request.turns).toEqual([{ role: "user", text: "Ja, ich habe ein Bruder." }]);

    const [saved] = rows("SELECT topic, correction_mode, messages_json FROM ai_tutor_sessions") as { topic: string; correction_mode: string; messages_json: string }[];
    expect(saved.topic).toBe("Family");
    expect(JSON.parse(saved.messages_json)).toHaveLength(3);
  });

  it("switches to delayed corrections mid-session and summarises at the end", async () => {
    holder.ai.generate
      .mockResolvedValueOnce(reply())
      .mockResolvedValueOnce(reply({ corrections: [{ original: "ein Bruder", corrected: "einen Bruder", explanation: "x" }] }))
      .mockResolvedValueOnce(
        providerResult({
          recurring_mistakes: [{ pattern: "Accusative", original: "ein Bruder", corrected: "einen Bruder", explanation: "Masculine objects take einen." }],
          strengths: ["Good questions."],
          recommended_lessons: ["grammar-007"],
          next_step: "Practise einen.",
        }),
      );
    const { user, startLesson } = setup();

    await user.click(await screen.findByRole("button", { name: "Family" }));
    await user.click(screen.getByRole("button", { name: "Start conversation" }));
    await user.type(screen.getByLabelText("Your answer"), "Ja.{Enter}");
    await screen.findByText("Turn 1 of 15");

    await user.click(screen.getByRole("button", { name: "at the end" }));
    await user.type(screen.getByLabelText("Your answer"), "Ich habe ein Bruder.{Enter}");
    await screen.findByText("Turn 2 of 15");
    expect(holder.ai.generate.mock.calls[1][0].systemInstruction).toMatch(/Corrections: delayed/);
    expect(screen.queryByRole("list", { name: "Corrections" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Finish and summarise" }));
    expect(await screen.findByText("Masculine objects take einen.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /accusative case/i }));
    expect(startLesson).toHaveBeenCalledWith("grammar-007");
  });

  it("keeps the learner's message when a request fails", async () => {
    holder.ai.generate.mockRejectedValue({ kind: "network" });
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Start conversation" }));
    await user.type(screen.getByLabelText("Your answer"), "Ich heiße Sam.{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(/No connection/);
    expect(screen.getByLabelText("Your answer")).toHaveValue("Ich heiße Sam.");
    expect(screen.getByText("Turn 0 of 15")).toBeInTheDocument();
  });

  it("stops at the turn limit", async () => {
    await updateAISettings({ tutorTurnLimit: 3 });
    holder.ai.generate.mockResolvedValue(reply());
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Start conversation" }));
    for (let i = 1; i <= 3; i += 1) {
      await user.type(screen.getByLabelText("Your answer"), `Satz ${i}.{Enter}`);
      await screen.findByText(`Turn ${i} of 3`);
    }
    expect(screen.getByText(/That's 3 turns/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Your answer")).not.toBeInTheDocument();
    expect(holder.ai.generate).toHaveBeenCalledTimes(3);
  });

  it("free conversation explains its purpose in English", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: /Free conversation/ }));
    expect(screen.queryByRole("button", { name: "Family" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start conversation" }));
    expect(screen.getByText(/Ask me anything about German/)).toBeInTheDocument();
  });

  it("explains what is missing when AI is off", async () => {
    await updateAISettings({ enabled: false });
    setup();
    expect(await screen.findByText(/Optional AI feedback is off/)).toBeInTheDocument();
  });
});
