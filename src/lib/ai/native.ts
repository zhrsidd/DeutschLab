/*
 * The only bridge between the webview and the AI provider. Each function
 * maps to one narrow Tauri command in src-tauri/src/ai.rs. No command
 * returns the API key; the key goes in once (saveKey) and never comes back.
 */

import { invoke, isTauri } from "@tauri-apps/api/core";

import { AIError, toAIError } from "./errors";
import type { ProviderResult } from "./types";

export interface KeyStatus {
  stored: boolean;
  /** "••••abcd": the last four characters only. */
  hint: string | null;
}

export interface GenerateArgs {
  model: string;
  systemInstruction: string;
  turns: { role: "user" | "model"; text: string }[];
  responseSchema?: object;
  maxOutputTokens: number;
  temperature: number;
}

/** True where the native AI layer exists (the DeutschLab app, not a browser). */
export const nativeAIAvailable = () => isTauri();

async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!nativeAIAvailable()) throw new AIError("unavailable");

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw toAIError(error);
  }
}

export const getKeyStatus = () => call<KeyStatus>("ai_key_status");

export const saveKey = (key: string) => call<KeyStatus>("ai_save_key", { key });

export const removeKey = () => call<KeyStatus>("ai_remove_key");

export const testConnection = () => call<{ models: string[] }>("ai_test_connection");

export const generate = (request: GenerateArgs) =>
  call<ProviderResult>("ai_generate", {
    request: { ...request, responseSchema: request.responseSchema ?? null },
  });

export const transcribe = (request: { model: string; audioBase64: string; mimeType: string }) =>
  call<ProviderResult>("ai_transcribe", { request });
