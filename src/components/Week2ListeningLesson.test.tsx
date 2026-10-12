import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import { week2ListeningClips } from "../data/lessons/week2Listening";
import { trackAnswer } from "../lib/db";
import { getFakeSpeech, removeGermanVoices } from "../test/fakeSpeech";

import Week2ListeningLesson from "./Week2ListeningLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

const questions = week2ListeningClips.flatMap((clip) => clip.questions);

function setup() {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const onBack = vi.fn();
  const user = userEvent.setup({ delay: null });

  render(
    <Week2ListeningLesson onBack={onBack} onFinish={onFinish} onSaveAttempt={onSaveAttempt} />,
  );

  return { user, onSaveAttempt, onFinish, onBack };
}

async function begin(user: User) {
  await click(user, "Begin lesson");
  await screen.findByRole("button", { name: "Play audio" });
}

async function playThrough(user: User, correctFor: (index: number) => boolean) {
  await begin(user);

  let index = 0;

  for (const clip of week2ListeningClips) {
    for (const [i, q] of clip.questions.entries()) {
      await click(
        user,
        correctFor(index) ? q.answer : q.options!.find((o) => o !== q.answer)!,
      );
      await click(user, i === clip.questions.length - 1 ? "Finish section" : "Next question");
      index += 1;
    }
  }
}

describe("listening-002 lesson", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("opens with 4 clips and 8 questions", () => {
    setup();

    expect(screen.getByRole("heading", { name: "Week 2 listening" })).toBeInTheDocument();
    expect(screen.getByText("Week 2 · Listening")).toBeInTheDocument();
    expect(screen.getByText("7/8")).toBeInTheDocument();
  });

  it("hides the transcript before answering and reveals it after", async () => {
    const { user } = setup();
    await begin(user);

    const first = week2ListeningClips[0];

    expect(screen.queryByText("Transcript")).toBeNull();
    expect(screen.queryByText(first.audio)).toBeNull();

    await click(user, first.questions[0].answer);

    expect(screen.getByText("Transcript")).toBeInTheDocument();
    expect(screen.getByText(first.audio)).toBeInTheDocument();
    expect(screen.getByText(first.translation)).toBeInTheDocument();
    expect(screen.getByText("Correct.")).toBeInTheDocument();
    // The explanation quotes the relevant line (the transcript shows the whole clip).
    expect(screen.getByText(/“Ich habe drei Geschwister\.”/)).toBeInTheDocument();
  });

  it("shows the correct answer and transcript after a wrong answer", async () => {
    const { user } = setup();
    await begin(user);

    const q = week2ListeningClips[0].questions[0];
    await click(user, q.options!.find((o) => o !== q.answer)!);

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Answer:/)).toHaveTextContent(q.answer);
    expect(screen.getByText("Transcript")).toBeInTheDocument();
  });

  it("does not autoplay; Play is normal speed and Slower is about 0.7", async () => {
    const { user } = setup();
    await begin(user);

    const speech = getFakeSpeech();
    expect(speech.spoken).toHaveLength(0);

    await click(user, "Play audio");
    await click(user, /Slower/);

    expect(speech.spoken).toHaveLength(2);
    expect(speech.spoken[0].text).toBe(week2ListeningClips[0].audio);
    expect(speech.spoken[0].rate).toBeGreaterThan(0.8);
    expect(speech.spoken[1].rate).toBeCloseTo(0.7);
    expect(speech.spoken[1].lang).toBe("de-DE");
  });

  it("with no German voice, explains the problem and assesses nothing", async () => {
    removeGermanVoices();
    const { user, onSaveAttempt, onFinish, onBack } = setup();

    expect(
      await screen.findByText(/Listening needs a German voice/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Begin lesson" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Play audio" })).toBeNull();
    expect(screen.queryByText("Correct.")).toBeNull();

    await click(user, "Exit lesson");

    expect(onBack).toHaveBeenCalled();
    expect(onSaveAttempt).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
    expect(trackAnswer).not.toHaveBeenCalled();
  });

  it("only feeds Review for questions with a reusable concept", async () => {
    const { user } = setup();
    await begin(user);

    // l2-1 maps to the vocabulary item "Geschwister".
    const first = week2ListeningClips[0].questions[0];
    await click(user, first.options!.find((o) => o !== first.answer)!);

    expect(trackAnswer).toHaveBeenCalledTimes(1);
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "vocabulary", sourceId: "geschwister", correct: false }),
    );

    await click(user, "Next question");

    // l2-2 (the brother's name) is a plain fact: no Review item.
    const second = week2ListeningClips[0].questions[1];
    await click(user, second.options!.find((o) => o !== second.answer)!);

    expect(trackAnswer).toHaveBeenCalledTimes(1);
  });

  it("passes at 7/8 (80%) and finishes", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    await playThrough(user, (index) => index !== 3);

    expect(onSaveAttempt).toHaveBeenCalledWith(7, 8);
    expect(await screen.findByText("Nice work.")).toBeInTheDocument();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("fails at 6/8 and does not offer Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    await playThrough(user, (index) => index > 1);

    expect(onSaveAttempt).toHaveBeenCalledWith(6, 8);
    expect(await screen.findByText("One more pass.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("asks all eight questions across four clips", async () => {
    expect(questions).toHaveLength(8);
    await waitFor(() => expect(week2ListeningClips).toHaveLength(4));
  });
});
