# DeutschLab AI architecture (v1.1)

Optional, advisory AI on top of a local-first app. Lessons, checkpoints, Review and the planner never
depend on it. Provider: Google Gemini (Interactions API). See also `AI_ASSESSMENT.md` and `AI_PRIVACY.md`.

## Layers

```
React (webview)                         Rust (src-tauri/src/ai.rs)                Google
──────────────────────────────          ─────────────────────────────            ───────────────
components/ai/*  ── lib/ai/native.ts ──▶ 6 narrow Tauri commands  ──HTTPS──▶  generativelanguage
lib/ai/{assessment,tutor}.ts             Keychain (Security.framework)           .googleapis.com
lib/ai/request.ts  (guard + usage log)   fixed host, key in header,              /v1beta/interactions
lib/ai/schemas.ts  (runtime validation)  store:false, model allowlist            /v1beta/models
lib/ai/store.ts    (SQLite history)
```

- **The key never enters the webview.** `ai_save_key(key)` writes it to the macOS Keychain (generic
  password, service `com.deutschlab.app.gemini`). `ai_key_status()` returns `{ stored, hint }` where
  `hint` is `••••` plus the last four characters. No command returns the key; it is not stored in
  SQLite, `app_state`, backups, localStorage or logs. Rust redacts it from any error text.
- **No generic proxy.** The webview can only ask for: key status / save / remove, a model list
  (Test connection), `ai_generate` (system instruction + text turns + optional JSON schema) and
  `ai_transcribe` (base64 audio + MIME type). URL, headers and request shape are fixed in Rust.
- **Transport.** `reqwest` with native-tls (macOS Security.framework). Header `x-goog-api-key`, never a
  query string. Every request sets `store: false`. Timeouts: 90 s generate, 120 s transcribe, 20 s list.
- **Request limits enforced in Rust:** text models only from `TEXT_MODELS`, transcription only from
  `TRANSCRIBE_MODELS` (or a text model as audio fallback); ≤ 40 turns, ≤ 12 000 chars per turn,
  ≤ 80 000 chars total; audio MIME allowlist, ≤ 8 MB decoded, ≥ 512 bytes.

## Provider abstraction

Small, not a plugin system. `lib/ai/types.ts` holds provider-neutral shapes (`AssessmentFeedback`,
`TutorSession`, `ProviderResult`, rubric). `lib/ai/native.ts` is the only transport; a second provider
would add Rust commands with the same request/response types and a `ProviderId`. React never sees a
Gemini response shape: Rust extracts text and token usage.

| Concept (spec) | Where |
|---|---|
| testConnection / listAvailableModels | `ai_test_connection` (lists `gemini-*` models the key can see) |
| evaluateWriting | `assessment.ts` → `assessWriting` |
| transcribeAudio | `assessment.ts` → `transcribeRecording` → `ai_transcribe` |
| evaluateSpeaking | `assessment.ts` → `assessSpeaking` (transcript-based) |
| generateTutorResponse | `tutor.ts` → `sendTutorTurn`, `summariseSession` |

## Models (capability-based)

`lib/ai/models.ts` declares capabilities; Rust mirrors the ids (a Vitest test keeps them identical).
Verified against Google's model and pricing pages (October 2026) as existing and free-tier eligible:

| Model | Capabilities | Default for |
|---|---|---|
| `gemini-3.5-flash-lite` | text, structured, audio input | Tutor |
| `gemini-3.8-flash` | text, structured, audio input | Writing and speaking feedback |
| `gemini-3.5-transcribe` | transcription (verbatim, `de-DE`) | Speech transcription |

The learner can pick another eligible model per role in Settings. DeutschLab never switches model or
provider automatically. Preview, Pro and paid-only models are not listed and are refused by Rust.
Test connection shows which DeutschLab models the key can actually see. Availability and quotas can
change; update both lists together.

## Requests and limits (`lib/ai/request.ts`)

Before sending: native app, AI enabled, privacy notice accepted, today's local request count below the
daily limit. Every request that left the Mac is logged in `ai_usage` (outcome, model, reported tokens).
No automatic retry; on HTTP 429 the `Retry-After` header or `RetryInfo.retryDelay` is shown and the
learner retries manually.

| Safeguard | Default | Range |
|---|---|---|
| Requests per day (local day) | 20 | 1–20 |
| Tutor turns per conversation | 15 | 3–15 |
| Recording length | 180 s | 30–180 s (tutor voice turns: 60 s) |
| Writing / transcript length | 1 000 words | fixed |
| Tutor message | 600 chars | fixed; history window 12 messages |

These are app safeguards, not Google quotas, and cannot guarantee zero cost if billing is enabled on
the Google project. Keeping the project on the free tier is the real protection.

## Curriculum context (`lib/ai/context.ts`)

Built from completions and open-mistake counts only: current week (first un-mastered week), weeks in
scope, completed lessons, mastered weeks (checkpoint passed), grammar and topics per week (summarised
from `CURRICULUM.md` Weeks 1–4), grammar not yet taught (Weeks 5+, adjective endings), lessons with
open mistakes, the lesson catalogue the model may recommend (in scope, no checkpoints) and, for the
tutor only, up to 320 introduced vocabulary items. The full curriculum and database are never sent.

## SQLite (additive, idempotent; `initialiseDatabase`)

| Table | Holds |
|---|---|
| `ai_assessments` | id, task, kind, time, provider, model, rubric version, assessed text, input source (typed / model transcript / edited), original transcript, validated feedback JSON, score, max, `revision_of` |
| `ai_tutor_sessions` | id, mode, topic, level, grammar focus, correction mode, week, model, times, messages JSON, summary JSON |
| `ai_usage` | time, feature, model, outcome, error kind, input/output tokens |

No raw API responses, audio or credentials. AI settings live in `app_state` (`ai_settings`). All three
tables are in `LEARNER_TABLES`; backup format version 3 (versions 1 and 2 still validate). Settings →
AI feedback → Delete AI history clears the three tables and nothing else.

## Native integration

- `src-tauri/Info.plist` adds `NSMicrophoneUsageDescription` (merged into the bundle by Tauri).
- Recording uses `MediaRecorder` in the webview (WKWebView: AAC/`audio/mp4`, sent as `audio/m4a`).
  The recording lives in memory as one Blob and is released on Delete or when the screen closes.
- Apple Speech recognition was considered but needs a native bridge and entitlements; Gemini 3.5
  Transcribe was chosen as the first path. It can be added later behind `transcription`.

## Future providers

Add Rust commands for the provider with the same request/response structs, a `ProviderId`, its model
entries with capabilities, and a Settings block. Local models are out of scope on 8 GB hardware.
