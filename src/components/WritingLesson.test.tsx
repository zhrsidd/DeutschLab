import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-in for the draft table so persistence can be observed.
const store = vi.hoisted(() => ({ draft: "" }));

vi.mock("../lib/db", () => ({
  trackAnswer: vi.fn(),
  getWritingDraft: vi.fn(async () => store.draft),
  saveWritingDraft: vi.fn(async (_id: string, text: string) => {
    store.draft = text;
  }),
  clearWritingDraft: vi.fn(async () => {
    store.draft = "";
  }),
}));

import { dailyLifeWriting } from "../data/lessons/week2Writing";
import {
  clearWritingDraft,
  getWritingDraft,
  saveWritingDraft,
  trackAnswer,
} from "../lib/db";

import WritingLesson from "./WritingLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

function setup() {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  const view = render(
    <WritingLesson onBack={vi.fn()} onFinish={onFinish} onSaveAttempt={onSaveAttempt} />,
  );

  return { user, onSaveAttempt, onFinish, ...view };
}

async function reachWriting(user: User) {
  await screen.findByRole("button", { name: "Begin lesson" });
  await click(user, "Begin lesson");
  await click(user, "Plan my paragraph");
  await click(user, "Start writing");
}

const TEXT = "Ich heiße Anna. Ich wohne in Doha. Ich lerne Deutsch.";

async function tick(user: User, count: number) {
  const boxes = screen
    .getAllByRole("checkbox")
    .filter((box) => !box.getAttribute("aria-label"));

  for (let i = 0; i < count; i += 1) await user.click(boxes[i]);
}

describe("writing-001 lesson", () => {
  beforeEach(() => {
    store.draft = "";
    vi.mocked(trackAnswer).mockClear();
    vi.mocked(getWritingDraft).mockClear();
    vi.mocked(saveWritingDraft).mockClear();
    vi.mocked(clearWritingDraft).mockClear();
  });

  it("opens, shows sentence frames, and lets the learner plan topics", async () => {
    const { user } = setup();

    expect(await screen.findByRole("heading", { name: "My daily life" })).toBeInTheDocument();
    await click(user, "Begin lesson");

    expect(screen.getByText("Ich wohne in ...")).toBeInTheDocument();
    expect(screen.getByText("Ich arbeite ...")).toBeInTheDocument();

    await click(user, "Plan my paragraph");
    await user.click(screen.getByRole("checkbox", { name: "family" }));
    await user.click(screen.getByRole("checkbox", { name: "school" }));

    expect(screen.getByText("2 topics planned")).toBeInTheDocument();
  });

  it("counts words live and hides the example until submission", async () => {
    const { user } = setup();
    await reachWriting(user);

    const box = screen.getByLabelText("Your paragraph");

    expect(screen.getByText("0 words")).toBeInTheDocument();
    expect(screen.queryByText(dailyLifeWriting.sample)).toBeNull();
    expect(screen.queryByText(/Compare your paragraph/)).toBeNull();

    await user.type(box, "Ich heiße Anna. Ich wohne in Doha.");
    expect(screen.getByText("7 words")).toBeInTheDocument();

    await user.type(box, " Ich lerne Deutsch.");
    expect(screen.getByText("10 words")).toBeInTheDocument();
  });

  it("does not submit a near-empty paragraph, but accepts any length from 5 words", async () => {
    const { user } = setup();
    await reachWriting(user);

    await user.type(screen.getByLabelText("Your paragraph"), "Ich bin Anna.");
    expect(screen.getByRole("button", { name: /Submit writing/ })).toBeDisabled();

    await user.type(screen.getByLabelText("Your paragraph"), " Ich wohne hier.");
    expect(screen.getByRole("button", { name: /Submit writing/ })).toBeEnabled(); // far under 40 words
  });

  it("shows the paragraph, its word count and the example after submission", async () => {
    const { user } = setup();
    await reachWriting(user);

    await user.type(screen.getByLabelText("Your paragraph"), TEXT);
    await click(user, /Submit writing/);

    expect(screen.getByText("Your text (10 words)")).toBeInTheDocument();
    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(screen.getByText("Compare your paragraph with this example")).toBeInTheDocument();
    expect(screen.getByText(dailyLifeWriting.sample)).toBeInTheDocument();
    expect(screen.queryByText(/grammatically correct/i)).toBeNull();
  });

  it("fails at 4/6, keeps the draft, and lets the learner edit and resubmit", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await reachWriting(user);

    await user.type(screen.getByLabelText("Your paragraph"), TEXT);
    await click(user, /Submit writing/);

    await tick(user, 4);
    await click(user, "See results");

    expect(onSaveAttempt).toHaveBeenCalledWith(4, 6);
    expect(await screen.findByText("Keep working on it.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(onFinish).not.toHaveBeenCalled();

    // Submitting did not erase the draft.
    expect(store.draft).toBe(TEXT);

    await click(user, "Edit paragraph");
    const box = screen.getByLabelText("Your paragraph");
    expect(box).toHaveValue(TEXT);

    await user.type(box, " Ich habe Zeit.");
    await click(user, /Submit writing/);
    await tick(user, 5);
    await click(user, "See results");

    expect(onSaveAttempt).toHaveBeenLastCalledWith(5, 6);
    expect(await screen.findByText("Well done.")).toBeInTheDocument();
    expect(store.draft).toBe(`${TEXT} Ich habe Zeit.`);
  });

  it("passes at 5/6 and finishes", async () => {
    const { user, onFinish } = setup();
    await reachWriting(user);

    await user.type(screen.getByLabelText("Your paragraph"), TEXT);
    await click(user, /Submit writing/);
    await tick(user, 5);
    await click(user, "See results");

    await user.click(await screen.findByRole("button", { name: "Finish lesson" }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("saves the draft shortly after typing", async () => {
    const { user } = setup();
    await reachWriting(user);

    await user.type(screen.getByLabelText("Your paragraph"), "Ich bin Anna.");

    await waitFor(() => expect(saveWritingDraft).toHaveBeenCalledWith("writing-001", "Ich bin Anna."), {
      timeout: 2000,
    });
  });

  it("restores a saved draft after the app is reopened", async () => {
    store.draft = "Ich heiße Karim. Ich wohne in Doha.";

    const { user } = setup();

    expect(await screen.findByText(/saved draft \(7 words\)/)).toBeInTheDocument();

    await click(user, "Begin lesson");
    await click(user, "Plan my paragraph");
    await click(user, "Start writing");

    expect(screen.getByLabelText("Your paragraph")).toHaveValue("Ich heiße Karim. Ich wohne in Doha.");
    expect(screen.getByText("7 words")).toBeInTheDocument();
  });

  it("flushes unsaved typing when the learner leaves", async () => {
    const { user, unmount } = setup();
    await reachWriting(user);

    await user.type(screen.getByLabelText("Your paragraph"), "Sofort speichern bitte");
    unmount();

    expect(saveWritingDraft).toHaveBeenCalledWith("writing-001", "Sofort speichern bitte");
    expect(store.draft).toBe("Sofort speichern bitte");
  });

  it("clears the draft only when the learner chooses to start again", async () => {
    store.draft = "Ich bin Anna und ich wohne hier.";
    const { user } = setup();

    await screen.findByRole("button", { name: "Begin lesson" });
    await click(user, "Begin lesson");
    await click(user, "Plan my paragraph");
    await click(user, "Start writing");

    expect(clearWritingDraft).not.toHaveBeenCalled();

    await click(user, "Clear and start again");

    expect(clearWritingDraft).toHaveBeenCalledWith("writing-001");
    expect(screen.getByLabelText("Your paragraph")).toHaveValue("");
    expect(store.draft).toBe("");
  });

  it("never creates mistakes or review items from the self-check", async () => {
    const { user } = setup();
    await reachWriting(user);

    await user.type(screen.getByLabelText("Your paragraph"), TEXT);
    await click(user, /Submit writing/);
    await tick(user, 2);
    await click(user, "See results");

    await screen.findByText("Keep working on it.");
    expect(trackAnswer).not.toHaveBeenCalled();
  });
});
