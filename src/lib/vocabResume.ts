/*
 * Where a resumable vocabulary lesson left off (the batch index).
 *
 * SQLite (app_state) is the durable store, so the position is part of the
 * learner's database and its backups. localStorage is kept as a fast first
 * value, as the source for positions saved before v1.0, and as a fallback if
 * the database cannot be reached. A localStorage position is copied into
 * SQLite on first load and never deleted by the migration.
 */

import type { VocabularySet } from "../data/lessons/vocabularySets";

import { clearVocabResume, getVocabResume, saveVocabResume } from "./db";

export const RESUME_KEY_PREFIX = "deutschlab:vocab-resume:";

const isValid = (set: VocabularySet, value: number | null): value is number =>
  value !== null && Number.isInteger(value) && value > 0 && value < set.batches.length;

/** The localStorage position (0 when missing, invalid or unavailable). */
export function readLocalResume(set: VocabularySet): number {
  if (!set.resumable) return 0;

  try {
    const stored = Number(
      window.localStorage.getItem(`${RESUME_KEY_PREFIX}${set.taskId}`),
    );
    return isValid(set, stored) ? stored : 0;
  } catch {
    return 0;
  }
}

function writeLocal(set: VocabularySet, batchIndex: number | null) {
  try {
    const key = `${RESUME_KEY_PREFIX}${set.taskId}`;
    if (batchIndex === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(batchIndex));
  } catch {
    // Browser storage may be unavailable; SQLite still has the position.
  }
}

/**
 * The position to offer on the intro screen: SQLite first, then a legacy
 * localStorage value (which is copied into SQLite), then 0.
 */
export async function loadResumeBatch(set: VocabularySet): Promise<number> {
  if (!set.resumable) return 0;

  const local = readLocalResume(set);

  try {
    const stored = await getVocabResume(set.taskId);
    if (isValid(set, stored)) return stored;

    if (stored === null && local > 0) await saveVocabResume(set.taskId, local);
  } catch (error) {
    console.error("Failed to load the vocabulary position:", error);
  }

  return local;
}

/** Saves (or, with null, clears) the position in both stores. */
export async function saveResumeBatch(
  set: VocabularySet,
  batchIndex: number | null,
): Promise<void> {
  if (!set.resumable) return;

  writeLocal(set, batchIndex);

  try {
    if (batchIndex === null) await clearVocabResume(set.taskId);
    else await saveVocabResume(set.taskId, batchIndex);
  } catch (error) {
    console.error("Failed to save the vocabulary position:", error);
  }
}
