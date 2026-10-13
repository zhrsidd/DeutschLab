// @vitest-environment node
import { copyFileSync, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetTestDatabase, useTestDatabaseFile } from "../test/fakeSqlPlugin";

vi.mock("@tauri-apps/plugin-sql", async () => import("../test/fakeSqlPlugin"));

/*
 * Snapshots while the live database is in WAL mode with commits that have
 * not been checkpointed into the main file yet: the situation in the real
 * app, where the SQL plugin keeps connections open all session.
 */

type Db = typeof import("./db");

let db: Db;
let dir: string;
let source: string;
let app: DatabaseSync;

const TABLES = [
  "task_progress",
  "lesson_attempts",
  "checkpoint_attempts",
  "review_items",
  "mistakes",
  "app_state",
] as const;

const rowsOf = (conn: DatabaseSync, table: string) =>
  conn.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();

beforeEach(async () => {
  vi.resetModules();
  dir = mkdtempSync(join(tmpdir(), "deutschlab-wal-test-"));
  source = join(dir, "deutschlab.db");

  app = useTestDatabaseFile(source);
  app.exec("PRAGMA journal_mode = WAL");
  // Keep every commit in the WAL file, as a busy session would.
  app.exec("PRAGMA wal_autocheckpoint = 0");

  db = await import("./db");
  await db.initialiseDatabase();

  // Recent learner activity, written through the app's own functions.
  await db.markTaskComplete("vocab-004");
  await db.saveLessonAttempt("grammar-009", 15, 16);
  await db.saveWritingDraft("writing-003", "Ich heiße Omar. Ich fahre Fahrrad.");
  await db.saveVocabResume("vocab-004", 5);
  for (let i = 0; i < 300; i += 1) {
    await db.recordAnswer({
      sourceType: "grammar",
      sourceId: `iv-c-siehst-${i}`,
      category: "grammar",
      prompt: `p${i}`,
      expected: "siehst",
      userAnswer: "sehst",
      correct: false,
    });
  }
});

afterEach(() => {
  resetTestDatabase();
  rmSync(dir, { recursive: true, force: true });
});

describe("database snapshot in WAL mode", () => {
  it("starts from a database whose recent commits are only in the WAL file", () => {
    expect(app.prepare("PRAGMA journal_mode").get()).toEqual({ journal_mode: "wal" });
    expect(statSync(`${source}-wal`).size).toBeGreaterThan(100_000);

    // Why a plain copy of deutschlab.db is not a backup: it misses those commits.
    const naive = join(dir, "naive-copy.db");
    copyFileSync(source, naive);
    const copy = new DatabaseSync(naive, { readOnly: true });
    const copied = copy.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'review_items'").get() as {
      n: number;
    };
    const copiedReviews = copied.n
      ? (copy.prepare("SELECT COUNT(*) AS n FROM review_items").get() as { n: number }).n
      : 0;
    copy.close();
    expect(copiedReviews).toBeLessThan(300);
  });

  it("captures every uncheckpointed commit, record for record (app connection)", async () => {
    const snapshot = join(dir, "deutschlab-snapshot.db");
    await db.snapshotDatabase(snapshot);

    // The WAL was not checkpointed by taking the snapshot.
    expect(statSync(`${source}-wal`).size).toBeGreaterThan(100_000);

    const copy = new DatabaseSync(snapshot, { readOnly: true });
    expect(copy.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
    for (const table of TABLES) expect(rowsOf(copy, table), table).toEqual(rowsOf(app, table));
    expect((copy.prepare("SELECT COUNT(*) AS n FROM review_items").get() as { n: number }).n).toBe(300);
    copy.close();
  });

  it("is also consistent from a second connection, as the plugin's pool may use", () => {
    const pooled = new DatabaseSync(source);
    const snapshot = join(dir, "deutschlab-pooled.db");
    pooled.prepare("VACUUM INTO ?").run(snapshot);
    pooled.close();

    const copy = new DatabaseSync(snapshot, { readOnly: true });
    expect(copy.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
    for (const table of TABLES) expect(rowsOf(copy, table), table).toEqual(rowsOf(app, table));
    copy.close();
  });

  it("does not change the source database", async () => {
    const before = TABLES.map((table) => rowsOf(app, table));
    await db.snapshotDatabase(join(dir, "s.db"));
    expect(TABLES.map((table) => rowsOf(app, table))).toEqual(before);
  });

  it("restores by hand exactly as documented, and the app opens the result", async () => {
    const snapshot = join(dir, "deutschlab-2026-10-13-190000.db");
    await db.snapshotDatabase(snapshot);
    const expected = TABLES.map((table) => rowsOf(app, table));

    // 1. Quit the app (the last connection closes).
    resetTestDatabase();
    // 2. Move deutschlab.db, -wal and -shm somewhere safe.
    const aside = join(dir, "aside");
    rmSync(aside, { recursive: true, force: true });
    for (const suffix of ["", "-wal", "-shm"]) {
      if (existsSync(`${source}${suffix}`)) {
        copyFileSync(`${source}${suffix}`, `${aside}${suffix}`);
        rmSync(`${source}${suffix}`);
      }
    }
    // 3. Copy the snapshot in as deutschlab.db.
    copyFileSync(snapshot, source);

    // 4. Open DeutschLab again: start-up migrations run on the restored file.
    vi.resetModules();
    const reopened = useTestDatabaseFile(source);
    const restartedDb: Db = await import("./db");
    await restartedDb.initialiseDatabase();
    await restartedDb.initialiseDatabase();

    expect(reopened.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
    expect(TABLES.map((table) => rowsOf(reopened, table))).toEqual(expected);
    expect(await restartedDb.getCompletedTaskIds()).toEqual(["vocab-004"]);
    expect(await restartedDb.getWritingDraft("writing-003")).toBe("Ich heiße Omar. Ich fahre Fahrrad.");
    expect(await restartedDb.getVocabResume("vocab-004")).toBe(5);
    // The set-aside original is still there, untouched.
    expect(existsSync(aside)).toBe(true);
  });
});
