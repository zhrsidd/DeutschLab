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
import {
  week3Vocabulary,
  week3VocabularyBatches,
} from "./week3Vocabulary";

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
  /**
   * Article-aware set (Week 3 onwards): quizzes also ask for the article and
   * the plural, and German answers must include the article.
   */
  articleAware?: boolean;
  /** Short reminder shown on the intro and learn cards. */
  reminder?: string;
  /** Remember the batch position so the lesson can be resumed later. */
  resumable?: boolean;
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

export const ARTICLE_REMINDER =
  "Learn German nouns together with their articles. The article is part of the word you need to remember.";

export const week3VocabularySet: VocabularySet = {
  taskId: "vocab-003",
  kicker: "Week 3 · Vocabulary",
  title: "School, home and everyday objects",
  intro:
    "Learn {count} nouns with their article and plural: school objects, rooms, furniture, food and drink, everyday things and people. Each batch ends with a short check, and a mixed quiz closes the lesson. You can leave between batches and resume where you stopped.",
  items: week3Vocabulary,
  batches: week3VocabularyBatches,
  finalQuota: [
    ["school", 3],
    ["objects", 4],
    ["rooms", 3],
    ["furniture", 3],
    ["food", 4],
    ["people", 3],
  ],
  typedCategories: ["school", "objects", "rooms", "furniture", "food", "people"],
  seedPrefix: "final-w3",
  articleAware: true,
  reminder: ARTICLE_REMINDER,
  resumable: true,
};

export const vocabularySets: VocabularySet[] = [
  week1VocabularySet,
  week2VocabularySet,
  week3VocabularySet,
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
