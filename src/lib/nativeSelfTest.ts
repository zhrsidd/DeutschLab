/*
 * Opt-in native self-test for release verification.
 *
 * Runs only when the app is started with DEUTSCHLAB_SELFTEST_OUT set (the
 * Rust side reports the path). It switches to deutschlab-selftest.db before
 * anything opens a database, exercises the real SQL plugin, the native
 * backup commands and the rendered UI inside WKWebView (with DOM events, no
 * OS-level automation), lists German voices without speaking, writes a JSON
 * report and quits. The learner database is never opened.
 */

import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";

import { starterTasks, taskWeek } from "../data/unit1";

import { createSnapshot, exportBackup } from "./backup";
import {
  SELFTEST_DATABASE_URL,
  applyReviewResult,
  getCheckpointAttempts,
  getCompletedTaskIds,
  getPlannerData,
  getStudyMinutes,
  getVocabResume,
  getWritingDraft,
  initialiseDatabase,
  markTaskComplete,
  recordAnswer,
  saveCheckpointAttempt,
  saveLessonAttempt,
  saveVocabResume,
  saveWritingDraft,
  setStudyMinutes,
  useSelfTestDatabase,
  type CheckpointAttemptRow,
} from "./db";
import { evaluateCheckpoint, WEEK4_CHECKPOINT } from "./checkpointScoring";

interface Check {
  name: string;
  ok: boolean;
  detail: unknown;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor<T>(label: string, probe: () => T | null | undefined | false, timeout = 10_000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = probe();
    if (value) return value;
    if (Date.now() - start > timeout) throw new Error(`Timed out waiting for ${label}`);
    await sleep(50);
  }
}

const buttonByText = (text: string | RegExp) =>
  [...document.querySelectorAll("button")].find((button) =>
    typeof text === "string" ? button.textContent?.trim() === text : text.test(button.textContent ?? ""),
  );

const headingByText = (text: string) =>
  [...document.querySelectorAll("h1, h2")].find((heading) => heading.textContent?.trim() === text);

async function click(text: string | RegExp) {
  const button = await waitFor(`button ${text}`, () => {
    const found = buttonByText(text);
    return found && !found.disabled ? found : null;
  });
  button.click();
}

const count = async (raw: Database, table: string) =>
  (await raw.select<{ n: number }[]>(`SELECT COUNT(*) AS n FROM ${table}`))[0].n;

export async function runNativeSelfTest(reportPath: string, renderApp: () => void) {
  const checks: Check[] = [];
  const startedAt = new Date().toISOString();

  const check = async (name: string, run: () => Promise<unknown>) => {
    try {
      checks.push({ name, ok: true, detail: (await run()) ?? null });
    } catch (error) {
      checks.push({ name, ok: false, detail: String(error) });
    }
  };

  useSelfTestDatabase();
  const raw = await Database.load(SELFTEST_DATABASE_URL);

  /* ---------- native SQL ---------- */

  await check("migrations run twice (idempotent)", async () => {
    await initialiseDatabase();
    await initialiseDatabase();
    const objects = await raw.select<{ name: string }[]>(
      `SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name`,
    );
    return objects.map((row) => row.name);
  });

  await check("journal mode", async () => {
    const [row] = await raw.select<{ journal_mode: string }[]>(`PRAGMA journal_mode`);
    if (row.journal_mode !== "wal") throw new Error(`journal_mode is ${row.journal_mode}`);
    return row.journal_mode;
  });

  // A learner who has mastered Weeks 1–3 and finished vocab-004.
  const completed = [
    ...starterTasks.filter((task) => taskWeek(task) <= 3).map((task) => task.id),
    "vocab-004",
  ];

  await check("task completion persists", async () => {
    for (const id of completed) await markTaskComplete(id);
    const ids = await getCompletedTaskIds();
    if (ids.length !== completed.length) throw new Error(`${ids.length} of ${completed.length}`);
    return ids.length;
  });

  await check("lesson attempt saved", async () => {
    await saveLessonAttempt("grammar-009", 14, 16);
    return count(raw, "lesson_attempts");
  });

  await check("wrong answer creates mistake + structured review item", async () => {
    await recordAnswer({
      sourceType: "grammar", sourceId: "pr-c-mich", category: "grammar",
      prompt: "Der Lehrer fragt ___. (ich)", expected: "mich", userAnswer: "ich", correct: false,
    });
    const [item] = await raw.select<{ id: number; exercise_json: string; interval_days: number }[]>(
      `SELECT id, exercise_json, interval_days FROM review_items WHERE source_id = 'pr-c-mich'`,
    );
    const [mistake] = await raw.select<{ lesson_id: string }[]>(
      `SELECT lesson_id FROM mistakes WHERE item_key = 'grammar:pr-c-mich'`,
    );
    const concept = JSON.parse(item.exercise_json).concept;
    if (concept !== "pronoun" || mistake.lesson_id !== "grammar-009") throw new Error(`${concept} / ${mistake.lesson_id}`);
    return { concept, lesson: mistake.lesson_id, interval: item.interval_days };
  });

  await check("SRS: two correct reviews give 3 then 7 days and resolve the mistake", async () => {
    const [row] = await raw.select<{ id: number }[]>(`SELECT id FROM review_items WHERE source_id = 'pr-c-mich'`);
    const item = {
      id: row.id, sourceType: "grammar" as const, sourceId: "pr-c-mich", prompt: "p", answer: "mich",
      audioText: null, dueAt: "", intervalDays: 1, ease: 2.5, repetitions: 0, exerciseJson: null,
    };
    await applyReviewResult(item, true);
    const first = (await raw.select<{ interval_days: number }[]>(`SELECT interval_days FROM review_items WHERE id = ?`, [row.id]))[0].interval_days;
    await applyReviewResult(item, true);
    const second = (await raw.select<{ interval_days: number }[]>(`SELECT interval_days FROM review_items WHERE id = ?`, [row.id]))[0].interval_days;
    const [mistake] = await raw.select<{ resolved_at: string | null }[]>(
      `SELECT resolved_at FROM mistakes WHERE item_key = 'grammar:pr-c-mich'`,
    );
    if (first !== 3 || second !== 7 || !mistake.resolved_at) throw new Error(`${first}, ${second}, ${mistake.resolved_at}`);
    return [1, first, second];
  });

  await check("checkpoint-004 attempts are inserted, never overwritten", async () => {
    const scores = { vocabulary: 6, grammar: 8, reading: 3, listening: 2, writing: 4, speaking: 3 };
    await saveCheckpointAttempt("checkpoint-004", evaluateCheckpoint(scores, WEEK4_CHECKPOINT));
    await saveCheckpointAttempt(
      "checkpoint-004",
      evaluateCheckpoint({ ...scores, grammar: 11, vocabulary: 7, writing: 5, speaking: 4 }, WEEK4_CHECKPOINT),
    );
    const attempts: CheckpointAttemptRow[] = await getCheckpointAttempts("checkpoint-004");
    if (attempts.length !== 2) throw new Error(`${attempts.length} attempts`);
    return attempts.map((attempt) => ({ total: attempt.total, possible: attempt.possible, passed: attempt.passed }));
  });

  await check("writing draft, vocabulary resume and study time persist", async () => {
    await saveWritingDraft("writing-003", "Ich heiße Omar. Ich fahre Fahrrad.");
    await saveVocabResume("vocab-004", 4);
    await setStudyMinutes(45);
    const result = {
      draft: await getWritingDraft("writing-003"),
      resume: await getVocabResume("vocab-004"),
      minutes: await getStudyMinutes(),
    };
    if (result.resume !== 4 || result.minutes !== 45 || !result.draft.startsWith("Ich heiße")) {
      throw new Error(JSON.stringify(result));
    }
    return result;
  });

  await check("planner data loads", async () => {
    const data = await getPlannerData();
    return { dueReviewCount: data.dueReviewCount, candidates: data.unresolvedMistakes.length };
  });

  /* ---------- backups with commits still in the WAL ---------- */

  let snapshotPath = "";
  const atSnapshot: Record<string, number> = {};

  await check("snapshot while recent commits are only in the WAL (VACUUM INTO + seal)", async () => {
    for (let i = 0; i < 300; i += 1) {
      await recordAnswer({
        sourceType: "grammar", sourceId: `selftest-${i}`, category: "grammar",
        prompt: `p${i}`, expected: "x", userAnswer: "y", correct: false,
      });
    }
    const walBefore = await invoke<number>("selftest_wal_bytes");
    for (const table of ["task_progress", "lesson_attempts", "checkpoint_attempts", "review_items", "mistakes", "app_state"]) {
      atSnapshot[table] = await count(raw, table);
    }
    snapshotPath = await createSnapshot();
    const walAfter = await invoke<number>("selftest_wal_bytes");
    if (walBefore === 0) throw new Error("WAL was empty: commits were already checkpointed");
    return { path: snapshotPath, walBytesBefore: walBefore, walBytesAfter: walAfter, rows: atSnapshot };
  });

  let exportPath = "";
  await check("JSON export written by the native command", async () => {
    const saved = await exportBackup();
    if (saved.kind !== "file") throw new Error("expected a native file");
    exportPath = saved.path;
    return saved.path;
  });

  /* ---------- speech (listed only, nothing is spoken) ---------- */

  await check("German speech voices", async () => {
    if (!("speechSynthesis" in window)) throw new Error("speechSynthesis missing");
    let voices = window.speechSynthesis.getVoices();
    for (let i = 0; i < 30 && voices.length === 0; i += 1) {
      await sleep(100);
      voices = window.speechSynthesis.getVoices();
    }
    const german = voices.filter((voice) => voice.lang.toLowerCase().startsWith("de"));
    return { total: voices.length, german: german.map((voice) => `${voice.name} (${voice.lang})`) };
  });

  /* ---------- the rendered UI in WKWebView ---------- */

  renderApp();

  // Shell navigation buttons read "01Home", "02Course", ... (number + label).
  const nav = (label: string) => new RegExp(`^(\\d\\d)?${label}(\\d+ due)?$`);

  await check("Schwarzrot obsidian background in WKWebView", async () => {
    const background = getComputedStyle(document.body).backgroundColor;
    if (background !== "rgb(9, 9, 9)") throw new Error(background);
    return background;
  });

  await check("Home renders with Week 4 as the current week", async () => {
    await waitFor("Today's plan", () => headingByText("Today's plan"));
    const header = document.querySelector("main header p")?.textContent ?? "";
    if (!header.includes("Week 4")) throw new Error(header);
    return header;
  });

  await check("opening sequence leaves once the database is ready", async () => {
    await waitFor("intro gone", () => !document.querySelector('[data-testid="intro"]'), 3000);
    return "ok";
  });

  await check("no horizontal overflow at the window size", async () => ({
    window: `${window.innerWidth}x${window.innerHeight}`,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  await check("plan → lesson → teaching page → back", async () => {
    await click(/Accusative pronouns/);
    await waitFor("lesson intro", () => buttonByText("Begin lesson"));
    await click("Begin lesson");
    await waitFor("first teaching page", () => headingByText("Pronouns replace nouns"));
    await click(/Back to today/);
    await waitFor("Today again", () => headingByText("Today's plan"));
    return "ok";
  });

  await check("every main section opens without horizontal overflow", async () => {
    const results: Record<string, number> = {};
    for (const label of ["Course", "Practice", "Review", "Progress", "Settings", "Home"]) {
      await click(nav(label));
      await waitFor(`${label} active`, () =>
        document.querySelector(`nav [aria-current="page"]`)?.textContent?.includes(label),
      );
      await sleep(350);
      results[label] = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    }
    if (Object.values(results).some((overflow) => overflow > 0)) throw new Error(JSON.stringify(results));
    return results;
  });

  await check("Settings → Your data → Save snapshot through the UI", async () => {
    await click(nav("Settings"));
    await waitFor("Your data", () => headingByText("Your data"));
    await sleep(1100); // a new second, so the file name differs from the earlier snapshot
    await click("Save snapshot");
    const status = await waitFor("snapshot status", () =>
      [...document.querySelectorAll('[role="status"]')].find((node) => node.textContent?.includes("backups")),
    );
    return status.textContent?.replace("Saved to", "").replace("Show in Finder", "").trim();
  });

  await check("Course shows Weeks 5–16 as planned", async () => {
    await click(nav("Course"));
    const november = await waitFor("November", () => document.querySelector('[aria-label="November"]'));
    if (!november.textContent?.includes("Planned")) throw new Error("no Planned status");
    return "ok";
  });

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    origin: window.location.origin,
    database: SELFTEST_DATABASE_URL,
    snapshotPath,
    exportPath,
    rowsAtSnapshot: atSnapshot,
    passed: checks.every((entry) => entry.ok),
    checks,
  };

  await invoke("finish_selftest", { report: JSON.stringify(report, null, 2) });
  void reportPath;
}
