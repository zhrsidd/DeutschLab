/*
 * Test double for the native AI commands (src-tauri/src/ai.rs). Tests set
 * the responses; no real key or network is ever involved.
 */

import { vi, type Mock } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = Mock<(...args: any[]) => any>;

export interface FakeAI {
  isTauri: boolean;
  keyStored: boolean;
  generate: Fn;
  transcribe: Fn;
  invoke: Fn;
}

export const FAKE_HINT = "••••KLMN";

export function createFakeAI(): FakeAI {
  const fake = {
    isTauri: true,
    keyStored: true,
    generate: vi.fn(),
    transcribe: vi.fn(),
    invoke: vi.fn(),
  } as FakeAI;

  fake.invoke.mockImplementation(async (command: string, args?: Record<string, unknown>) => {
    switch (command) {
      case "ai_key_status":
        return { stored: fake.keyStored, hint: fake.keyStored ? FAKE_HINT : null };
      case "ai_save_key":
        fake.keyStored = true;
        return { stored: true, hint: FAKE_HINT };
      case "ai_remove_key":
        fake.keyStored = false;
        return { stored: false, hint: null };
      case "ai_test_connection":
        return { models: ["gemini-3.5-flash-lite", "gemini-3.5-transcribe", "gemini-3.8-flash"] };
      case "ai_generate":
        return fake.generate(args?.request);
      case "ai_transcribe":
        return fake.transcribe(args?.request);
      default:
        throw new Error(`Unexpected command ${command}`);
    }
  });

  return fake;
}

export const providerResult = (text: unknown, model = "gemini-3.8-flash") => ({
  text: typeof text === "string" ? text : JSON.stringify(text),
  model,
  inputTokens: 120,
  outputTokens: 80,
});

export const assessmentJson = (overrides: Record<string, unknown> = {}) => ({
  scores: {
    grammar: { score: 3, comment: "One accusative error." },
    vocabulary: { score: 4, comment: "Good family words." },
    task_completion: { score: 2, comment: "Very short." },
    coherence: { score: 4, comment: "Clear sentences." },
  },
  strengths: ["Correct verb position."],
  improvements: ["Use einen with masculine objects."],
  corrections: [
    {
      original: "ein Bruder",
      suggestion: "einen Bruder",
      explanation: "Bruder is masculine. After haben, use the accusative form einen Bruder.",
      concept: "accusative after haben",
      category: "grammar",
      severity: "error",
    },
  ],
  missed_requirements: [],
  revised_text: "Ich habe einen Bruder. Er heißt Ali. Ich habe auch eine Schwester.",
  recommended_lessons: ["grammar-007"],
  uncertainty_notes: [],
  ...overrides,
});
