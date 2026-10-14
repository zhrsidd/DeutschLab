import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import AISpeakingExaminer from "./AISpeakingExaminer";

const TASK = { prompt: "Talk about yourself.", cues: ["family"], checklist: ["I used 4 sentences"] };
const rows = (sql: string) => getTestDatabase().prepare(sql).all();

/* A fake microphone: MediaRecorder produces a 2 KB clip when stopped. */
class FakeRecorder {
  static isTypeSupported = (type: string) => type === "audio/webm;codecs=opus";
  state: "inactive" | "recording" = "inactive";
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(_stream: unknown, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? "audio/webm";
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob([new Uint8Array(2048)], { type: this.mimeType }) });
    this.onstop?.();
  }
}

const track = { stop: vi.fn(), addEventListener: vi.fn() };
const getUserMedia = vi.fn();

beforeEach(async () => {
  resetTestDatabase();
  holder.ai = createFakeAI();
  await initialiseDatabase();
  await updateAISettings({ enabled: true, consentedAt: new Date().toISOString() });
  getUserMedia.mockReset().mockResolvedValue({ getTracks: () => [track] });
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  Object.assign(URL, { createObjectURL: vi.fn(() => "blob:recording"), revokeObjectURL: vi.fn() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const setup = () => {
  const user = userEvent.setup({ delay: null });
  render(<AISpeakingExaminer taskId="speaking-002" task={TASK} />);
  return user;
};

describe("AISpeakingExaminer", () => {
  it("records, plays back, transcribes, lets the learner fix the transcript and assesses it", async () => {
    holder.ai.transcribe.mockResolvedValue(providerResult("Ich heiße Sam. Ich habe ein Hund. Ich wohne in Bern.", "gemini-3.5-transcribe"));
    holder.ai.generate.mockResolvedValue(
      providerResult(
        assessmentJson({
          corrections: [{ original: "ein Hund", suggestion: "einen Hund", explanation: "Masculine accusative.", concept: "accusative", category: "grammar", severity: "error" }],
          strengths: ["Your pronunciation sounds natural.", "Clear sentences."],
        }),
      ),
    );
    const user = setup();

    await user.click(await screen.findByRole("button", { name: "Record" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/Recording/);
    await user.click(screen.getByRole("button", { name: "Stop recording" }));

    // Playback is offered, never automatic.
    const audio = screen.getByLabelText("Play your recording");
    expect(audio).toHaveAttribute("src", "blob:recording");
    expect(audio).not.toHaveAttribute("autoplay");
    expect(track.stop).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Transcribe with AI" }));
    const box = await screen.findByLabelText("Transcript from Gemini 3.5 Transcribe");
    expect(holder.ai.transcribe.mock.calls[0][0]).toMatchObject({ model: "gemini-3.5-transcribe", mimeType: "audio/webm;codecs=opus" });

    await user.clear(box);
    await user.type(box, "Ich heiße Sam. Ich habe ein Hund. Ich wohne in Bern, äh, in Basel.");
    expect(screen.getByLabelText("Transcript (edited by you)")).toBeInTheDocument();
    expect(screen.getByText("Original transcript")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Assess with AI" }));
    const feedback = await screen.findByRole("region", { name: "AI feedback" });
    expect(feedback).toHaveTextContent("Pronunciation not formally assessed.");
    expect(feedback).toHaveTextContent("einen Hund");
    expect(feedback).not.toHaveTextContent("pronunciation sounds natural");

    expect(rows("SELECT kind, input_source, original_transcript FROM ai_assessments")).toEqual([
      { kind: "speaking", input_source: "edited_transcript", original_transcript: "Ich heiße Sam. Ich habe ein Hund. Ich wohne in Bern." },
    ]);
    expect(rows("SELECT feature FROM ai_usage ORDER BY id")).toEqual([{ feature: "transcription" }, { feature: "speaking" }]);
    // No audio is stored.
    expect(JSON.stringify(rows("SELECT * FROM ai_assessments"))).not.toMatch(/blob:|base64/);
  });

  it("explains a denied microphone and still allows a typed answer", async () => {
    getUserMedia.mockRejectedValue(Object.assign(new Error("denied"), { name: "NotAllowedError" }));
    holder.ai.generate.mockResolvedValue(providerResult(assessmentJson({ corrections: [] })));
    const user = setup();

    await user.click(await screen.findByRole("button", { name: "Record" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/may not use the microphone/);

    await user.click(screen.getByRole("button", { name: "Type what you said instead" }));
    await user.type(screen.getByLabelText("What you said (typed by you)"), "Ich heiße Sam und ich wohne in Bern.");
    await user.click(screen.getByRole("button", { name: "Assess with AI" }));
    await screen.findByRole("region", { name: "AI feedback" });
    expect(rows("SELECT input_source FROM ai_assessments")).toEqual([{ input_source: "typed" }]);
  });

  it("reports a missing microphone and unsupported recording", async () => {
    getUserMedia.mockRejectedValue(Object.assign(new Error("none"), { name: "NotFoundError" }));
    const user = setup();
    await user.click(await screen.findByRole("button", { name: "Record" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/No microphone was found/);
  });

  it("keeps the recording when transcription fails, and deletes it on request", async () => {
    holder.ai.transcribe.mockRejectedValue({ kind: "network" });
    const user = setup();

    await user.click(await screen.findByRole("button", { name: "Record" }));
    await user.click(await screen.findByRole("button", { name: "Stop recording" }));
    await user.click(screen.getByRole("button", { name: "Transcribe with AI" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/No connection/);
    expect(screen.getByLabelText("Play your recording")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete recording" }));
    expect(screen.queryByLabelText("Play your recording")).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:recording");
  });

  it("does not invent words when nothing was recognised", async () => {
    holder.ai.transcribe.mockResolvedValue(providerResult("   ", "gemini-3.5-transcribe"));
    const user = setup();
    await user.click(await screen.findByRole("button", { name: "Record" }));
    await user.click(await screen.findByRole("button", { name: "Stop recording" }));
    await user.click(screen.getByRole("button", { name: "Transcribe with AI" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/can't be sent|No speech/);
    expect(screen.queryByLabelText(/Transcript from/)).not.toBeInTheDocument();
  });
});
