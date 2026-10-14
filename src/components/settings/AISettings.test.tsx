import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../../test/fakeSqlPlugin";
import { createFakeAI, FAKE_HINT, type FakeAI } from "../../test/fakeAI";

vi.mock("@tauri-apps/plugin-sql", async () => import("../../test/fakeSqlPlugin"));

const holder = vi.hoisted(() => ({ ai: null as unknown as FakeAI }));
vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => holder.ai.isTauri,
  invoke: (...args: unknown[]) => holder.ai.invoke(...args),
}));

import { initialiseDatabase } from "../../lib/db";
import { loadAISettings } from "../../lib/ai/settings";

import AISettings from "./AISettings";

const KEY = ["AIza", "SyTESTKEY-0123456789abcdefghijKLMN"].join("");
const rows = (sql: string) => getTestDatabase().prepare(sql).all();

beforeEach(async () => {
  resetTestDatabase();
  holder.ai = createFakeAI();
  holder.ai.keyStored = false;
  await initialiseDatabase();
});

const setup = () => {
  const user = userEvent.setup({ delay: null });
  const view = render(<AISettings />);
  return { user, ...view };
};

describe("AI settings", () => {
  it("is off by default", async () => {
    setup();
    expect(await screen.findByRole("button", { name: "Optional AI feedback" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });

  it("saves the key to the Keychain and only ever shows its last four characters", async () => {
    const { user, container } = setup();
    const input = await screen.findByLabelText("Gemini API key");
    expect(input).toHaveAttribute("type", "password");

    await user.type(input, KEY);
    await user.click(screen.getByRole("button", { name: "Save key" }));

    expect(holder.ai.invoke).toHaveBeenCalledWith("ai_save_key", { key: KEY });
    expect(await screen.findByText(FAKE_HINT)).toBeInTheDocument();
    expect(screen.getByLabelText("Replace API key")).toHaveValue("");
    expect(container.innerHTML).not.toContain(KEY);
    // Nothing about the key reaches the database or browser storage.
    expect(JSON.stringify(rows("SELECT * FROM app_state"))).not.toContain(KEY.slice(0, 12));
    expect(JSON.stringify({ ...window.localStorage })).not.toContain(KEY.slice(0, 12));

    await user.click(screen.getByRole("button", { name: "Test connection" }));
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("3 of 3 DeutschLab models");
  });

  it("asks for confirmation before removing the key", async () => {
    holder.ai.keyStored = true;
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Remove key" }));
    expect(holder.ai.invoke).not.toHaveBeenCalledWith("ai_remove_key", undefined);
    await user.click(screen.getByRole("button", { name: "Confirm: remove key" }));
    expect(await screen.findByText("Not connected")).toBeInTheDocument();
  });

  it("shows an invalid key clearly", async () => {
    holder.ai.keyStored = true;
    holder.ai.invoke.mockImplementationOnce(async () => ({ stored: true, hint: FAKE_HINT }));
    const { user } = setup();
    await screen.findByText(FAKE_HINT);
    holder.ai.invoke.mockRejectedValueOnce({ kind: "invalid_key" });
    await user.click(screen.getByRole("button", { name: "Test connection" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/did not accept the API key/);
    expect(screen.getByText("Key saved, but the connection failed")).toBeInTheDocument();
  });

  it("persists the switch, model choices and limits (only downward)", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Optional AI feedback" }));
    await user.selectOptions(screen.getByLabelText("Tutor"), "gemini-3.8-flash");
    const daily = screen.getByLabelText(/AI requests per day/);
    await user.clear(daily);
    await user.type(daily, "50");
    await user.tab();

    await waitFor(async () => {
      const saved = await loadAISettings();
      expect(saved).toMatchObject({ enabled: true, dailyRequestLimit: 20 });
      expect(saved.models.tutor).toBe("gemini-3.8-flash");
    });

    await user.clear(daily);
    await user.type(daily, "5");
    await user.tab();
    await waitFor(async () => expect((await loadAISettings()).dailyRequestLimit).toBe(5));
  });

  it("shows approximate usage and deletes only AI history after confirmation", async () => {
    getTestDatabase()
      .prepare(`INSERT INTO ai_usage (occurred_at, feature, model, outcome, input_tokens, output_tokens) VALUES (?, 'writing', 'gemini-3.8-flash', 'ok', 1200, 300)`)
      .run(new Date().toISOString());
    getTestDatabase().prepare(`INSERT INTO task_progress (task_id, completed) VALUES ('vocab-001', 1)`).run();
    const { user } = setup();

    expect(await screen.findByText("1 of 20")).toBeInTheDocument();
    expect(screen.getByText(/1,200 · 300/)).toBeInTheDocument();
    expect(screen.getByText(/Usage information is approximate/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete AI history" }));
    await user.click(screen.getByRole("button", { name: "Confirm: delete AI history" }));
    await screen.findByText(/Local AI history deleted/);
    expect(rows("SELECT * FROM ai_usage")).toEqual([]);
    expect(rows("SELECT task_id FROM task_progress")).toEqual([{ task_id: "vocab-001" }]);
  });

  it("is read-only outside the app", async () => {
    holder.ai.isTauri = false;
    setup();
    expect(await screen.findByRole("button", { name: "Optional AI feedback" })).toBeDisabled();
    expect(screen.queryByLabelText("Gemini API key")).not.toBeInTheDocument();
    expect(holder.ai.invoke).not.toHaveBeenCalled();
  });
});
