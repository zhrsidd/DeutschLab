import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import type { ComprehensionQuestion } from "../data/lessons/week1Checkpoint";
import { week3ListeningClips } from "../data/lessons/week3Listening";
import { week3ReadingPassages } from "../data/lessons/week3Reading";
import { trackAnswer } from "../lib/db";
import { getFakeSpeech, removeGermanVoices } from "../test/fakeSpeech";

import Week3ListeningLesson from "./Week3ListeningLesson";
import Week3ReadingLesson from "./Week3ReadingLesson";

type User = ReturnType<typeof userEvent.setup>;

/* Waits for the button to be enabled: a click made while saving is ignored. */
const click = async (user: User, name: string | RegExp) => {
  const button = screen.getByRole("button", { name });

  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
};

function setup(Lesson: typeof Week3ReadingLesson) {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const onBack = vi.fn();
  const user = userEvent.setup({ delay: null });

  render(<Lesson onBack={onBack} onFinish={onFinish} onSaveAttempt={onSaveAttempt} />);

  return { user, onSaveAttempt, onFinish, onBack };
}

async function answer(user: User, q: ComprehensionQuestion, correct: boolean) {
  if (q.kind === "mc") {
    await click(user, correct ? q.answer : q.options!.find((o) => o !== q.answer)!);
  } else {
    await user.type(screen.getByLabelText("Your answer"), `${correct ? q.answer : "zzz"}{Enter}`);
  }
}

const readingGroups = week3ReadingPassages.map((p) => p.questions);
const listeningGroups = week3ListeningClips.map((c) => c.questions);

async function playThrough(
  user: User,
  groups: ComprehensionQuestion[][],
  correctFor: (index: number) => boolean,
) {
  let index = 0;

  for (const group of groups) {
    for (const [i, q] of group.entries()) {
      await answer(user, q, correctFor(index));
      await click(user, i === group.length - 1 ? "Finish section" : "Next question");
      index += 1;
    }
  }
}

describe("reading-002 lesson", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("opens with two texts, 8 questions and a 7/8 target", () => {
    setup(Week3ReadingLesson);

    expect(screen.getByRole("heading", { name: "Objects and descriptions" })).toBeInTheDocument();
    expect(screen.getByText("Week 3 · Reading")).toBeInTheDocument();
    expect(screen.getByText("7/8")).toBeInTheDocument();
  });

  it("shows the passage beside its questions, one at a time", async () => {
    const { user } = setup(Week3ReadingLesson);
    await click(user, "Begin lesson");

    expect(screen.getByText(/Mona hat ein Zimmer/)).toBeInTheDocument();
    expect(screen.getByText(/Which of these does Mona's room NOT have/)).toBeInTheDocument();
    expect(screen.getByText("1 of 4")).toBeInTheDocument();
  });

  it("shows evidence from the text after a correct and after a wrong answer", async () => {
    const { user } = setup(Week3ReadingLesson);
    await click(user, "Begin lesson");

    await click(user, "A computer");
    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(/“Sie hat keinen Computer\.”/)).toBeInTheDocument();

    await click(user, "Next question");

    // Article identification: wrong answer reveals the article and the line.
    await click(user, "der");
    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Answer:/)).toHaveTextContent("das");
    expect(screen.getByText(/“Das Fenster ist groß\.”/)).toBeInTheDocument();
  });

  it("grades the subject / direct object question", async () => {
    const { user } = setup(Week3ReadingLesson);
    await click(user, "Begin lesson");

    await click(user, "A computer");
    await click(user, "Next question");
    await click(user, "das");
    await click(user, "Next question");

    await click(user, "einen Stuhl");
    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(/Mona hat einen Stuhl und eine Lampe/, { selector: "p" })).toBeInTheDocument();
  });

  it("grades a short German answer by keyword", async () => {
    const { user } = setup(Week3ReadingLesson);
    await click(user, "Begin lesson");

    for (const q of readingGroups[0].slice(0, 3)) {
      await answer(user, q, true);
      await click(user, "Next question");
    }

    expect(screen.getByText(/Was liest Mona/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your answer"), "Bücher{Enter}");
    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/“Mona liest ein Buch\.”/)).toBeInTheDocument();
  });

  it("accepts the German keyword with Enter", async () => {
    const { user } = setup(Week3ReadingLesson);
    await click(user, "Begin lesson");

    for (const q of readingGroups[0].slice(0, 3)) {
      await answer(user, q, true);
      await click(user, "Next question");
    }

    await user.type(screen.getByLabelText("Your answer"), "ein Buch{Enter}");
    expect(screen.getByText("Correct.")).toBeInTheDocument();
  });

  it("feeds Review only for reusable concepts, never passage facts", async () => {
    const { user } = setup(Week3ReadingLesson);
    await click(user, "Begin lesson");

    // rd3-1 maps to the grammar concept neg-c-stift.
    await click(user, "A bed");
    expect(trackAnswer).toHaveBeenCalledTimes(1);
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "grammar", sourceId: "neg-c-stift", correct: false }),
    );
    await click(user, "Next question");

    // rd3-2 maps to the noun-article concept for Fenster.
    await click(user, "der");
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceType: "vocabulary", sourceId: "fenster#article" }),
    );
  });

  it("creates no Review item for a plain comprehension question", async () => {
    const { user } = setup(Week3ReadingLesson);
    await click(user, "Begin lesson");

    // Answer the first passage correctly to reach the second.
    await playThrough(user, [readingGroups[0]], () => true);
    trackAnswerReset();

    // rd3-5 (how many books) is a plain fact.
    await click(user, "Two");
    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(trackAnswer).not.toHaveBeenCalled();
  });

  it("passes at 7/8 and fails at 6/8", async () => {
    const pass = setup(Week3ReadingLesson);
    await click(pass.user, "Begin lesson");
    await playThrough(pass.user, readingGroups, (index) => index !== 4);

    expect(pass.onSaveAttempt).toHaveBeenCalledWith(7, 8);
    expect(await screen.findByText("Nice work.")).toBeInTheDocument();
    await click(pass.user, "Finish lesson");
    expect(pass.onFinish).toHaveBeenCalledTimes(1);
  });

  it("does not offer Finish after a 6/8 attempt", async () => {
    const fail = setup(Week3ReadingLesson);
    await click(fail.user, "Begin lesson");
    await playThrough(fail.user, readingGroups, (index) => index > 1);

    expect(fail.onSaveAttempt).toHaveBeenCalledWith(6, 8);
    expect(await screen.findByText("One more pass.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(fail.onFinish).not.toHaveBeenCalled();
  });
});

function trackAnswerReset() {
  vi.mocked(trackAnswer).mockClear();
}

describe("listening-003 lesson", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  async function begin(user: User) {
    await click(user, "Begin lesson");
    await screen.findByRole("button", { name: "Play audio" });
  }

  it("opens with 4 clips, 8 questions and a 7/8 target", () => {
    setup(Week3ListeningLesson);

    expect(screen.getByRole("heading", { name: "Objects and possession" })).toBeInTheDocument();
    expect(screen.getByText("Week 3 · Listening")).toBeInTheDocument();
    expect(screen.getByText("7/8")).toBeInTheDocument();
  });

  it("hides the transcript until the question is answered", async () => {
    const { user } = setup(Week3ListeningLesson);
    await begin(user);

    const clip = week3ListeningClips[0];
    expect(screen.queryByText("Transcript")).toBeNull();
    expect(screen.queryByText(clip.audio)).toBeNull();

    await click(user, clip.questions[0].answer);

    expect(screen.getByText("Transcript")).toBeInTheDocument();
    expect(screen.getByText(clip.audio)).toBeInTheDocument();
    expect(screen.getByText(clip.translation)).toBeInTheDocument();
    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(/“Der Tisch ist groß\.”/)).toBeInTheDocument();
  });

  it("reveals the answer and explanation after a wrong choice", async () => {
    const { user } = setup(Week3ListeningLesson);
    await begin(user);

    const q = week3ListeningClips[0].questions[0];
    await click(user, q.options!.find((o) => o !== q.answer)!);

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Answer:/)).toHaveTextContent(q.answer);
  });

  it("never autoplays; Play is normal speed and Slower about 0.7", async () => {
    const { user } = setup(Week3ListeningLesson);
    await begin(user);

    const speech = getFakeSpeech();
    expect(speech.spoken).toHaveLength(0);

    await click(user, "Play audio");
    await click(user, /Slower/);

    expect(speech.spoken).toHaveLength(2);
    expect(speech.spoken[0].text).toBe(week3ListeningClips[0].audio);
    expect(speech.spoken[0].rate).toBeGreaterThan(0.8);
    expect(speech.spoken[1].rate).toBeCloseTo(0.7);
    expect(speech.spoken[1].lang).toBe("de-DE");
  });

  it("with no German voice, explains the problem and neither awards nor deducts marks", async () => {
    removeGermanVoices();
    const { user, onSaveAttempt, onFinish, onBack } = setup(Week3ListeningLesson);

    expect(
      await screen.findByText(/Listening needs a German voice/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Begin lesson" })).toBeNull();
    expect(screen.queryByText("Correct.")).toBeNull();

    await click(user, "Exit lesson");

    expect(onBack).toHaveBeenCalled();
    expect(onSaveAttempt).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
    expect(trackAnswer).not.toHaveBeenCalled();
  });

  it("feeds Review only for questions with a reusable concept", async () => {
    const { user } = setup(Week3ListeningLesson);
    await begin(user);

    // l3-1 maps to the vocabulary item Tisch.
    const first = week3ListeningClips[0].questions[0];
    await click(user, first.options!.find((o) => o !== first.answer)!);
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "vocabulary", sourceId: "tisch", correct: false }),
    );
  });

  it("passes at 7/8 and finishes; fails at 6/8 without Finish", async () => {
    const pass = setup(Week3ListeningLesson);
    await begin(pass.user);
    await playThrough(pass.user, listeningGroups, (index) => index !== 2);

    expect(pass.onSaveAttempt).toHaveBeenCalledWith(7, 8);
    expect(await screen.findByText("Nice work.")).toBeInTheDocument();
    await click(pass.user, "Finish lesson");
    expect(pass.onFinish).toHaveBeenCalledTimes(1);
  });

  it("fails at 6/8 without offering Finish", async () => {
    const fail = setup(Week3ListeningLesson);
    await begin(fail.user);
    await playThrough(fail.user, listeningGroups, (index) => index > 1);

    expect(fail.onSaveAttempt).toHaveBeenCalledWith(6, 8);
    expect(await screen.findByText("One more pass.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(fail.onFinish).not.toHaveBeenCalled();
  });
});
