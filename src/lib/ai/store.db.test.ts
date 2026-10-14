// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../../test/fakeSqlPlugin";

vi.mock("@tauri-apps/plugin-sql", async () => import("../../test/fakeSqlPlugin"));

const tauri = vi.hoisted(() => ({ isTauri: true, invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => tauri.isTauri,
  invoke: (...args: unknown[]) => tauri.invoke(...args),
}));

type Db = typeof import("../db");
type Store = typeof import("./store");
type Settings = typeof import("./settings");
type Request = typeof import("./request");

let db: Db;
let store: Store;
let settings: Settings;
let request: Request;

const rows = (sql: string) => getTestDatabase().prepare(sql).all();

beforeEach(async () => {
  vi.resetModules();
  resetTestDatabase();
  tauri.isTauri = true;
  tauri.invoke.mockReset();
  db = await import("../db");
  store = await import("./store");
  settings = await import("./settings");
  request = await import("./request");
  await db.initialiseDatabase();
});

const feedback = {
  rubricVersion: "dl-rubric-1",
  scores: {
    grammar: { score: 3, comment: "" },
    vocabulary: { score: 4, comment: "" },
    task_completion: { score: 3, comment: "" },
    coherence: { score: 4, comment: "" },
  },
  total: 14,
  maxTotal: 20,
  strengths: [],
  improvements: [],
  corrections: [],
  missedRequirements: [],
  revisedText: "",
  recommendedLessons: [],
  uncertaintyNotes: [],
  validationNotes: [],
};

const record = (id: string, createdAt: string, revisionOf: string | null = null) => ({
  id,
  taskId: "writing-003",
  kind: "writing" as const,
  createdAt,
  provider: "gemini" as const,
  model: "gemini-3.8-flash",
  rubricVersion: "dl-rubric-1",
  inputText: "Ich habe einen Bruder.",
  inputSource: "typed" as const,
  originalTranscript: null,
  feedback,
  score: 14,
  maxScore: 20,
  revisionOf,
});

describe("AI migration", () => {
  it("adds the AI tables to an existing database without touching learner rows, and is idempotent", async () => {
    await db.markTaskComplete("vocab-001");
    await db.saveLessonAttempt("grammar-007", 9, 10);
    await db.saveWritingDraft("writing-003", "Ich heiße Omar.");
    const before = JSON.stringify([rows("SELECT * FROM task_progress"), rows("SELECT * FROM lesson_attempts"), rows("SELECT * FROM app_state")]);

    await db.initialiseDatabase();
    await db.initialiseDatabase();

    expect(JSON.stringify([rows("SELECT * FROM task_progress"), rows("SELECT * FROM lesson_attempts"), rows("SELECT * FROM app_state")])).toBe(before);
    const tables = rows(`SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'ai_%' ORDER BY name`).map((r) => (r as { name: string }).name);
    expect(tables).toEqual(["ai_assessments", "ai_tutor_sessions", "ai_usage"]);
  });

  it("has no column that could hold a credential", () => {
    for (const table of ["ai_assessments", "ai_tutor_sessions", "ai_usage"]) {
      const columns = rows(`PRAGMA table_info(${table})`).map((c) => (c as { name: string }).name);
      expect(columns.join(" "), table).not.toMatch(/key|secret|token_value|auth|header/i);
    }
  });
});

describe("assessment history", () => {
  it("saves, lists newest first with revision links, and deletes only AI data", async () => {
    await db.markTaskComplete("writing-003");
    await store.saveAssessment(record("a1", "2026-10-14T10:00:00.000Z"));
    await store.saveAssessment(record("a2", "2026-10-14T11:00:00.000Z", "a1"));

    const listed = await store.listAssessments("writing-003");
    expect(listed.map((r) => r.id)).toEqual(["a2", "a1"]);
    expect(listed[0]).toMatchObject({ revisionOf: "a1", score: 14, feedback: { total: 14 } });
    expect(await store.listAssessments("writing-002")).toEqual([]);

    await store.deleteAllAIHistory();
    expect(await store.listAssessments("writing-003")).toEqual([]);
    expect(await db.getCompletedTaskIds()).toEqual(["writing-003"]);
  });

  it("skips a damaged row instead of showing a score", async () => {
    await store.saveAssessment(record("a1", "2026-10-14T10:00:00.000Z"));
    getTestDatabase().prepare(`UPDATE ai_assessments SET feedback_json = '{broken'`).run();
    expect(await store.listAssessments("writing-003")).toEqual([]);
  });

  it("is included in backups", async () => {
    await store.saveAssessment(record("a1", "2026-10-14T10:00:00.000Z"));
    const exported = await db.exportLearnerTables();
    expect(exported.ai_assessments).toHaveLength(1);
  });
});

describe("tutor sessions", () => {
  it("upserts a session as it grows", async () => {
    const session = {
      id: "t1",
      mode: "guided" as const,
      topic: "Family",
      level: "gentle" as const,
      grammarFocus: null,
      correctionMode: "immediate" as const,
      contextWeek: 4,
      model: "gemini-3.5-flash-lite",
      startedAt: "2026-10-14T10:00:00.000Z",
      updatedAt: "2026-10-14T10:00:00.000Z",
      messages: [{ id: "m1", role: "tutor" as const, text: "Hallo!", at: "2026-10-14T10:00:00.000Z" }],
      summary: null,
    };
    await store.saveTutorSession(session);
    await store.saveTutorSession({
      ...session,
      correctionMode: "delayed",
      updatedAt: "2026-10-14T10:05:00.000Z",
      messages: [...session.messages, { id: "m2", role: "learner", text: "Hallo", at: "2026-10-14T10:05:00.000Z" }],
    });

    const [saved] = await store.listTutorSessions();
    expect(saved).toMatchObject({ id: "t1", correctionMode: "delayed" });
    expect(saved.messages).toHaveLength(2);

    await store.deleteTutorSession("t1");
    expect(await store.listTutorSessions()).toEqual([]);
  });
});

describe("settings", () => {
  it("is off by default and clamps limits to the safe range", async () => {
    expect(await settings.loadAISettings()).toMatchObject({ enabled: false, consentedAt: null, dailyRequestLimit: 20 });
    const saved = await settings.updateAISettings({ dailyRequestLimit: 500, tutorTurnLimit: 1, maxRecordingSeconds: 9999 });
    expect(saved).toMatchObject({ dailyRequestLimit: 20, tutorTurnLimit: 3, maxRecordingSeconds: 180 });
  });

  it("refuses unknown or paid models", () => {
    const clean = settings.sanitiseSettings({ models: { writing: "gemini-4-argon", tutor: "gemini-3.8-flash" } });
    expect(clean.models.writing).toBe("gemini-3.8-flash");
    expect(clean.models.tutor).toBe("gemini-3.8-flash");
  });
});

describe("request guard and usage", () => {
  const ok = { text: "{}", model: "gemini-3.8-flash", inputTokens: 100, outputTokens: 40 };
  const enable = () => settings.updateAISettings({ enabled: true, consentedAt: "2026-10-14T09:00:00.000Z" });

  it("refuses when disabled or without consent, and sends nothing", async () => {
    const send = vi.fn().mockResolvedValue(ok);
    await expect(request.runAIRequest({ feature: "writing", model: "gemini-3.8-flash", send, validate: () => 1 })).rejects.toMatchObject({ kind: "disabled" });
    await settings.updateAISettings({ enabled: true });
    await expect(request.runAIRequest({ feature: "writing", model: "gemini-3.8-flash", send, validate: () => 1 })).rejects.toMatchObject({ kind: "consent_required" });
    expect(send).not.toHaveBeenCalled();
    expect(rows("SELECT * FROM ai_usage")).toEqual([]);
  });

  it("logs every sent request with tokens and stops at the daily limit", async () => {
    await enable();
    await settings.updateAISettings({ dailyRequestLimit: 2 });
    const send = vi.fn().mockResolvedValue(ok);

    await request.runAIRequest({ feature: "writing", model: "gemini-3.8-flash", send, validate: () => 1 });
    await expect(
      request.runAIRequest({ feature: "tutor", model: "gemini-3.8-flash", send, validate: () => { throw new Error("bad"); } }),
    ).rejects.toMatchObject({ kind: "invalid_output" });
    await expect(request.runAIRequest({ feature: "tutor", model: "gemini-3.8-flash", send, validate: () => 1 })).rejects.toMatchObject({ kind: "daily_limit" });

    expect(send).toHaveBeenCalledTimes(2);
    expect(rows("SELECT feature, outcome, input_tokens, output_tokens FROM ai_usage ORDER BY id")).toEqual([
      { feature: "writing", outcome: "ok", input_tokens: 100, output_tokens: 40 },
      { feature: "tutor", outcome: "invalid_output", input_tokens: 100, output_tokens: 40 },
    ]);
  });

  it("records a 429 once, never retries and never switches model", async () => {
    await enable();
    const send = vi.fn().mockRejectedValue({ kind: "rate_limited", retry_after_seconds: 30 });
    await expect(request.runAIRequest({ feature: "writing", model: "gemini-3.8-flash", send, validate: () => 1 })).rejects.toMatchObject({
      kind: "rate_limited",
      retryAfterSeconds: 30,
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(rows("SELECT model, outcome FROM ai_usage")).toEqual([{ model: "gemini-3.8-flash", outcome: "rate_limited" }]);

    const summary = await store.getUsageSummary();
    expect(summary).toMatchObject({ today: 1, requests: 1, rateLimited: 1, successes: 0 });
  });

  it("does not count requests that never left the Mac", async () => {
    await enable();
    const send = vi.fn().mockRejectedValue({ kind: "no_key" });
    await expect(request.runAIRequest({ feature: "writing", model: "gemini-3.8-flash", send, validate: () => 1 })).rejects.toMatchObject({ kind: "no_key" });
    expect(await store.countRequestsToday()).toBe(0);
  });

  it("counts today's requests by local day and ignores connection tests", async () => {
    const now = new Date(2026, 9, 14, 12, 0);
    await store.recordUsage({ feature: "writing", model: "m", outcome: "ok", at: new Date(2026, 9, 13, 23, 59) });
    await store.recordUsage({ feature: "writing", model: "m", outcome: "ok", at: new Date(2026, 9, 14, 0, 1) });
    await store.recordUsage({ feature: "connection", model: "models.list", outcome: "ok", at: new Date(2026, 9, 14, 9, 0) });
    expect(await store.countRequestsToday(now)).toBe(1);
  });
});
