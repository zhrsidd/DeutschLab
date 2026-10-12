import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

import { installFakeSpeech } from "./fakeSpeech";

// DB tests run in the node environment, where there is no window.
const hasWindow = typeof window !== "undefined";

beforeEach(() => {
  // Default: a German voice is available. Tests can call removeGermanVoices().
  if (hasWindow) installFakeSpeech();
});

afterEach(() => {
  if (hasWindow) cleanup();
});
