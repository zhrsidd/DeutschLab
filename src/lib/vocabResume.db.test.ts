import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTestDatabase, resetTestDatabase } from "../test/fakeSqlPlugin";

vi.mock("@tauri-apps/plugin-sql", async () => import("../test/fakeSqlPlugin"));

import {
  week2VocabularySet,
  week3VocabularySet,
  week4VocabularySet,
} from "../data/lessons/vocabularySets";

type Db = typeof import("./db");
type Resume = typeof import("./vocabResume");

let db: Db;
let resume: Resume;

const stored = (key: string) =>
  (getTestDatabase().prepare(`SELECT value FROM app_state WHERE key = ?`).get(key) as
    | { value: string }
    | undefined)?.value;

beforeEach(async () => {
  vi.resetModules();
  resetTestDatabase();
  window.localStorage.clear();
  db = await import("./db");
  resume = await import("./vocabResume");
  await db.initialiseDatabase();
});

describe("vocabulary resume position in SQLite", () => {
  it("saves, reads back and clears the position in app_state", async () => {
    await resume.saveResumeBatch(week4VocabularySet, 3);

    expect(stored("vocab_resume:vocab-004")).toBe("3");
    expect(await db.getVocabResume("vocab-004")).toBe(3);
    expect(await resume.loadResumeBatch(week4VocabularySet)).toBe(3);

    await resume.saveResumeBatch(week4VocabularySet, null);
    expect(stored("vocab_resume:vocab-004")).toBeUndefined();
    expect(await resume.loadResumeBatch(week4VocabularySet)).toBe(0);
  });

  it("survives a restart: a fresh module load reads the saved position", async () => {
    await resume.saveResumeBatch(week3VocabularySet, 4);
    window.localStorage.clear(); // e.g. a different WebKit origin after bundling

    vi.resetModules();
    const reloaded = await import("./vocabResume");
    expect(await reloaded.loadResumeBatch(week3VocabularySet)).toBe(4);
  });

  it("copies a pre-v1.0 localStorage position into SQLite without deleting it", async () => {
    window.localStorage.setItem("deutschlab:vocab-resume:vocab-003", "2");

    expect(await resume.loadResumeBatch(week3VocabularySet)).toBe(2);
    expect(stored("vocab_resume:vocab-003")).toBe("2");
    expect(window.localStorage.getItem("deutschlab:vocab-resume:vocab-003")).toBe("2");
  });

  it("prefers the SQLite position when both stores have one", async () => {
    await db.saveVocabResume("vocab-003", 5);
    window.localStorage.setItem("deutschlab:vocab-resume:vocab-003", "2");

    expect(await resume.loadResumeBatch(week3VocabularySet)).toBe(5);
  });

  it("ignores out-of-range or corrupt values in either store", async () => {
    await db.saveVocabResume("vocab-004", 99);
    window.localStorage.setItem("deutschlab:vocab-resume:vocab-004", "abc");

    expect(await resume.loadResumeBatch(week4VocabularySet)).toBe(0);
  });

  it("keeps per-lesson positions apart and leaves non-resumable sets alone", async () => {
    await resume.saveResumeBatch(week3VocabularySet, 2);
    await resume.saveResumeBatch(week4VocabularySet, 6);
    await resume.saveResumeBatch(week2VocabularySet, 1);

    expect(await db.getVocabResume("vocab-003")).toBe(2);
    expect(await db.getVocabResume("vocab-004")).toBe(6);
    expect(await db.getVocabResume("vocab-002")).toBeNull();
  });

  it("falls back to localStorage when the database is unavailable", async () => {
    vi.resetModules();
    vi.doMock("./db", () => ({
      getVocabResume: vi.fn().mockRejectedValue(new Error("no database")),
      saveVocabResume: vi.fn().mockRejectedValue(new Error("no database")),
      clearVocabResume: vi.fn().mockRejectedValue(new Error("no database")),
    }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const isolated = await import("./vocabResume");
    window.localStorage.setItem("deutschlab:vocab-resume:vocab-004", "3");

    expect(await isolated.loadResumeBatch(week4VocabularySet)).toBe(3);
    await expect(isolated.saveResumeBatch(week4VocabularySet, 4)).resolves.toBeUndefined();
    expect(window.localStorage.getItem("deutschlab:vocab-resume:vocab-004")).toBe("4");

    vi.doUnmock("./db");
  });
});
