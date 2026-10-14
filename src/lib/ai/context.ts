/*
 * Curriculum context for AI prompts: a small, relevant summary of what this
 * learner has been taught, never the whole curriculum or database.
 *
 * Three different things are kept apart on purpose:
 * - in scope: weeks the learner has reached (their current week and before);
 * - completed: lessons with a saved completion;
 * - mastered: weeks whose checkpoint was passed.
 * A lesson existing in the app is none of these.
 *
 * Grammar and topic lists summarise CURRICULUM.md (Weeks 1–4).
 */

import { starterTasks, taskWeek, type LessonTask } from "../../data/unit1";
import { vocabularySets } from "../../data/lessons/vocabularySets";
import { getCompletedTaskIds, getMistakes } from "../db";
import { currentWeek, weekSummaries } from "../progress";

export const WEEK_GRAMMAR: Record<number, string[]> = {
  1: [
    "personal pronouns (ich, du, er, sie, es, wir, ihr, sie, Sie)",
    "sein in the present tense",
    "regular present-tense verbs",
    "verb in position 2 in statements (V2)",
    "yes/no questions (verb first)",
    "W-questions (wer, was, wo, woher, wie)",
  ],
  2: [
    "haben in the present tense",
    "common verbs, including stem changes: sprechen, essen, lesen, schlafen",
    "V2 and questions, consolidated",
    "nouns learned with their article as chunks",
  ],
  3: [
    "definite articles der / die / das",
    "indefinite articles ein / eine",
    "plural awareness",
    "nominative case",
    "accusative introduction: only masculine changes (der → den, ein → einen)",
    "nicht vs kein",
  ],
  4: [
    "accusative consolidation and direct objects",
    "accusative pronouns mich, dich, ihn, sie, es, uns, euch",
    "irregular present tense: sehen, nehmen, treffen, fahren, tragen",
    "sentence building with nominative and accusative",
  ],
};

export const WEEK_TOPICS: Record<number, string[]> = {
  1: ["greetings and politeness", "introductions", "countries", "languages", "school subjects", "numbers"],
  2: ["family", "daily activities", "places", "basic adjectives", "days and months", "basic time words"],
  3: ["school objects", "room and home", "food and drink", "household nouns"],
  4: ["food", "school", "home", "everyday actions", "clothes", "descriptions"],
};

/** Later grammar the tutor must not expect (and should avoid or explain). */
export const NOT_YET_TAUGHT = [
  "modal verbs (können, müssen, wollen: Week 5; dürfen, sollen, mögen, möchten: Week 6)",
  "separable verbs (Week 7)",
  "the dative case and dative prepositions (Weeks 9–10)",
  "adjective endings before a noun (adjectives are only used after sein so far)",
  "the Perfekt past tense (Week 11)",
  "subordinate clauses with weil / dass (Weeks 13–14)",
];

/** What each lesson teaches, for recommendations. */
export const LESSON_CONCEPTS: Record<string, string> = {
  "vocab-001": "greetings, countries, languages, school subjects, numbers",
  "pronunciation-001": "German sounds: ä, ö, ü, ch, sch, ei, ie, eu, z, w, v",
  "grammar-001": "personal pronouns and sein",
  "grammar-002": "regular verb endings and verb-second word order",
  "grammar-003": "yes/no questions and W-questions",
  "listening-001": "understanding introductions",
  "speaking-001": "a short self-introduction",
  "vocab-002": "family, daily activities, places, adjectives, days, months, time words",
  "grammar-004": "haben",
  "grammar-005": "common verbs including stem changes (sprechen, essen, lesen, schlafen)",
  "writing-001": "a paragraph about yourself and daily life",
  "reading-001": "reading short texts about daily life",
  "listening-002": "understanding daily-life clips",
  "vocab-003": "school objects, home, food and drink, household nouns with articles and plurals",
  "grammar-006": "der/die/das, ein/eine, plurals, nominative",
  "grammar-007": "accusative: der → den, ein → einen after verbs like haben and sehen",
  "grammar-008": "nicht vs kein",
  "reading-002": "reading descriptions of rooms and school",
  "listening-003": "understanding clips about home and school",
  "writing-002": "describing your room and things",
  "vocab-004": "everyday actions, meals, home, clothes, school words, descriptions",
  "grammar-009": "accusative pronouns mich, dich, ihn, sie, es, uns, euch",
  "grammar-010": "irregular verbs sehen, nehmen, treffen, fahren, tragen with the accusative",
  "reading-003": "reading everyday descriptions",
  "listening-004": "understanding everyday conversations",
  "writing-003": "describing everyday life in 60–80 words",
  "speaking-002": "a 2–3 minute talk about yourself and your daily life",
};

export interface LessonRef {
  id: string;
  title: string;
  week: number;
  concept: string;
}

export interface LearnerContext {
  currentWeek: number;
  weeksInScope: number[];
  completedLessons: LessonRef[];
  masteredWeeks: number[];
  grammarInScope: { week: number; items: string[] }[];
  topicsInScope: string[];
  notYetTaught: string[];
  vocabulary: string[];
  weakLessons: { id: string; title: string; openMistakes: number }[];
  /** Lessons the AI may recommend (in scope, not checkpoints). */
  lessonCatalog: LessonRef[];
}

const toRef = (task: LessonTask): LessonRef => ({
  id: task.id,
  title: task.title,
  week: taskWeek(task),
  concept: LESSON_CONCEPTS[task.id] ?? task.description,
});

export const VOCABULARY_LIMIT = 320;

export function buildLearnerContext(input: {
  completed: string[];
  openMistakesByLesson?: Map<string, number>;
}): LearnerContext {
  const summaries = weekSummaries(starterTasks, input.completed);
  const week = currentWeek(summaries);
  const weeksInScope = summaries.map((s) => s.week).filter((w) => w <= week);
  const inScope = (task: LessonTask) => taskWeek(task) <= week;

  const vocabulary = vocabularySets
    .filter((set) => {
      const task = starterTasks.find((t) => t.id === set.taskId);
      return task ? inScope(task) : false;
    })
    .flatMap((set) => set.items.map((item) => item.german))
    .slice(0, VOCABULARY_LIMIT);

  const weakLessons = [...(input.openMistakesByLesson ?? new Map()).entries()]
    .map(([id, openMistakes]) => ({ id, openMistakes, task: starterTasks.find((t) => t.id === id) }))
    .filter((entry) => entry.task)
    .sort((a, b) => b.openMistakes - a.openMistakes)
    .slice(0, 5)
    .map((entry) => ({ id: entry.id, title: entry.task!.title, openMistakes: entry.openMistakes }));

  return {
    currentWeek: week,
    weeksInScope,
    completedLessons: starterTasks.filter((t) => input.completed.includes(t.id)).map(toRef),
    masteredWeeks: summaries.filter((s) => s.mastered).map((s) => s.week),
    grammarInScope: weeksInScope.map((w) => ({ week: w, items: WEEK_GRAMMAR[w] ?? [] })),
    topicsInScope: weeksInScope.flatMap((w) => WEEK_TOPICS[w] ?? []),
    notYetTaught: NOT_YET_TAUGHT,
    vocabulary,
    weakLessons,
    lessonCatalog: starterTasks.filter((t) => inScope(t) && t.type !== "review").map(toRef),
  };
}

/** Reads only completions and open-mistake counts per lesson: nothing personal. */
export async function loadLearnerContext(): Promise<LearnerContext> {
  const [completed, mistakes] = await Promise.all([getCompletedTaskIds(), getMistakes(200)]);
  const open = new Map<string, number>();
  for (const mistake of mistakes) {
    if (!mistake.resolved) open.set(mistake.lessonId, (open.get(mistake.lessonId) ?? 0) + 1);
  }
  return buildLearnerContext({ completed, openMistakesByLesson: open });
}

/** The compact text block sent with a request. */
export function contextForPrompt(context: LearnerContext, options: { vocabulary?: boolean } = {}): string {
  const lines = [
    `Course: DeutschLab Unit 1 (A0 → A1), October Foundations. The learner is working on Week ${context.currentWeek}.`,
    `Weeks mastered (checkpoint passed): ${context.masteredWeeks.length ? context.masteredWeeks.join(", ") : "none yet"}.`,
    `Lessons completed: ${context.completedLessons.length ? context.completedLessons.map((l) => l.title).join("; ") : "none yet"}.`,
    "Note: grammar listed as in scope has been introduced in the course; it is not proof the learner has mastered it.",
    "Grammar in scope:",
    ...context.grammarInScope.map((g) => `- Week ${g.week}: ${g.items.join("; ")}`),
    `Topics in scope: ${context.topicsInScope.join(", ")}.`,
    `Not taught yet (avoid; if you must use it, explain it briefly): ${context.notYetTaught.join("; ")}.`,
  ];

  if (context.weakLessons.length) {
    lines.push(`Lessons with open mistakes: ${context.weakLessons.map((w) => `${w.title} (${w.openMistakes})`).join("; ")}.`);
  }

  lines.push(
    "Lessons you may recommend (use these ids only):",
    ...context.lessonCatalog.map((l) => `- ${l.id}: ${l.title} (${l.concept})`),
  );

  if (options.vocabulary && context.vocabulary.length) {
    lines.push(`Vocabulary introduced so far: ${context.vocabulary.join(", ")}.`);
  }

  return lines.join("\n");
}
