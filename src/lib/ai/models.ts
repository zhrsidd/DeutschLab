/*
 * Model registry with capability declarations. Only models verified (from
 * Google's model and pricing pages, October 2026) to exist and to be offered
 * on the Gemini API free tier are listed. src-tauri/src/ai.rs refuses any
 * other id; a test keeps the two lists identical.
 *
 * Nothing is ever switched automatically: if a model disappears, the learner
 * picks another eligible one in Settings.
 */

export type Capability = "text" | "structured" | "audio_input" | "transcription";

export interface ModelInfo {
  id: string;
  label: string;
  capabilities: Capability[];
  note: string;
}

export const GEMINI_MODELS: ModelInfo[] = [
  {
    id: "gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash-Lite",
    capabilities: ["text", "structured", "audio_input"],
    note: "Fast and light. A good default for the tutor.",
  },
  {
    id: "gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    capabilities: ["text", "structured", "audio_input"],
    note: "More capable reasoning; slower. A good default for assessment.",
  },
  {
    id: "gemini-3.5-transcribe",
    label: "Gemini 3.5 Transcribe",
    capabilities: ["transcription"],
    note: "Dedicated speech-to-text, verbatim German.",
  },
];

/** The job a model is chosen for, and what that job needs. */
export type ModelRole = "writing" | "speaking" | "tutor" | "transcription";

const NEEDS: Record<ModelRole, (model: ModelInfo) => boolean> = {
  writing: (m) => m.capabilities.includes("structured"),
  speaking: (m) => m.capabilities.includes("structured"),
  tutor: (m) => m.capabilities.includes("structured"),
  // A dedicated transcriber, or a general model that accepts audio.
  transcription: (m) => m.capabilities.includes("transcription") || m.capabilities.includes("audio_input"),
};

export const DEFAULT_MODELS: Record<ModelRole, string> = {
  writing: "gemini-3.8-flash",
  speaking: "gemini-3.8-flash",
  tutor: "gemini-3.5-flash-lite",
  transcription: "gemini-3.5-transcribe",
};

export const modelsFor = (role: ModelRole) => GEMINI_MODELS.filter(NEEDS[role]);

export const isEligible = (role: ModelRole, id: string) => modelsFor(role).some((m) => m.id === id);

export const modelLabel = (id: string) => GEMINI_MODELS.find((m) => m.id === id)?.label ?? id;
