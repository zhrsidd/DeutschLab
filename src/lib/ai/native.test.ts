import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const tauri = vi.hoisted(() => ({ isTauri: true, invoke: vi.fn() }));

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => tauri.isTauri,
  invoke: (...args: unknown[]) => tauri.invoke(...args),
}));

import { AIError } from "./errors";
import { generate, getKeyStatus, nativeAIAvailable, saveKey, transcribe } from "./native";

const KEY = ["AIza", "SyTESTKEY-0123456789abcdefghijKLMN"].join("");

beforeEach(() => {
  tauri.isTauri = true;
  tauri.invoke.mockReset();
});

describe("native bridge", () => {
  it("is unavailable outside the app and never calls invoke there", async () => {
    tauri.isTauri = false;
    expect(nativeAIAvailable()).toBe(false);
    await expect(getKeyStatus()).rejects.toMatchObject({ kind: "unavailable" });
    expect(tauri.invoke).not.toHaveBeenCalled();
  });

  it("sends the key once and gets back only a masked status", async () => {
    tauri.invoke.mockResolvedValue({ stored: true, hint: "••••KLMN" });
    const status = await saveKey(KEY);
    expect(tauri.invoke).toHaveBeenCalledWith("ai_save_key", { key: KEY });
    expect(JSON.stringify(status)).not.toContain(KEY);
  });

  it("gives up on a Keychain call that never answers, with a recoverable error", async () => {
    vi.useFakeTimers();
    try {
      tauri.invoke.mockReturnValue(new Promise(() => {}));
      const pending = saveKey(KEY).catch((e) => e);
      await vi.advanceTimersByTimeAsync(36_000);
      expect(await pending).toMatchObject({ kind: "keychain" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("maps native errors to typed AIErrors", async () => {
    tauri.invoke.mockRejectedValue({ kind: "rate_limited", retry_after_seconds: 12 });
    const error = await generate({ model: "gemini-3.8-flash", systemInstruction: "s", turns: [{ role: "user", text: "Hallo" }], maxOutputTokens: 256, temperature: 0 }).catch((e) => e);
    expect(error).toBeInstanceOf(AIError);
    expect(error).toMatchObject({ kind: "rate_limited", retryAfterSeconds: 12 });

    tauri.invoke.mockRejectedValue({ kind: "something_new" });
    await expect(getKeyStatus()).rejects.toMatchObject({ kind: "unknown" });
  });

  it("requests carry no URL, header or key: only a model and content", async () => {
    tauri.invoke.mockResolvedValue({ text: "", model: "m", inputTokens: null, outputTokens: null });
    await generate({ model: "gemini-3.8-flash", systemInstruction: "s", turns: [{ role: "user", text: "Hallo" }], maxOutputTokens: 256, temperature: 0 });
    await transcribe({ model: "gemini-3.5-transcribe", audioBase64: "AAAA", mimeType: "audio/webm" });
    for (const [command, args] of tauri.invoke.mock.calls) {
      expect(["ai_generate", "ai_transcribe"]).toContain(command);
      const text = JSON.stringify(args);
      expect(text).not.toMatch(/https?:|x-goog-api-key|AIza/);
    }
  });
});

describe("security invariants in the source", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(path);
    }
  };
  walk(join(__dirname, "../.."));

  it("the webview never talks to Google directly", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/generativelanguage\.googleapis\.com|x-goog-api-key/);
    }
  });

  it("the key never touches localStorage or the database", () => {
    const store = readFileSync(join(__dirname, "store.ts"), "utf8") + readFileSync(join(__dirname, "settings.ts"), "utf8");
    expect(store).not.toMatch(/api_?key|apiKey/i);
    const settingsView = readFileSync(join(__dirname, "../../components/settings/AISettings.tsx"), "utf8");
    expect(settingsView).not.toMatch(/localStorage|sessionStorage|console\.(log|info)\(/);
  });

  it("no native command returns the key", () => {
    const rust = readFileSync(join(__dirname, "../../../src-tauri/src/ai.rs"), "utf8");
    const commands = [...rust.matchAll(/#\[tauri::command\]\s*pub async fn (\w+)\([^)]*\) -> Result<(\w+)/g)];
    expect(commands.map((m) => m[1]).sort()).toEqual([
      "ai_generate",
      "ai_key_status",
      "ai_remove_key",
      "ai_save_key",
      "ai_test_connection",
      "ai_transcribe",
    ]);
    for (const [, , returned] of commands) expect(["KeyStatus", "ConnectionReport", "AiResult"]).toContain(returned);
    expect(rust).not.toMatch(/println!|eprintln!|dbg!|log::/);
  });
});
