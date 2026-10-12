import { readFileSync } from "node:fs";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  SPEAKING_PASS_SCORE,
  selfAssessment,
  speakingPrompts,
} from "../data/lessons/week1Speaking";

import SpeakingLesson from "./SpeakingLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

function setup() {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(
    <SpeakingLesson
      onBack={vi.fn()}
      onFinish={onFinish}
      onSaveAttempt={onSaveAttempt}
    />,
  );

  return { user, onSaveAttempt, onFinish };
}

/** Through the prompts and the 60-second challenge, ending on the checklist. */
async function reachAssessment(user: User) {
  await click(user, "Begin lesson");
  await click(user, "Start speaking prompts");

  for (const [index] of speakingPrompts.entries()) {
    await click(user, "Start speaking");
    await click(user, "Done");
    await click(
      user,
      index === speakingPrompts.length - 1 ? "Start final challenge" : "Next prompt",
    );
  }

  await click(user, "Start");
  await click(user, "Stop early");
  await click(user, "Continue to self-assessment");
}

async function tick(user: User, count: number) {
  const boxes = screen.getAllByRole("checkbox");

  for (let i = 0; i < count; i += 1) await user.click(boxes[i]);
}

describe("SpeakingLesson", () => {
  it("requires 4 of 5 to pass", () => {
    expect(SPEAKING_PASS_SCORE).toBe(4);
    expect(selfAssessment).toHaveLength(5);
  });

  it("hides the model answer until it is revealed", async () => {
    const { user } = setup();

    await click(user, "Begin lesson");
    await click(user, "Start speaking prompts");

    expect(screen.queryByText(speakingPrompts[0].german)).toBeNull();

    await click(user, "Reveal answer");

    expect(screen.getByText(speakingPrompts[0].german)).toBeInTheDocument();
  });

  it("fails below the threshold and does not offer Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await reachAssessment(user);

    await tick(user, 3);
    await click(user, "See results");

    expect(onSaveAttempt).toHaveBeenCalledWith(3, 5);
    expect(await screen.findByText("One more try.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(screen.getByRole("button", { name: /Try again/ })).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("passes at the threshold and finishes the lesson", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await reachAssessment(user);

    await tick(user, 4);
    await click(user, "See results");

    expect(onSaveAttempt).toHaveBeenCalledWith(4, 5);
    expect(await screen.findByText("Well done.")).toBeInTheDocument();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("passes with a perfect self-assessment", async () => {
    const { user, onSaveAttempt } = setup();
    await reachAssessment(user);

    await tick(user, 5);
    await click(user, "See results");

    expect(onSaveAttempt).toHaveBeenCalledWith(5, 5);
    expect(
      await screen.findByRole("button", { name: "Finish lesson" }),
    ).toBeInTheDocument();
  });

  it("never touches the microphone or speech recognition", () => {
    const source = [
      "./SpeakingLesson.tsx",
      "./checkpoint/SpeakingSection.tsx",
    ]
      .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/getUserMedia|SpeechRecognition|MediaRecorder/);
  });
});
