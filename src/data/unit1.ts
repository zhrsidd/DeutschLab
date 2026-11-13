import { curriculumModulesByWeek, type CurriculumModule } from "./learningModules";

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
  /** Suggested Sunday–Saturday study window; never a date lock. */
  startsOn: string;
  endsOn: string;
  dates: string;
  outcome: string;
  modules: CurriculumModule[];
}

/** Four-week learning block; legacy type/property names retained for compatibility. */
export interface CurriculumMonth {
  month: string;
  subtitle: string;
  weeks: CurriculumWeek[];
}

export const unit1Curriculum: CurriculumMonth[] = [
  {
    month: "Foundations",
    subtitle: "15 Nov – 12 Dec 2026",
    weeks: [
      {
        week: 1,
        startsOn: "2026-11-15",
        endsOn: "2026-11-21",
        dates: "15 Nov 2026 – 21 Nov 2026",
        outcome: "Introduce myself and ask someone for basic personal details.",
        modules: curriculumModulesByWeek[1],
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
        startsOn: "2026-11-22",
        endsOn: "2026-11-28",
        dates: "22 Nov 2026 – 28 Nov 2026",
        outcome: "Describe my family and everyday activities in simple sentences.",
        modules: curriculumModulesByWeek[2],
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
        startsOn: "2026-11-29",
        endsOn: "2026-12-05",
        dates: "29 Nov 2026 – 5 Dec 2026",
        outcome: "Describe familiar belongings and say what I have or do not have.",
        modules: curriculumModulesByWeek[3],
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
        startsOn: "2026-12-06",
        endsOn: "2026-12-12",
        dates: "6 Dec 2026 – 12 Dec 2026",
        outcome: "Understand and describe everyday actions, people and belongings.",
        modules: curriculumModulesByWeek[4],
        title: "Accusative & irregular verbs",
        topics: [
          "Everyday vocabulary",
          "Accusative pronouns",
          "sehen, nehmen, fahren, treffen, tragen",
          "Direct objects",
          "Foundations consolidation",
        ],
      },
    ],
  },

  {
    month: "Everyday communication",
    subtitle: "13 Dec 2026 – 9 Jan 2027",
    weeks: [
      {
        week: 5,
        startsOn: "2026-12-13",
        endsOn: "2026-12-19",
        dates: "13 Dec 2026 – 19 Dec 2026",
        outcome: "Say what I can do, must do and want to do.",
        modules: curriculumModulesByWeek[5],
        title: "Modal verbs I",
        topics: ["können", "müssen", "wollen", "Infinitive at sentence end"],
      },
      {
        week: 6,
        startsOn: "2026-12-20",
        endsOn: "2026-12-26",
        dates: "20 Dec 2026 – 26 Dec 2026",
        outcome: "Make a polite request and express a preference.",
        modules: curriculumModulesByWeek[6],
        title: "Modal verbs II",
        topics: ["dürfen", "sollen", "mögen", "möchten"],
      },
      {
        week: 7,
        startsOn: "2026-12-27",
        endsOn: "2027-01-02",
        dates: "27 Dec 2026 – 2 Jan 2027",
        outcome: "Describe a daily routine with times and separable verbs.",
        modules: curriculumModulesByWeek[7],
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
        startsOn: "2027-01-03",
        endsOn: "2027-01-09",
        dates: "3 Jan 2027 – 9 Jan 2027",
        outcome: "Exchange routine information and describe how often I do things.",
        modules: curriculumModulesByWeek[8],
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
    month: "People, places and past",
    subtitle: "10 Jan – 6 Feb 2027",
    weeks: [
      {
        week: 9,
        startsOn: "2027-01-10",
        endsOn: "2027-01-16",
        dates: "10 Jan 2027 – 16 Jan 2027",
        outcome: "Understand and use a small set of practical dative patterns.",
        modules: curriculumModulesByWeek[9],
        title: "Dative introduction",
        topics: ["dem", "der", "den", "einem", "einer"],
      },
      {
        week: 10,
        startsOn: "2027-01-17",
        endsOn: "2027-01-23",
        dates: "17 Jan 2027 – 23 Jan 2027",
        outcome: "Understand and describe simple places, routes and activities.",
        modules: curriculumModulesByWeek[10],
        title: "Prepositions",
        topics: [
          "Dative prepositions",
          "Accusative prepositions",
          "Preposition patterns",
        ],
      },
      {
        week: 11,
        startsOn: "2027-01-24",
        endsOn: "2027-01-30",
        dates: "24 Jan 2027 – 30 Jan 2027",
        outcome: "Understand and describe a few completed activities in the Perfekt.",
        modules: curriculumModulesByWeek[11],
        title: "Perfekt",
        topics: [
          "haben + participle",
          "sein + participle",
          "Common past participles",
        ],
      },
      {
        week: 12,
        startsOn: "2027-01-31",
        endsOn: "2027-02-06",
        dates: "31 Jan 2027 – 6 Feb 2027",
        outcome: "Exchange simple information about yesterday or a recent weekend.",
        modules: curriculumModulesByWeek[12],
        title: "Talking about the past",
        topics: [
          "Perfekt practice",
          "Yesterday",
          "Weekend",
          "Past-tense consolidation",
        ],
      },
    ],
  },

  {
    month: "A1 consolidation",
    subtitle: "7 Feb – 6 Mar 2027",
    weeks: [
      {
        week: 13,
        startsOn: "2027-02-07",
        endsOn: "2027-02-13",
        dates: "7 Feb 2027 – 13 Feb 2027",
        outcome: "Give a simple reason for a familiar preference or activity.",
        modules: curriculumModulesByWeek[13],
        title: "weil",
        topics: ["Subordinate clauses", "Verb-final word order", "weil"],
      },
      {
        week: 14,
        startsOn: "2027-02-14",
        endsOn: "2027-02-20",
        dates: "14 Feb 2027 – 20 Feb 2027",
        outcome: "Understand and report a simple familiar statement.",
        modules: curriculumModulesByWeek[14],
        title: "dass",
        topics: ["dass clauses", "Joining ideas", "Complex sentences"],
      },
      {
        week: 15,
        startsOn: "2027-02-21",
        endsOn: "2027-02-27",
        dates: "21 Feb 2027 – 27 Feb 2027",
        outcome: "Describe whose belongings they are and talk about interests.",
        modules: curriculumModulesByWeek[15],
        title: "Possessives & reflexive verbs",
        topics: [
          "mein / dein / sein",
          "unser / euer",
          "sich interessieren für",
        ],
      },
      {
        week: 16,
        startsOn: "2027-02-28",
        endsOn: "2027-03-06",
        dates: "28 Feb 2027 – 6 Mar 2027",
        outcome: "Use familiar German across a new everyday conversation and message.",
        modules: curriculumModulesByWeek[16],
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
  {
    id: "vocab-003",
    title: "School, home and everyday objects",
    description: "Learn useful nouns with their articles and plurals.",
    type: "vocabulary",
    minutes: 25,
    week: 3,
  },
  {
    id: "grammar-006",
    title: "Nouns, articles and plurals",
    description:
      "Understand grammatical gender, nominative articles and common plural patterns.",
    type: "grammar",
    minutes: 15,
    week: 3,
  },
  {
    id: "grammar-007",
    title: "The accusative case",
    description:
      "Learn how German articles change when a noun is the direct object of a sentence.",
    type: "grammar",
    minutes: 15,
    week: 3,
  },
  {
    id: "grammar-008",
    title: "Negation — nicht and kein",
    description:
      "Learn how to make negative German sentences using nicht and kein.",
    type: "grammar",
    minutes: 13,
    week: 3,
  },
  {
    id: "reading-002",
    title: "Objects and descriptions",
    description: "Read two short texts about a room and school belongings.",
    type: "reading",
    minutes: 12,
    week: 3,
  },
  {
    id: "listening-003",
    title: "Objects and possession",
    description:
      "Listen to short clips about objects, what people have and what they do not have.",
    type: "listening",
    minutes: 12,
    week: 3,
  },
  {
    id: "writing-002",
    title: "My room and belongings",
    description:
      "Write a short paragraph about your room, school objects or belongings.",
    type: "writing",
    minutes: 15,
    week: 3,
  },
  {
    id: "checkpoint-003",
    title: "Week 3 Checkpoint",
    description:
      "Test your Week 3 vocabulary, grammar, reading, listening and writing.",
    type: "review",
    minutes: 25,
    week: 3,
  },
  {
    id: "vocab-004",
    title: "Everyday German in context",
    description:
      "Learn everyday actions, meals, home, clothes, school words, descriptions and useful phrases.",
    type: "vocabulary",
    minutes: 25,
    week: 4,
  },
  {
    id: "grammar-009",
    title: "Accusative pronouns",
    description:
      "Replace a direct object with mich, dich, ihn, sie, es, uns or euch.",
    type: "grammar",
    minutes: 14,
    week: 4,
  },
  {
    id: "grammar-010",
    title: "Irregular verbs and the accusative",
    description:
      "Learn sehen, nehmen, treffen, fahren and tragen, then combine verbs, articles, pronouns and word order.",
    type: "grammar",
    minutes: 16,
    week: 4,
  },
  {
    id: "reading-003",
    title: "Everyday descriptions",
    description: "Read two short texts about a school day and a home.",
    type: "reading",
    minutes: 12,
    week: 4,
  },
  {
    id: "listening-004",
    title: "Everyday conversations",
    description:
      "Listen to short clips and conversations about school, people, plans and shopping.",
    type: "listening",
    minutes: 12,
    week: 4,
  },
  {
    id: "writing-003",
    title: "Describing everyday life",
    description:
      "Write 60–80 words about yourself, your school, your activities, your home and your belongings.",
    type: "writing",
    minutes: 16,
    week: 4,
  },
  {
    id: "speaking-002",
    title: "Introducing myself and my daily life",
    description:
      "Prepare, practise and give a 2–3 minute spoken introduction about yourself and your daily life.",
    type: "speaking",
    minutes: 15,
    week: 4,
  },
  {
    id: "checkpoint-004",
    title: "Foundations Checkpoint",
    description:
      "The Week 4 mastery check and Foundations assessment: vocabulary, grammar, reading, listening, writing and speaking from Weeks 1–4.",
    type: "review",
    minutes: 40,
    week: 4,
  },
];