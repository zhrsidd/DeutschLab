import {
  vocabularyBatches as week1Batches,
  week1Vocabulary,
  type VocabularyBatch,
  type VocabularyCategory,
  type VocabularyItem,
} from "./week1Vocabulary";
import {
  week2Vocabulary,
  week2VocabularyBatches,
} from "./week2Vocabulary";

/*
 * A vocabulary set is one batch-based vocabulary lesson (vocab-001,
 * vocab-002, ...). The lesson component, quiz builders and Review all read
 * from here, so adding a set does not need a second vocabulary system.
 */
export interface VocabularySet {
  taskId: string;
  kicker: string;
  title: string;
  /** "{count}" is replaced with the number of words. */
  intro: string;
  items: VocabularyItem[];
  batches: VocabularyBatch[];
  /** Final quiz: how many questions come from each category. */
  finalQuota: [VocabularyCategory, number][];
  /** Categories whose items may be asked as typed German. */
  typedCategories: VocabularyCategory[];
  /** Prefix of the quiz seed (kept stable so quizzes stay reproducible). */
  seedPrefix: string;
}

export const week1VocabularySet: VocabularySet = {
  taskId: "vocab-001",
  kicker: "Week 1 · Vocabulary",
  title: "Week 1 vocabulary",
  intro:
    "Build your first {count} words and phrases in small batches: greetings, pronouns, verbs, countries, languages, school subjects and numbers. Each batch ends with a short check, and a mixed quiz closes the lesson.",
  items: week1Vocabulary,
  batches: week1Batches,
  finalQuota: [
    ["greetings", 3],
    ["pronouns", 2],
    ["verbs", 2],
    ["countries", 2],
    ["languages", 2],
    ["subjects", 2],
    ["numbers", 3],
  ],
  typedCategories: ["greetings", "countries", "languages", "subjects", "numbers"],
  seedPrefix: "final",
};

export const week2VocabularySet: VocabularySet = {
  taskId: "vocab-002",
  kicker: "Week 2 · Vocabulary",
  title: "Week 2 vocabulary",
  intro:
    "Add {count} new words: family, daily activities, places, adjectives, days, months and time words. Nouns come with their article, for example die Mutter. Each batch ends with a short check, and a mixed quiz closes the lesson.",
  items: week2Vocabulary,
  batches: week2VocabularyBatches,
  finalQuota: [
    ["family", 4],
    ["activities", 3],
    ["places", 3],
    ["adjectives", 3],
    ["days", 2],
    ["months", 2],
    ["time", 1],
  ],
  typedCategories: ["family", "places", "adjectives", "days", "months", "time"],
  seedPrefix: "final-w2",
};

export const vocabularySets: VocabularySet[] = [
  week1VocabularySet,
  week2VocabularySet,
];

/** Every vocabulary item across all sets (ids are unique across sets). */
export function allVocabularyItems(): VocabularyItem[] {
  return vocabularySets.flatMap((set) => set.items);
}

export function findVocabularyItem(id: string): VocabularyItem | undefined {
  return allVocabularyItems().find((item) => item.id === id);
}

/** The set an item belongs to (defaults to Week 1 for unknown ids). */
export function vocabularySetForItem(id: string): VocabularySet {
  return (
    vocabularySets.find((set) => set.items.some((item) => item.id === id)) ??
    week1VocabularySet
  );
}

export function vocabularySetForTask(taskId: string): VocabularySet | undefined {
  return vocabularySets.find((set) => set.taskId === taskId);
}
