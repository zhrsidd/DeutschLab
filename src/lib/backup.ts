/*
 * Learner-data backup (v1.0).
 *
 * Two kinds of backup, both written into <app data>/backups and never
 * overwriting an existing file:
 *
 * - a JSON export: portable, versioned and readable, with every learner
 *   table, the app settings and any DeutschLab browser-storage keys;
 * - a database snapshot (VACUUM INTO): an exact, consistent copy of
 *   deutschlab.db that can replace the database file to restore everything.
 *
 * In-app restore is deliberately not offered in v1.0: the SQL plugin runs
 * statements on a connection pool, so a multi-table replace could not be
 * made atomic from the frontend. validateBackup() checks an export
 * completely so a future restore can reject bad files before touching data.
 */

import { invoke, isTauri } from "@tauri-apps/api/core";

import { APP_NAME, APP_VERSION } from "./appInfo";
import {
  LEARNER_TABLES,
  exportLearnerTables,
  snapshotDatabase,
  type LearnerTable,
} from "./db";

export const BACKUP_FORMAT = "deutschlab-backup";
/**
 * 2 adds study_events; 3 adds the AI tables (AI v1.1). Older files are still
 * accepted: tables they predate count as empty.
 */
export const BACKUP_VERSION = 3;

export interface LearnerBackup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  app: { name: string; version: string };
  tables: Record<LearnerTable, Record<string, unknown>[]>;
  /** DeutschLab keys from browser storage (older resume positions). */
  browserStorage: Record<string, string>;
}

/** Columns every row of a table must have for the export to be usable. */
const REQUIRED_COLUMNS: Record<LearnerTable, string[]> = {
  task_progress: ["task_id", "completed"],
  lesson_attempts: ["task_id", "score", "total", "completed_at"],
  checkpoint_attempts: [
    "checkpoint_id",
    "total_score",
    "total_possible",
    "section_scores_json",
    "passed",
    "completed_at",
  ],
  review_items: ["source_type", "source_id", "prompt", "answer", "due_at", "interval_days", "repetitions"],
  mistakes: ["lesson_id", "item_key", "prompt", "expected_answer", "times_missed"],
  app_state: ["key", "value"],
  study_events: ["kind", "occurred_at"],
  ai_assessments: ["id", "task_id", "kind", "created_at", "model", "input_text", "feedback_json", "score"],
  ai_tutor_sessions: ["id", "mode", "topic", "started_at", "messages_json"],
  ai_usage: ["occurred_at", "feature", "model", "outcome"],
};

/** Tables a given backup version does not contain yet. */
const ADDED_IN: Partial<Record<LearnerTable, number>> = {
  study_events: 2,
  ai_assessments: 3,
  ai_tutor_sessions: 3,
  ai_usage: 3,
};

const BROWSER_PREFIX = "deutschlab:";

function readBrowserStorage(): Record<string, string> {
  const out: Record<string, string> = {};

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(BROWSER_PREFIX)) {
        out[key] = window.localStorage.getItem(key) ?? "";
      }
    }
  } catch {
    // Browser storage may be unavailable; the database has the same data.
  }

  return out;
}

export async function buildBackup(now = new Date()): Promise<LearnerBackup> {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    app: { name: APP_NAME, version: APP_VERSION },
    tables: await exportLearnerTables(),
    browserStorage: readBrowserStorage(),
  };
}

export const serializeBackup = (backup: LearnerBackup) =>
  `${JSON.stringify(backup, null, 2)}\n`;

const stamp = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
};

export const backupFileName = (date: Date) => `deutschlab-backup-${stamp(date)}.json`;
export const snapshotFileName = (date: Date) => `deutschlab-${stamp(date)}.db`;

export type BackupValidation =
  | { ok: true; backup: LearnerBackup; counts: Record<LearnerTable, number> }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Checks a whole export before anything could use it. */
export function validateBackup(raw: unknown): BackupValidation {
  if (!isRecord(raw)) return { ok: false, error: "Not a DeutschLab backup." };
  if (raw.format !== BACKUP_FORMAT) return { ok: false, error: "Not a DeutschLab backup." };
  if (typeof raw.version !== "number" || !Number.isInteger(raw.version)) {
    return { ok: false, error: "The backup has no valid version." };
  }
  if (raw.version > BACKUP_VERSION) {
    return { ok: false, error: `Backup version ${raw.version} is newer than this app supports.` };
  }
  if (raw.version < 1) return { ok: false, error: "Unsupported backup version." };
  if (typeof raw.exportedAt !== "string" || Number.isNaN(Date.parse(raw.exportedAt))) {
    return { ok: false, error: "The backup has no valid export date." };
  }
  if (!isRecord(raw.tables)) return { ok: false, error: "The backup has no tables." };
  if (raw.browserStorage !== undefined && !isRecord(raw.browserStorage)) {
    return { ok: false, error: "The browser-storage section is malformed." };
  }

  const counts = {} as Record<LearnerTable, number>;

  for (const table of LEARNER_TABLES) {
    const rows = raw.tables[table];
    if (rows === undefined && (ADDED_IN[table] ?? 1) > raw.version) {
      counts[table] = 0;
      continue;
    }
    if (!Array.isArray(rows)) return { ok: false, error: `Table ${table} is missing.` };

    for (const [index, row] of rows.entries()) {
      if (!isRecord(row)) return { ok: false, error: `Row ${index + 1} of ${table} is malformed.` };
      for (const column of REQUIRED_COLUMNS[table]) {
        if (!(column in row)) {
          return { ok: false, error: `Row ${index + 1} of ${table} has no ${column}.` };
        }
      }
    }

    counts[table] = rows.length;
  }

  for (const value of Object.values(raw.browserStorage ?? {})) {
    if (typeof value !== "string") {
      return { ok: false, error: "The browser-storage section is malformed." };
    }
  }

  return { ok: true, backup: raw as unknown as LearnerBackup, counts };
}

export type SavedBackup =
  | { kind: "file"; path: string }
  | { kind: "download"; fileName: string };

function download(fileName: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Exports everything as JSON into the backups folder (or a browser download). */
export async function exportBackup(now = new Date()): Promise<SavedBackup> {
  const backup = await buildBackup(now);
  const contents = serializeBackup(backup);
  const fileName = backupFileName(now);

  // Never hand out a file that would not pass our own validation.
  const check = validateBackup(JSON.parse(contents));
  if (!check.ok) throw new Error(check.error);

  if (isTauri()) {
    const path = await invoke<string>("write_backup_file", { fileName, contents });
    return { kind: "file", path };
  }

  download(fileName, contents);
  return { kind: "download", fileName };
}

/** True where a database snapshot can be written (the native app). */
export const canSnapshot = () => isTauri();

/** Writes an exact copy of deutschlab.db into the backups folder. */
export async function createSnapshot(now = new Date()): Promise<string> {
  if (!isTauri()) throw new Error("Database snapshots need the DeutschLab app.");

  const fileName = snapshotFileName(now);
  const path = await invoke<string>("backup_path", { fileName });
  // VACUUM INTO reads one consistent transaction, so commits still in the
  // WAL file are included; a plain copy of deutschlab.db would miss them.
  await snapshotDatabase(path);
  // SQLite does not fsync that file: verify it and force it to disk.
  await invoke<number>("seal_backup_file", { fileName });
  return path;
}
