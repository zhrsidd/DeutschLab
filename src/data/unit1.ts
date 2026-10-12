export type LessonType =
  | "vocabulary"
  | "grammar"
  | "pronunciation"
  | "listening"
  | "speaking"
  | "writing"
  | "reading"
  | "review";

export interface LessonTask {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  minutes: number;
  /** Curriculum week; tasks without one belong to Week 1. */
  week?: number;
}

export const taskWeek = (task: LessonTask): number => task.week ?? 1;

export interface CurriculumWeek {
  week: number;
  title: string;
  topics: string[];
}

export interface CurriculumMonth {
  month: string;
  subtitle: string;
  weeks: CurriculumWeek[];
}

export const unit1Curriculum: CurriculumMonth[] = [
  {
    month: "October",
    subtitle: "A1 Foundations",
    weeks: [
      {
        week: 1,
        title: "Sounds, introductions & sein",
        topics: [
          "German pronunciation",
          "Personal pronouns",
          "sein",
          "Regular verbs",
          "Verb-second word order",
          "W-questions",
        ],
      },
      {
        week: 2,
        title: "Present tense & everyday German",
        topics: [
          "haben",
          "Present tense",
          "Common verbs",
          "Question formation",
          "Family vocabulary",
        ],
      },
      {
        week: 3,
        title: "Articles & gender",
        topics: [
          "der / die / das",
          "ein / eine",
          "Plural forms",
          "Nominative",
          "Accusative introduction",
          "nicht vs kein",
        ],
      },
      {
        week: 4,
        title: "Accusative",
        topics: [
          "der → den",
          "ein → einen",
          "Direct objects",
          "Basic pronouns",
          "October consolidation",
        ],
      },
    ],
  },

  {
    month: "November",
    subtitle: "Making German useful",
    weeks: [
      {
        week: 5,
        title: "Modal verbs I",
        topics: ["können", "müssen", "wollen", "Infinitive at sentence end"],
      },
      {
        week: 6,
        title: "Modal verbs II",
        topics: ["dürfen", "sollen", "mögen", "möchten"],
      },
      {
        week: 7,
        title: "Separable verbs",
        topics: [
          "aufstehen",
          "anfangen",
          "einkaufen",
          "anrufen",
          "Daily routine",
        ],
      },
      {
        week: 8,
        title: "Time & frequency",
        topics: [
          "immer",
          "oft",
          "manchmal",
          "selten",
          "nie",
          "Mein Schultag",
        ],
      },
    ],
  },

  {
    month: "December",
    subtitle: "Cases & the past",
    weeks: [
      {
        week: 9,
        title: "Dative introduction",
        topics: ["dem", "der", "den", "einem", "einer"],
      },
      {
        week: 10,
        title: "Prepositions",
        topics: [
          "Dative prepositions",
          "Accusative prepositions",
          "Preposition patterns",
        ],
      },
      {
        week: 11,
        title: "Perfekt",
        topics: [
          "haben + participle",
          "sein + participle",
          "Common past participles",
        ],
      },
      {
        week: 12,
        title: "Talking about the past",
        topics: [
          "Perfekt practice",
          "Yesterday",
          "Weekend",
          "December consolidation",
        ],
      },
    ],
  },

  {
    month: "January",
    subtitle: "Strong A1",
    weeks: [
      {
        week: 13,
        title: "weil",
        topics: ["Subordinate clauses", "Verb-final word order", "weil"],
      },
      {
        week: 14,
        title: "dass",
        topics: ["dass clauses", "Joining ideas", "Complex sentences"],
      },
      {
        week: 15,
        title: "Possessives & reflexive verbs",
        topics: [
          "mein / dein / sein",
          "unser / euer",
          "sich interessieren für",
        ],
      },
      {
        week: 16,
        title: "A1 Consolidation",
        topics: [
          "Grammar review",
          "100–130 word writing",
          "7–10 minute conversation",
          "A1 mock assessment",
        ],
      },
    ],
  },
];

export const starterTasks: LessonTask[] = [
  {
    id: "vocab-001",
    title: "First vocabulary",
    description: "Greetings, countries, school subjects and basic expressions.",
    type: "vocabulary",
    minutes: 8,
  },
  {
    id: "pronunciation-001",
    title: "German sounds",
    description: "Practise ä, ö, ü, ch, sch, ei, ie, eu, z, w and v.",
    type: "pronunciation",
    minutes: 8,
  },
  {
    id: "grammar-001",
    title: "Personal pronouns + sein",
    description: "Learn ich, du, er, sie, es, wir, ihr, Sie and conjugate sein.",
    type: "grammar",
    minutes: 12,
  },
  {
    id: "grammar-002",
    title: "Regular verbs + word order",
    description:
      "Conjugate common regular verbs and build German sentences with the verb in position 2.",
    type: "grammar",
    minutes: 14,
  },
  {
    id: "grammar-003",
    title: "Questions in German",
    description: "Form yes/no questions and basic W-questions.",
    type: "grammar",
    minutes: 11,
  },
  {
    id: "listening-001",
    title: "Listen for introductions",
    description: "Recognise names, countries and simple introductory phrases.",
    type: "listening",
    minutes: 7,
  },
  {
    id: "speaking-001",
    title: "Introduce yourself",
    description: "Give a short spoken introduction without reading a script.",
    type: "speaking",
    minutes: 5,
  },
  {
    id: "checkpoint-001",
    title: "Week 1 Checkpoint",
    description:
      "Test your Week 1 vocabulary, grammar, listening and spoken introduction.",
    type: "review",
    minutes: 22,
  },
  {
    id: "vocab-002",
    title: "Week 2 vocabulary",
    description:
      "Learn family, daily life, places, adjectives, days and months.",
    type: "vocabulary",
    minutes: 20,
    week: 2,
  },
  {
    id: "grammar-004",
    title: "haben",
    description: "Learn how to use and conjugate haben.",
    type: "grammar",
    minutes: 13,
    week: 2,
  },
  {
    id: "grammar-005",
    title: "Common present-tense verbs",
    description:
      "Consolidate the present tense and learn the vowel changes in sprechen, essen, lesen and schlafen.",
    type: "grammar",
    minutes: 15,
    week: 2,
  },
  {
    id: "writing-001",
    title: "My daily life",
    description:
      "Write a short paragraph about yourself and your daily life in German.",
    type: "writing",
    minutes: 14,
    week: 2,
  },
  {
    id: "reading-001",
    title: "Week 2 reading",
    description: "Read two short texts and answer questions about them.",
    type: "reading",
    minutes: 11,
    week: 2,
  },
  {
    id: "listening-002",
    title: "Week 2 listening",
    description:
      "Listen to short clips about family, daily life, school and time.",
    type: "listening",
    minutes: 11,
    week: 2,
  },
  {
    id: "checkpoint-002",
    title: "Week 2 Checkpoint",
    description:
      "Test your Week 2 vocabulary, grammar, reading, listening and writing.",
    type: "review",
    minutes: 24,
    week: 2,
  },
];