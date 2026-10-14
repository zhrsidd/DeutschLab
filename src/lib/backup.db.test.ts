import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../test/fakeSqlPlugin";

vi.mock("@tauri-apps/plugin-sql", async () => import("../test/fakeSqlPlugin"));

const tauri = vi.hoisted(() => ({
  isTauri: false,
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => tauri.isTauri,
  invoke: (...args: unknown[]) => tauri.invoke(...args),
}));

type Db = typeof import("./db");
type Backup = typeof import("./backup");

let db: Db;
let backup: Backup;
let scratch: string;

const NOW = new Date(2026, 9, 13, 18, 30, 5);

async function seedLearner() {
  await db.markTaskComplete("vocab-001");
  await db.markTaskComplete("checkpoint-003");
  await db.saveLessonAttempt("grammar-009", 14, 16);
  await db.recordAnswer({
    sourceType: "grammar", sourceId: "pr-c-mich", category: "grammar",
    prompt: "p", expected: "mich", userAnswer: "ich", correct: false,
  });
  await db.saveCheckpointAttempt("checkpoint-004", {
    total: 34, possible: 39, percent: 87, overallPassed: true, passed: true, weakSections: [],
    sections: [
      { key: "vocabulary", label: "", score: 7, max: 8, required: 6, passed: true },
      { key: "grammar", label: "", score: 11, max: 12, required: 9, passed: true },
      { key: "reading", label: "", score: 4, max: 4, required: 0, passed: true },
      { key: "listening", label: "", score: 3, max: 4, required: 2, passed: true },
      { key: "writing", label: "", score: 5, max: 6, required: 4, passed: true },
      { key: "speaking", label: "", score: 4, max: 5, required: 3, passed: true },
    ],
  });
  await db.saveWritingDraft("writing-003", "Ich heiße Omar.");
  await db.setStudyMinutes(45);
  await db.saveVocabResume("vocab-004", 3);
}

const dump = () =>
  db.LEARNER_TABLES.map((table) => getTestDatabase().prepare(`SELECT * FROM ${table}`).all());

beforeEach(async () => {
  vi.resetModules();
  resetTestDatabase();
  window.localStorage.clear();
  tauri.isTauri = false;
  tauri.invoke.mockReset();
  scratch = mkdtempSync(join(tmpdir(), "deutschlab-backup-test-"));
  db = await import("./db");
  backup = await import("./backup");
  await db.initialiseDatabase();
});

afterEach(() => {
  rmSync(scratch, { recursive: true, force: true });
});

describe("JSON export", () => {
  it("captures progress, attempts, checkpoints, reviews, mistakes, drafts, settings and resume positions", async () => {
    await seedLearner();
    window.localStorage.setItem("deutschlab:vocab-resume:vocab-003", "2");
    window.localStorage.setItem("unrelated", "x");

    const exported = await backup.buildBackup(NOW);

    expect(exported).toMatchObject({
      format: "deutschlab-backup",
      version: 3,
      exportedAt: NOW.toISOString(),
      app: { name: "DeutschLab", version: "1.0.0" },
    });
    expect(exported.tables.task_progress.map((row) => row.task_id)).toEqual(["vocab-001", "checkpoint-003"]);
    expect(exported.tables.lesson_attempts).toHaveLength(1);
    expect(exported.tables.checkpoint_attempts[0]).toMatchObject({ checkpoint_id: "checkpoint-004", total_score: 34 });
    expect(exported.tables.review_items[0]).toMatchObject({ source_id: "pr-c-mich" });
    expect(exported.tables.mistakes[0]).toMatchObject({ item_key: "grammar:pr-c-mich", times_missed: 1 });
    expect(Object.fromEntries(exported.tables.app_state.map((row) => [row.key, row.value]))).toEqual({
      "writing_draft:writing-003": "Ich heiße Omar.",
      study_minutes: "45",
      "vocab_resume:vocab-004": "3",
    });
    expect(exported.browserStorage).toEqual({ "deutschlab:vocab-resume:vocab-003": "2" });
  });

  it("round-trips through JSON and passes its own validation", async () => {
    await seedLearner();
    const text = backup.serializeBackup(await backup.buildBackup(NOW));
    const result = backup.validateBackup(JSON.parse(text));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.counts).toEqual({
        task_progress: 2, lesson_attempts: 1, checkpoint_attempts: 1,
        review_items: 1, mistakes: 1, app_state: 3, study_events: 0,
        ai_assessments: 0, ai_tutor_sessions: 0, ai_usage: 0,
      });
    }
  });

  it("never changes the database", async () => {
    await seedLearner();
    const before = JSON.stringify(dump());

    await backup.buildBackup(NOW);
    await backup.exportBackup(NOW).catch(() => undefined);

    expect(JSON.stringify(dump())).toBe(before);
  });

  it("downloads the file in a browser, named by date", async () => {
    const createObjectURL = vi.fn(() => "blob:test");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const saved = await backup.exportBackup(NOW);

    expect(saved).toEqual({ kind: "download", fileName: "deutschlab-backup-2026-10-13-183005.json" });
    expect(click).toHaveBeenCalledTimes(1);
    expect(tauri.invoke).not.toHaveBeenCalled();
  });

  it("writes into the app's backups folder in the native app", async () => {
    tauri.isTauri = true;
    tauri.invoke.mockResolvedValue("/Users/me/Library/Application Support/com.deutschlab.app/backups/x.json");
    await seedLearner();

    const saved = await backup.exportBackup(NOW);

    expect(saved.kind).toBe("file");
    const [command, args] = tauri.invoke.mock.calls[0] as [string, { fileName: string; contents: string }];
    expect(command).toBe("write_backup_file");
    expect(args.fileName).toBe("deutschlab-backup-2026-10-13-183005.json");
    expect(backup.validateBackup(JSON.parse(args.contents)).ok).toBe(true);
  });
});

describe("JSON export completeness", () => {
  it("covers every table in the schema, every row and every column", async () => {
    await seedLearner();
    const sql = getTestDatabase();
    const schemaTables = (
      sql.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all() as {
        name: string;
      }[]
    ).map((row) => row.name);

    // A new table must be added to LEARNER_TABLES (and so to backups).
    expect([...db.LEARNER_TABLES].sort()).toEqual(schemaTables);

    const exported = await backup.buildBackup(NOW);
    for (const table of schemaTables) {
      const raw = sql.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
      expect(exported.tables[table as keyof typeof exported.tables], table).toEqual(raw.map((row) => ({ ...row })));
    }
  });
});

describe("backup versions", () => {
  it("still accepts a version 1 file, which has no study_events table", async () => {
    const current = JSON.parse(backup.serializeBackup(await backup.buildBackup(NOW)));
    const { study_events: _dropped, ...v1Tables } = current.tables;
    const result = backup.validateBackup({ ...current, version: 1, tables: v1Tables });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.counts.study_events).toBe(0);
  });

  it("still accepts a version 2 file, which has no AI tables (AI v1.1)", async () => {
    const current = JSON.parse(backup.serializeBackup(await backup.buildBackup(NOW)));
    const { ai_assessments: _a, ai_tutor_sessions: _b, ai_usage: _c, ...v2Tables } = current.tables;
    const result = backup.validateBackup({ ...current, version: 2, tables: v2Tables });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.counts).toMatchObject({ ai_assessments: 0, ai_tutor_sessions: 0, ai_usage: 0, study_events: 0 });
    }
  });

  it("requires the AI tables from version 3 on", async () => {
    const current = JSON.parse(backup.serializeBackup(await backup.buildBackup(NOW)));
    const { ai_usage: _dropped, ...tables } = current.tables;
    expect(backup.validateBackup({ ...current, tables }).ok).toBe(false);
  });

  it("requires study_events from version 2 on", async () => {
    const current = JSON.parse(backup.serializeBackup(await backup.buildBackup(NOW)));
    const { study_events: _dropped, ...tables } = current.tables;
    expect(backup.validateBackup({ ...current, tables }).ok).toBe(false);
  });
});

describe("backup validation rejects bad input", () => {
  const valid = async () => JSON.parse(backup.serializeBackup(await backup.buildBackup(NOW)));

  it.each([
    ["not an object", () => "hello", /Not a DeutschLab backup/],
    ["wrong format", (b: Record<string, unknown>) => ({ ...b, format: "other" }), /Not a DeutschLab backup/],
    ["a newer version", (b: Record<string, unknown>) => ({ ...b, version: 4 }), /newer than this app/],
    ["a bad date", (b: Record<string, unknown>) => ({ ...b, exportedAt: "yesterday" }), /export date/],
    [
      "a missing table",
      (b: Record<string, unknown>) => ({ ...b, tables: { ...(b.tables as object), mistakes: undefined } }),
      /Table mistakes is missing/,
    ],
    [
      "a row without a required column",
      (b: Record<string, unknown>) => ({
        ...b,
        tables: { ...(b.tables as object), task_progress: [{ completed: 1 }] },
      }),
      /task_progress has no task_id/,
    ],
    [
      "malformed browser storage",
      (b: Record<string, unknown>) => ({ ...b, browserStorage: { a: 1 } }),
      /browser-storage/,
    ],
  ])("%s", async (_label, mutate, message) => {
    const result = backup.validateBackup(mutate(await valid()));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(message);
  });
});

describe("database snapshot", () => {
  it("writes an exact, readable copy of every table (VACUUM INTO)", async () => {
    await seedLearner();
    const path = join(scratch, "deutschlab-2026-10-13-183005.db");

    await db.snapshotDatabase(path);

    const copy = new DatabaseSync(path, { readOnly: true });
    for (const table of db.LEARNER_TABLES) {
      expect(copy.prepare(`SELECT * FROM ${table}`).all(), table).toEqual(
        getTestDatabase().prepare(`SELECT * FROM ${table}`).all(),
      );
    }
    expect(copy.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
    copy.close();
  });

  it("refuses to overwrite an existing snapshot", async () => {
    const path = join(scratch, "taken.db");
    await db.snapshotDatabase(path);

    await expect(db.snapshotDatabase(path)).rejects.toThrow();
  });

  it("asks the native side for a fresh path, then snapshots into it", async () => {
    tauri.isTauri = true;
    const path = join(scratch, "deutschlab-2026-10-13-183005.db");
    tauri.invoke.mockResolvedValue(path);

    expect(await backup.createSnapshot(NOW)).toBe(path);
    expect(tauri.invoke.mock.calls).toEqual([
      ["backup_path", { fileName: "deutschlab-2026-10-13-183005.db" }],
      // Verified and fsynced only after VACUUM INTO has written it.
      ["seal_backup_file", { fileName: "deutschlab-2026-10-13-183005.db" }],
    ]);
  });

  it("is not offered in a plain browser", async () => {
    expect(backup.canSnapshot()).toBe(false);
    await expect(backup.createSnapshot(NOW)).rejects.toThrow(/need the DeutschLab app/);
  });
});
