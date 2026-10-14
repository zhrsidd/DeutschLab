// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_MODELS, GEMINI_MODELS, isEligible, modelsFor } from "./models";

const rust = readFileSync(join(__dirname, "../../../src-tauri/src/ai.rs"), "utf8");
const rustList = (name: string) => {
  const match = rust.match(new RegExp(`pub const ${name}: &\\[&str\\] = &\\[([^\\]]*)\\]`));
  return [...(match?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
};

describe("model registry", () => {
  it("matches the native allowlist exactly (the webview cannot add a model)", () => {
    const text = GEMINI_MODELS.filter((m) => !m.capabilities.includes("transcription")).map((m) => m.id).sort();
    const transcribe = GEMINI_MODELS.filter((m) => m.capabilities.includes("transcription")).map((m) => m.id).sort();
    expect(rustList("TEXT_MODELS").sort()).toEqual(text);
    expect(rustList("TRANSCRIBE_MODELS").sort()).toEqual(transcribe);
  });

  it("selects by capability", () => {
    expect(modelsFor("writing").map((m) => m.id)).not.toContain("gemini-3.5-transcribe");
    expect(modelsFor("transcription").map((m) => m.id)).toContain("gemini-3.5-transcribe");
    // General audio-capable models are an eligible transcription fallback.
    expect(isEligible("transcription", "gemini-3.5-flash-lite")).toBe(true);
    expect(isEligible("tutor", "gemini-3.5-transcribe")).toBe(false);
    expect(isEligible("writing", "gemini-4-argon")).toBe(false);
  });

  it("defaults are eligible for their role", () => {
    for (const [role, id] of Object.entries(DEFAULT_MODELS)) {
      expect(isEligible(role as keyof typeof DEFAULT_MODELS, id), role).toBe(true);
    }
  });

  it("lists no preview or paid-only models", () => {
    for (const model of GEMINI_MODELS) expect(model.id).not.toMatch(/preview|pro|argon|exp/);
  });
});
