export type LessonType =
  | "vocabulary"
  | "grammar"
  | "pronunciation"
  | "listening"
  | "speaking"
  | "writing"
  | "review";

export interface LessonTask {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  minutes: number;
}

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
];