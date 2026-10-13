export type VocabularyCategory =
  | "greetings"
  | "pronouns"
  | "verbs"
  | "countries"
  | "languages"
  | "subjects"
  | "numbers"
  | "family"
  | "activities"
  | "places"
  | "adjectives"
  | "days"
  | "months"
  | "time"
  | "school"
  | "rooms"
  | "furniture"
  | "food"
  | "objects"
  | "people"
  | "actions"
  | "meals"
  | "home"
  | "clothes"
  | "study"
  | "descriptions"
  | "expressions";

export interface VocabularyItem {
  id: string;
  german: string;
  english: string;
  category: VocabularyCategory;
  exampleGerman?: string;
  exampleEnglish?: string;
  note?: string;
  /** Extra English answers that are clearly correct. */
  acceptedEnglish?: string[];
  /** Extra German answers (e.g. without the article). */
  acceptedGerman?: string[];
  /** What the speech engine says, if different from `german`. */
  audioText?: string;
  partOfSpeech?:
    | "noun"
    | "verb"
    | "pronoun"
    | "expression"
    | "number"
    | "adjective"
    | "adverb";
  article?: "der" | "die" | "das";
  plural?: string;
  /** Mass or collective noun with no ordinary plural (never assessed). */
  noPlural?: boolean;
  /**
   * Article-aware item (Week 3 onwards): Review and typed answers must
   * include the correct article. Older items keep accepting bare nouns.
   */
  requireArticle?: boolean;
}

export const categoryLabels: Record<VocabularyCategory, string> = {
  greetings: "Greetings",
  pronouns: "Pronouns",
  verbs: "Verbs",
  countries: "Countries",
  languages: "Languages",
  subjects: "School subjects",
  numbers: "Numbers",
  family: "Family",
  activities: "Daily activities",
  places: "Places",
  adjectives: "Adjectives",
  days: "Days",
  months: "Months",
  time: "Time words",
  school: "School objects",
  rooms: "Rooms and home",
  furniture: "Furniture",
  food: "Food and drink",
  objects: "Everyday objects",
  people: "People",
  actions: "Everyday actions",
  meals: "Food and meals",
  home: "Home and daily life",
  clothes: "Clothes and belongings",
  study: "School and study",
  descriptions: "Descriptions",
  expressions: "Useful expressions",
};

export const week1Vocabulary: VocabularyItem[] = [
  {
    id: "hallo",
    category: "greetings",
    partOfSpeech: "expression",
    acceptedEnglish: ["Hi"],
    german: "Hallo",
    english: "Hello",
    exampleGerman: "Hallo! Ich heiße Zuhayr.",
    exampleEnglish: "Hello! My name is Zuhayr.",
  },
  {
    id: "guten-morgen",
    category: "greetings",
    partOfSpeech: "expression",
    german: "Guten Morgen",
    english: "Good morning",
    exampleGerman: "Guten Morgen! Wie geht es dir?",
    exampleEnglish: "Good morning! How are you?",
  },
  {
    id: "guten-tag",
    category: "greetings",
    partOfSpeech: "expression",
    german: "Guten Tag",
    english: "Good day / Hello",
    exampleGerman: "Guten Tag, Herr Müller.",
    exampleEnglish: "Good day, Mr Müller.",
    note: "A more formal daytime greeting.",
  },
  {
    id: "guten-abend",
    category: "greetings",
    partOfSpeech: "expression",
    german: "Guten Abend",
    english: "Good evening",
    exampleGerman: "Guten Abend! Wie geht es Ihnen?",
    exampleEnglish: "Good evening! How are you?",
  },
  {
    id: "tschuss",
    category: "greetings",
    partOfSpeech: "expression",
    acceptedEnglish: ["Bye bye", "See you"],
    german: "Tschüss",
    english: "Bye",
    exampleGerman: "Tschüss! Bis morgen.",
    exampleEnglish: "Bye! See you tomorrow.",
  },
  {
    id: "auf-wiedersehen",
    category: "greetings",
    partOfSpeech: "expression",
    german: "Auf Wiedersehen",
    english: "Goodbye",
    exampleGerman: "Auf Wiedersehen, Frau Schmidt.",
    exampleEnglish: "Goodbye, Ms Schmidt.",
    note: "More formal than Tschüss.",
  },
  {
    id: "danke",
    category: "greetings",
    partOfSpeech: "expression",
    acceptedEnglish: ["Thanks"],
    german: "Danke",
    english: "Thank you",
    exampleGerman: "Danke für deine Hilfe.",
    exampleEnglish: "Thank you for your help.",
  },
  {
    id: "bitte",
    category: "greetings",
    partOfSpeech: "expression",
    acceptedEnglish: ["You are welcome", "Welcome"],
    german: "Bitte",
    english: "Please / You're welcome",
    exampleGerman: "Ein Wasser, bitte.",
    exampleEnglish: "A water, please.",
    note: "Bitte can mean both “please” and “you're welcome”.",
  },
  {
    id: "ja",
    category: "greetings",
    partOfSpeech: "expression",
    german: "Ja",
    english: "Yes",
    exampleGerman: "Ja, ich lerne Deutsch.",
    exampleEnglish: "Yes, I am learning German.",
  },
  {
    id: "nein",
    category: "greetings",
    partOfSpeech: "expression",
    german: "Nein",
    english: "No",
    exampleGerman: "Nein, ich spreche noch nicht gut Deutsch.",
    exampleEnglish: "No, I don't speak German well yet.",
  },
  {
    id: "entschuldigung",
    german: "Entschuldigung",
    english: "Excuse me / Sorry",
    category: "greetings",
    partOfSpeech: "expression",
    acceptedEnglish: ["Excuse me", "Sorry", "Pardon"],
    exampleGerman: "Entschuldigung, sind Sie Herr Weber?",
    exampleEnglish: "Excuse me, are you Mr Weber?",
  },
  {
    id: "wie-gehts",
    german: "Wie geht's?",
    english: "How are you?",
    category: "greetings",
    partOfSpeech: "expression",
    acceptedEnglish: ["How are you doing", "How's it going"],
    acceptedGerman: ["Wie geht es dir?"],
    exampleGerman: "Hallo Anna! Wie geht's?",
    exampleEnglish: "Hi Anna! How are you?",
    note: "Informal. To an adult you don't know well, say “Wie geht es Ihnen?”.",
  },
  {
    id: "ich",
    german: "ich",
    english: "I",
    category: "pronouns",
    partOfSpeech: "pronoun",
    exampleGerman: "Ich bin Schüler.",
    exampleEnglish: "I am a student.",
    note: "Only capitalised at the start of a sentence.",
  },
  {
    id: "du",
    german: "du",
    english: "you (informal)",
    category: "pronouns",
    partOfSpeech: "pronoun",
    acceptedEnglish: ["you"],
    exampleGerman: "Du bist in der Klasse.",
    exampleEnglish: "You are in the class.",
    note: "For one friend, classmate or family member.",
  },
  {
    id: "er",
    german: "er",
    english: "he",
    category: "pronouns",
    partOfSpeech: "pronoun",
    exampleGerman: "Er ist Lehrer.",
    exampleEnglish: "He is a teacher.",
  },
  {
    id: "sie-she",
    german: "sie",
    english: "she / they",
    category: "pronouns",
    partOfSpeech: "pronoun",
    exampleGerman: "Sie ist Lehrerin.",
    exampleEnglish: "She is a teacher.",
    note: "sie ist = she is. sie sind = they are.",
  },
  {
    id: "es",
    german: "es",
    english: "it",
    category: "pronouns",
    partOfSpeech: "pronoun",
    exampleGerman: "Es ist gut.",
    exampleEnglish: "It is good.",
  },
  {
    id: "wir",
    german: "wir",
    english: "we",
    category: "pronouns",
    partOfSpeech: "pronoun",
    exampleGerman: "Wir sind Studenten.",
    exampleEnglish: "We are students.",
  },
  {
    id: "ihr",
    german: "ihr",
    english: "you (plural, informal)",
    category: "pronouns",
    partOfSpeech: "pronoun",
    acceptedEnglish: ["you", "you all", "you guys"],
    exampleGerman: "Ihr seid in der Schule.",
    exampleEnglish: "You (all) are at school.",
    note: "For several friends or classmates.",
  },
  {
    id: "sie-formal",
    german: "Sie",
    english: "you (formal)",
    category: "pronouns",
    partOfSpeech: "pronoun",
    acceptedEnglish: ["you", "formal you"],
    exampleGerman: "Sind Sie Frau Meier?",
    exampleEnglish: "Are you Ms Meier?",
    note: "Always capital S. For adults you don't know well, such as teachers.",
  },
  {
    id: "heissen",
    german: "heißen",
    english: "to be called",
    category: "verbs",
    partOfSpeech: "verb",
    acceptedEnglish: ["to be named", "be named"],
    exampleGerman: "Ich heiße Anna.",
    exampleEnglish: "My name is Anna.",
    note: "Ich heiße … is the usual way to say your name.",
  },
  {
    id: "sein",
    german: "sein",
    english: "to be",
    category: "verbs",
    partOfSpeech: "verb",
    exampleGerman: "Ich bin Schüler.",
    exampleEnglish: "I am a student.",
    note: "Irregular: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.",
  },
  {
    id: "kommen",
    german: "kommen",
    english: "to come",
    category: "verbs",
    partOfSpeech: "verb",
    exampleGerman: "Ich komme aus Indien.",
    exampleEnglish: "I come from India.",
    note: "komme aus + country = come from.",
  },
  {
    id: "wohnen",
    german: "wohnen",
    english: "to live",
    category: "verbs",
    partOfSpeech: "verb",
    acceptedEnglish: ["to reside"],
    exampleGerman: "Ich wohne in Zürich.",
    exampleEnglish: "I live in Zurich.",
    note: "wohne in + place = live in.",
  },
  {
    id: "sprechen",
    german: "sprechen",
    english: "to speak",
    category: "verbs",
    partOfSpeech: "verb",
    acceptedEnglish: ["to talk"],
    exampleGerman: "Ich spreche Deutsch und Englisch.",
    exampleEnglish: "I speak German and English.",
    note: "Irregular with du and er/sie/es. You'll meet those forms later.",
  },
  {
    id: "lernen",
    german: "lernen",
    english: "to learn",
    category: "verbs",
    partOfSpeech: "verb",
    exampleGerman: "Ich lerne Deutsch.",
    exampleEnglish: "I am learning German.",
  },
  {
    id: "deutschland",
    german: "Deutschland",
    english: "Germany",
    category: "countries",
    partOfSpeech: "noun",
    exampleGerman: "Ich komme aus Deutschland.",
    exampleEnglish: "I come from Germany.",
  },
  {
    id: "schweiz",
    german: "die Schweiz",
    english: "Switzerland",
    category: "countries",
    partOfSpeech: "noun",
    article: "die",
    acceptedGerman: ["Schweiz"],
    exampleGerman: "Ich wohne in der Schweiz.",
    exampleEnglish: "I live in Switzerland.",
    note: "This country takes “die”. Learn it as a chunk: in der Schweiz, aus der Schweiz.",
  },
  {
    id: "oesterreich",
    german: "Österreich",
    english: "Austria",
    category: "countries",
    partOfSpeech: "noun",
    exampleGerman: "Ich komme aus Österreich.",
    exampleEnglish: "I come from Austria.",
  },
  {
    id: "katar",
    german: "Katar",
    english: "Qatar",
    category: "countries",
    partOfSpeech: "noun",
    exampleGerman: "Ich wohne in Katar.",
    exampleEnglish: "I live in Qatar.",
    note: "Spelled with K in German.",
  },
  {
    id: "pakistan",
    german: "Pakistan",
    english: "Pakistan",
    category: "countries",
    partOfSpeech: "noun",
    exampleGerman: "Ich komme aus Pakistan.",
    exampleEnglish: "I come from Pakistan.",
  },
  {
    id: "indien",
    german: "Indien",
    english: "India",
    category: "countries",
    partOfSpeech: "noun",
    exampleGerman: "Ich komme aus Indien.",
    exampleEnglish: "I come from India.",
  },
  {
    id: "england",
    german: "England",
    english: "England",
    category: "countries",
    partOfSpeech: "noun",
    exampleGerman: "Ich komme aus England.",
    exampleEnglish: "I come from England.",
  },
  {
    id: "usa",
    german: "die USA",
    english: "USA",
    category: "countries",
    partOfSpeech: "noun",
    article: "die",
    audioText: "die U S A",
    acceptedEnglish: ["the USA", "US", "the US", "United States", "the United States", "America"],
    acceptedGerman: ["USA"],
    exampleGerman: "Ich wohne in den USA.",
    exampleEnglish: "I live in the USA.",
    note: "Plural: “die USA”, but “in den USA”. Learn the chunk.",
  },
  {
    id: "deutsch",
    german: "Deutsch",
    english: "German",
    category: "languages",
    partOfSpeech: "noun",
    exampleGerman: "Ich lerne Deutsch.",
    exampleEnglish: "I am learning German.",
    note: "Languages are capitalised. Deutsch is also a school subject.",
  },
  {
    id: "englisch",
    german: "Englisch",
    english: "English",
    category: "languages",
    partOfSpeech: "noun",
    exampleGerman: "Ich spreche Englisch.",
    exampleEnglish: "I speak English.",
    note: "Also a school subject.",
  },
  {
    id: "arabisch",
    german: "Arabisch",
    english: "Arabic",
    category: "languages",
    partOfSpeech: "noun",
    exampleGerman: "Ich spreche Arabisch.",
    exampleEnglish: "I speak Arabic.",
  },
  {
    id: "urdu",
    german: "Urdu",
    english: "Urdu",
    category: "languages",
    partOfSpeech: "noun",
    exampleGerman: "Ich spreche Urdu.",
    exampleEnglish: "I speak Urdu.",
  },
  {
    id: "franzoesisch",
    german: "Französisch",
    english: "French",
    category: "languages",
    partOfSpeech: "noun",
    exampleGerman: "Ich lerne Französisch.",
    exampleEnglish: "I am learning French.",
  },
  {
    id: "spanisch",
    german: "Spanisch",
    english: "Spanish",
    category: "languages",
    partOfSpeech: "noun",
    exampleGerman: "Ich lerne Spanisch.",
    exampleEnglish: "I am learning Spanish.",
  },
  {
    id: "mathematik",
    german: "Mathematik",
    english: "Mathematics",
    category: "subjects",
    partOfSpeech: "noun",
    article: "die",
    acceptedEnglish: ["Maths", "Math", "Mathematics"],
    acceptedGerman: ["Mathe"],
    exampleGerman: "Ich mag Mathematik.",
    exampleEnglish: "I like mathematics.",
    note: "In everyday speech people say “Mathe”.",
  },
  {
    id: "physik",
    german: "Physik",
    english: "Physics",
    category: "subjects",
    partOfSpeech: "noun",
    article: "die",
    exampleGerman: "Ich mag Physik.",
    exampleEnglish: "I like physics.",
  },
  {
    id: "chemie",
    german: "Chemie",
    english: "Chemistry",
    category: "subjects",
    partOfSpeech: "noun",
    article: "die",
    exampleGerman: "Ich lerne Chemie.",
    exampleEnglish: "I am learning chemistry.",
    note: "The ch varies by region: a soft ch or a k sound.",
  },
  {
    id: "biologie",
    german: "Biologie",
    english: "Biology",
    category: "subjects",
    partOfSpeech: "noun",
    article: "die",
    exampleGerman: "Ich mag Biologie.",
    exampleEnglish: "I like biology.",
  },
  {
    id: "informatik",
    german: "Informatik",
    english: "Computer science",
    category: "subjects",
    partOfSpeech: "noun",
    article: "die",
    acceptedEnglish: ["Informatics", "Computing", "Computer studies", "IT"],
    exampleGerman: "Ich lerne Informatik.",
    exampleEnglish: "I am learning computer science.",
  },
  {
    id: "geschichte",
    german: "Geschichte",
    english: "History",
    category: "subjects",
    partOfSpeech: "noun",
    article: "die",
    exampleGerman: "Ich mag Geschichte.",
    exampleEnglish: "I like history.",
    note: "Geschichte also means “story”.",
  },
  {
    id: "sport",
    german: "Sport",
    english: "PE / Sport",
    category: "subjects",
    partOfSpeech: "noun",
    article: "der",
    acceptedEnglish: ["Sport", "Sports", "PE", "Physical education", "Gym"],
    exampleGerman: "Ich mag Sport.",
    exampleEnglish: "I like sport.",
  },
];

/*
 * Numbers are generated from one table so spellings live in one place.
 * Tuple: [numeral, German, extra accepted German, note]
 */
const numberTable: [number, string, string[]?, string?][] = [
  [0, "null"],
  [1, "eins", undefined, "Counting: eins. Before a noun it becomes ein / eine."],
  [2, "zwei", undefined, "On the phone often said “zwo” so it isn't confused with drei."],
  [3, "drei"],
  [4, "vier"],
  [5, "fünf"],
  [6, "sechs"],
  [7, "sieben"],
  [8, "acht"],
  [9, "neun"],
  [10, "zehn"],
  [11, "elf"],
  [12, "zwölf"],
  [13, "dreizehn"],
  [14, "vierzehn"],
  [15, "fünfzehn"],
  [16, "sechzehn", undefined, "sechs loses its s: sech-zehn."],
  [17, "siebzehn", undefined, "sieben loses its en: sieb-zehn."],
  [18, "achtzehn"],
  [19, "neunzehn"],
  [20, "zwanzig"],
  [30, "dreißig", undefined, "The only tens number spelled with ß: dreißig (Swiss spelling: dreissig)."],
  [40, "vierzig"],
  [50, "fünfzig"],
  [60, "sechzig", undefined, "sechs loses its s: sech-zig."],
  [70, "siebzig", undefined, "sieben loses its en: sieb-zig."],
  [80, "achtzig"],
  [90, "neunzig"],
  [100, "hundert", ["einhundert"]],
];

const numberWords: Record<number, string> = {
  0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
  6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven",
  12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen",
  16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen",
  20: "twenty", 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty",
  70: "seventy", 80: "eighty", 90: "ninety", 100: "one hundred",
};

const numberItems: VocabularyItem[] = numberTable.map(
  ([value, german, acceptedGerman, note]) => ({
    id: `num-${value}`,
    german,
    english: `${value} (${numberWords[value]})`,
    category: "numbers",
    partOfSpeech: "number",
    acceptedEnglish: [String(value), numberWords[value]],
    acceptedGerman,
    note,
  }),
);

week1Vocabulary.push(...numberItems);

/*
 * Learning batches. The lesson walks through these in order:
 * batch intro → learn cards → short recall check.
 */
export interface VocabularyBatch {
  id: string;
  title: string;
  intro: string;
  itemIds: string[];
}

const ids = (from: number, to: number) =>
  numberTable
    .map(([value]) => value)
    .filter((value) => value >= from && value <= to)
    .map((value) => `num-${value}`);

export const vocabularyBatches: VocabularyBatch[] = [
  {
    id: "greetings",
    title: "Greetings & politeness",
    intro: "The first words you'll use every day: hello, goodbye, please and thank you.",
    itemIds: [
      "hallo", "guten-morgen", "guten-tag", "guten-abend", "tschuss",
      "auf-wiedersehen", "danke", "bitte", "ja", "nein",
      "entschuldigung", "wie-gehts",
    ],
  },
  {
    id: "pronouns",
    title: "Who is speaking? Pronouns",
    intro: "The eight pronouns you'll need to talk about yourself and others. Du is informal, Sie is formal.",
    itemIds: ["ich", "du", "er", "sie-she", "es", "wir", "ihr", "sie-formal"],
  },
  {
    id: "verbs",
    title: "Introduction verbs",
    intro: "Six verbs for introducing yourself: your name, where you're from, where you live and what you speak.",
    itemIds: ["heissen", "sein", "kommen", "wohnen", "sprechen", "lernen"],
  },
  {
    id: "countries",
    title: "Countries",
    intro: "A small set of countries for “Ich komme aus …” and “Ich wohne in …”. Some take “die”.",
    itemIds: [
      "deutschland", "schweiz", "oesterreich", "katar",
      "pakistan", "indien", "england", "usa",
    ],
  },
  {
    id: "languages",
    title: "Languages",
    intro: "Languages are capitalised in German. You'll use them with “sprechen” and “lernen”.",
    itemIds: ["deutsch", "englisch", "arabisch", "urdu", "franzoesisch", "spanisch"],
  },
  {
    id: "subjects",
    title: "School subjects",
    intro: "Subjects for talking about school. Deutsch and Englisch from the last batch are subjects too.",
    itemIds: [
      "mathematik", "physik", "chemie", "biologie",
      "informatik", "geschichte", "sport",
    ],
  },
  {
    id: "numbers-0-10",
    title: "Numbers 0–10",
    intro: "Count from null to zehn. Say each one out loud as you go.",
    itemIds: ids(0, 10),
  },
  {
    id: "numbers-11-20",
    title: "Numbers 11–20",
    intro: "Watch zwölf, sechzehn and siebzehn. They are not quite regular.",
    itemIds: ids(11, 20),
  },
  {
    id: "numbers-tens",
    title: "Tens up to 100",
    intro: "The -zig numbers. Dreißig is spelled with ß, and sechzig and siebzig drop letters.",
    itemIds: ids(30, 100),
  },
];
