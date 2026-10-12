/*
 * Everything that differs between checkpoints (sections, content, scoring
 * config, recommendations). The WeekCheckpoint component reads only this.
 */

import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import {
  listeningItems,
  readingQuestions,
  readingText,
  week1WritingContent,
  type ComprehensionQuestion,
  type WritingContent,
} from "../data/lessons/week1Checkpoint";
import {
  checkpoint2ListeningItems,
  checkpoint2ReadingQuestions,
  checkpoint2ReadingText,
} from "../data/lessons/week2Checkpoint";
import { checkpoint2Writing } from "../data/lessons/week2Writing";
import {
  checkpoint3ListeningItems,
  checkpoint3ReadingQuestions,
  checkpoint3ReadingText,
} from "../data/lessons/week3Checkpoint";
import { checkpoint3Writing } from "../data/lessons/week3Writing";

import {
  buildCheckpointGrammar,
  buildCheckpointVocabulary,
  buildWeek2CheckpointGrammar,
  buildWeek2CheckpointVocabulary,
  buildWeek3CheckpointGrammar,
  buildWeek3CheckpointVocabulary,
} from "./checkpointBuilders";
import {
  WEEK1_CHECKPOINT,
  WEEK2_CHECKPOINT,
  WEEK3_CHECKPOINT,
  type CheckpointConfig,
  type CheckpointResult,
  type SectionKey,
} from "./checkpointScoring";
import type { PlanTarget } from "./dailyPlanner";
import type { VocabQuestion } from "./vocabularyExercises";

export interface Recommendation {
  label: string;
  target: PlanTarget;
}

export interface CheckpointDefinition {
  config: CheckpointConfig;
  /** "Week 1" / "Week 2", used in headings and messages. */
  weekLabel: string;
  title: string;
  summary: string;
  time: string;
  /** Sections in order. The last one finishes the checkpoint. */
  sections: SectionKey[];
  scoringNote: string;
  readingText: string;
  readingQuestions: ComprehensionQuestion[];
  listeningQuestions: ComprehensionQuestion[];
  writing: WritingContent;
  buildVocabulary: (attempt: number) => VocabQuestion[];
  buildGrammar: (attempt: number) => CourseQuestion[];
  recommend: (
    result: CheckpointResult,
    missedGrammarLessons: string[],
  ) => Recommendation[];
}

function collect() {
  const out: Recommendation[] = [];

  const add = (label: string, target: PlanTarget) => {
    const key = JSON.stringify(target) + label;
    if (!out.some((item) => JSON.stringify(item.target) + item.label === key)) {
      out.push({ label, target });
    }
  };

  return { out, add };
}

const flattenListening = (
  items: { audio: string; translation: string; questions: ComprehensionQuestion[] }[],
): ComprehensionQuestion[] =>
  items.flatMap((item) =>
    item.questions.map((question) => ({
      ...question,
      audio: item.audio,
      translation: item.translation,
    })),
  );

const grammarLabels: Record<string, string> = {
  "grammar-001": "Review sein and pronouns",
  "grammar-002": "Review regular verbs and word order",
  "grammar-003": "Review German questions",
  "grammar-004": "Review haben",
  "grammar-005": "Review common verbs",
  "grammar-006": "Review nouns, articles and plurals",
  "grammar-007": "Review the accusative case",
  "grammar-008": "Review nicht and kein",
};

export const week1CheckpointDefinition: CheckpointDefinition = {
  config: WEEK1_CHECKPOINT,
  weekLabel: "Week 1",
  title: "Week 1 Checkpoint",
  summary:
    "One check across everything in Week 1: vocabulary, grammar, reading, listening, a short piece of writing and a spoken introduction.",
  time: "20–25 min",
  sections: ["vocabulary", "grammar", "reading", "listening", "writing", "speaking"],
  scoringNote:
    "Writing and speaking are self-assessed. You'll need a German voice for the listening section.",
  readingText,
  readingQuestions,
  listeningQuestions: flattenListening(listeningItems),
  writing: week1WritingContent,
  buildVocabulary: (attempt) => buildCheckpointVocabulary(attempt),
  buildGrammar: (attempt) => buildCheckpointGrammar(attempt),
  recommend: (result, missedGrammarLessons) => {
    const { out, add } = collect();

    for (const key of result.weakSections) {
      if (key === "vocabulary" || key === "reading") {
        add("Review Week 1 vocabulary", { type: "lesson", taskId: "vocab-001" });
      } else if (key === "grammar") {
        const lessons = missedGrammarLessons.length
          ? missedGrammarLessons
          : ["grammar-001"];

        for (const lessonId of lessons) {
          add(grammarLabels[lessonId] ?? "Review grammar", {
            type: "lesson",
            taskId: lessonId,
          });
        }
      } else if (key === "listening") {
        add("Practise listening", { type: "lesson", taskId: "listening-001" });
      } else if (key === "writing") {
        add("Practise building sentences", { type: "lesson", taskId: "grammar-002" });
      } else if (key === "speaking") {
        add("Practise your self-introduction", { type: "lesson", taskId: "speaking-001" });
      }
    }

    if (!result.passed) add("Open Review", { type: "review" });

    return out;
  },
};

export const week2CheckpointDefinition: CheckpointDefinition = {
  config: WEEK2_CHECKPOINT,
  weekLabel: "Week 2",
  title: "Week 2 Checkpoint",
  summary:
    "One check across Week 2: vocabulary, haben and common verbs, reading, listening and a paragraph about your daily life.",
  time: "22–25 min",
  sections: ["vocabulary", "grammar", "reading", "listening", "writing"],
  scoringNote:
    "Writing is self-assessed. You'll need a German voice for the listening section.",
  readingText: checkpoint2ReadingText,
  readingQuestions: checkpoint2ReadingQuestions,
  listeningQuestions: flattenListening(checkpoint2ListeningItems),
  writing: {
    prompt: checkpoint2Writing.prompt,
    targetWords: checkpoint2Writing.targetWords,
    cues: checkpoint2Writing.cues,
    checklist: checkpoint2Writing.checklist,
    sample: checkpoint2Writing.sample,
    continueLabel: "See results",
  },
  buildVocabulary: buildWeek2CheckpointVocabulary,
  buildGrammar: buildWeek2CheckpointGrammar,
  recommend: (result, missedGrammarLessons) => {
    const { out, add } = collect();

    for (const key of result.weakSections) {
      if (key === "vocabulary") {
        add("Review Week 2 vocabulary", { type: "lesson", taskId: "vocab-002" });
      } else if (key === "grammar") {
        const lessons = missedGrammarLessons.length
          ? missedGrammarLessons
          : ["grammar-005"];

        for (const lessonId of lessons) {
          add(grammarLabels[lessonId] ?? "Review grammar", {
            type: "lesson",
            taskId: lessonId,
          });
        }
      } else if (key === "reading") {
        add("Practise reading", { type: "lesson", taskId: "reading-001" });
      } else if (key === "listening") {
        add("Practise listening", { type: "lesson", taskId: "listening-002" });
      } else if (key === "writing") {
        add("Review your writing", { type: "lesson", taskId: "writing-001" });
      }
    }

    if (!result.passed) add("Open Review", { type: "review" });

    return out;
  },
};

export const week3CheckpointDefinition: CheckpointDefinition = {
  config: WEEK3_CHECKPOINT,
  weekLabel: "Week 3",
  title: "Week 3 Checkpoint",
  summary:
    "One check across Week 3: nouns with their articles and plurals, the accusative, nicht and kein, reading, listening and a paragraph about objects.",
  time: "22–25 min",
  sections: ["vocabulary", "grammar", "reading", "listening", "writing"],
  scoringNote:
    "Writing is self-assessed. You'll need a German voice for the listening section.",
  readingText: checkpoint3ReadingText,
  readingQuestions: checkpoint3ReadingQuestions,
  listeningQuestions: flattenListening(checkpoint3ListeningItems),
  writing: {
    prompt: checkpoint3Writing.prompt,
    targetWords: checkpoint3Writing.targetWords,
    cues: checkpoint3Writing.cues,
    checklist: checkpoint3Writing.checklist,
    sample: checkpoint3Writing.sample,
    continueLabel: "See results",
  },
  buildVocabulary: buildWeek3CheckpointVocabulary,
  buildGrammar: buildWeek3CheckpointGrammar,
  recommend: (result, missedGrammarLessons) => {
    const { out, add } = collect();

    for (const key of result.weakSections) {
      if (key === "vocabulary") {
        add("Review Week 3 vocabulary", { type: "lesson", taskId: "vocab-003" });
      } else if (key === "grammar") {
        const lessons = missedGrammarLessons.length
          ? missedGrammarLessons
          : ["grammar-006"];

        for (const lessonId of lessons) {
          add(grammarLabels[lessonId] ?? "Review grammar", {
            type: "lesson",
            taskId: lessonId,
          });
        }
      } else if (key === "reading") {
        add("Practise reading", { type: "lesson", taskId: "reading-002" });
      } else if (key === "listening") {
        add("Practise listening", { type: "lesson", taskId: "listening-003" });
      } else if (key === "writing") {
        add("Review your writing", { type: "lesson", taskId: "writing-002" });
      }
    }

    if (!result.passed) add("Open Review", { type: "review" });

    return out;
  },
};
