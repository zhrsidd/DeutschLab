import type {
  VocabularyBatch,
  VocabularyCategory,
  VocabularyItem,
} from "./week1Vocabulary";

/*
 * Week 3 vocabulary (vocab-003): school, home and everyday objects.
 *
 * Every noun stores its article, its plural (written out, never derived)
 * or `noPlural` for mass nouns, and `requireArticle` so that Review and
 * typed answers must include the correct article from here on.
 * Examples stay in the nominative ("Der Tisch ist groß.") on purpose.
 */

type Gender = "der" | "die" | "das";

interface NounRow {
  id: string;
  article: Gender;
  noun: string;
  /** Plural noun without article, or null for a noun with no ordinary plural. */
  plural: string | null;
  english: string;
  category: VocabularyCategory;
  exampleGerman: string;
  exampleEnglish: string;
  acceptedEnglish?: string[];
  /** Other correct German answers, written with the article. */
  acceptedGerman?: string[];
  note?: string;
}

const NO_PLURAL_NOTE = "No ordinary plural: used as a mass noun.";

const rows: NounRow[] = [
  // School objects
  { id: "stift", article: "der", noun: "Stift", plural: "Stifte", english: "pen", category: "school", exampleGerman: "Der Stift ist neu.", exampleEnglish: "The pen is new.", acceptedEnglish: ["marker"] },
  { id: "bleistift", article: "der", noun: "Bleistift", plural: "Bleistifte", english: "pencil", category: "school", exampleGerman: "Der Bleistift ist klein.", exampleEnglish: "The pencil is small." },
  { id: "kugelschreiber", article: "der", noun: "Kugelschreiber", plural: "Kugelschreiber", english: "ballpoint pen", category: "school", acceptedGerman: ["der Kuli"], exampleGerman: "Das ist ein Kugelschreiber.", exampleEnglish: "That is a ballpoint pen.", acceptedEnglish: ["biro", "pen", "ball pen", "ballpoint"], note: "Plural is unchanged. Informal: der Kuli." },
  { id: "heft", article: "das", noun: "Heft", plural: "Hefte", english: "exercise book", category: "school", exampleGerman: "Das Heft ist alt.", exampleEnglish: "The exercise book is old.", acceptedEnglish: ["notebook"] },
  { id: "buch", article: "das", noun: "Buch", plural: "Bücher", english: "book", category: "school", exampleGerman: "Das Buch ist interessant.", exampleEnglish: "The book is interesting.", note: "The plural has an umlaut and the ending -er." },
  { id: "tasche", article: "die", noun: "Tasche", plural: "Taschen", english: "bag", category: "school", exampleGerman: "Die Tasche ist groß.", exampleEnglish: "The bag is big." },
  { id: "rucksack", article: "der", noun: "Rucksack", plural: "Rucksäcke", english: "backpack", category: "school", exampleGerman: "Der Rucksack ist neu.", exampleEnglish: "The backpack is new.", acceptedEnglish: ["rucksack"] },
  { id: "lineal", article: "das", noun: "Lineal", plural: "Lineale", english: "ruler", category: "school", exampleGerman: "Das Lineal ist klein.", exampleEnglish: "The ruler is small." },
  { id: "schere", article: "die", noun: "Schere", plural: "Scheren", english: "scissors", category: "school", exampleGerman: "Das ist eine Schere.", exampleEnglish: "That is a pair of scissors.", acceptedEnglish: ["pair of scissors"], note: "Singular in German (eine Schere), plural in English." },
  { id: "tafel", article: "die", noun: "Tafel", plural: "Tafeln", english: "board / blackboard", category: "school", acceptedEnglish: ["chalkboard", "whiteboard"], exampleGerman: "Die Tafel ist groß.", exampleEnglish: "The board is big." },
  { id: "computer", article: "der", noun: "Computer", plural: "Computer", english: "computer", category: "school", exampleGerman: "Der Computer ist schnell.", exampleEnglish: "The computer is fast.", note: "Plural is unchanged." },
  { id: "bildschirm", article: "der", noun: "Bildschirm", plural: "Bildschirme", english: "screen", category: "school", acceptedGerman: ["der Monitor"], exampleGerman: "Der Bildschirm ist groß.", exampleEnglish: "The screen is big.", acceptedEnglish: ["monitor", "display"] },
  { id: "tastatur", article: "die", noun: "Tastatur", plural: "Tastaturen", english: "keyboard", category: "school", exampleGerman: "Die Tastatur ist neu.", exampleEnglish: "The keyboard is new." },

  // Rooms and home
  { id: "zimmer", article: "das", noun: "Zimmer", plural: "Zimmer", english: "room", category: "rooms", exampleGerman: "Das Zimmer ist klein.", exampleEnglish: "The room is small.", note: "Plural is unchanged." },
  { id: "wohnzimmer", article: "das", noun: "Wohnzimmer", plural: "Wohnzimmer", english: "living room", category: "rooms", acceptedEnglish: ["lounge", "sitting room"], exampleGerman: "Das Wohnzimmer ist groß.", exampleEnglish: "The living room is big.", note: "Plural is unchanged." },
  { id: "schlafzimmer", article: "das", noun: "Schlafzimmer", plural: "Schlafzimmer", english: "bedroom", category: "rooms", exampleGerman: "Das Schlafzimmer ist schön.", exampleEnglish: "The bedroom is nice.", note: "Plural is unchanged." },
  { id: "kueche", article: "die", noun: "Küche", plural: "Küchen", english: "kitchen", category: "rooms", exampleGerman: "Die Küche ist neu.", exampleEnglish: "The kitchen is new." },
  { id: "badezimmer", article: "das", noun: "Badezimmer", plural: "Badezimmer", english: "bathroom", category: "rooms", exampleGerman: "Das Badezimmer ist klein.", exampleEnglish: "The bathroom is small.", note: "Plural is unchanged." },
  { id: "tuer", article: "die", noun: "Tür", plural: "Türen", english: "door", category: "rooms", exampleGerman: "Die Tür ist alt.", exampleEnglish: "The door is old." },
  { id: "fenster", article: "das", noun: "Fenster", plural: "Fenster", english: "window", category: "rooms", exampleGerman: "Das Fenster ist groß.", exampleEnglish: "The window is big.", note: "Plural is unchanged." },
  { id: "wand", article: "die", noun: "Wand", plural: "Wände", english: "wall", category: "rooms", exampleGerman: "Die Wand ist neu.", exampleEnglish: "The wall is new.", note: "The plural has an umlaut." },
  { id: "boden", article: "der", noun: "Boden", plural: "Böden", english: "floor", category: "rooms", exampleGerman: "Der Boden ist alt.", exampleEnglish: "The floor is old.", acceptedEnglish: ["ground"], note: "The plural has an umlaut." },
  { id: "treppe", article: "die", noun: "Treppe", plural: "Treppen", english: "stairs / staircase", category: "rooms", acceptedEnglish: ["steps"], exampleGerman: "Die Treppe ist schön.", exampleEnglish: "The stairs are nice.", note: "Singular in German (die Treppe), plural in English." },
  { id: "garten", article: "der", noun: "Garten", plural: "Gärten", english: "garden", category: "rooms", exampleGerman: "Der Garten ist schön.", exampleEnglish: "The garden is nice.", note: "The plural has an umlaut." },

  // Furniture
  { id: "tisch", article: "der", noun: "Tisch", plural: "Tische", english: "table", category: "furniture", exampleGerman: "Der Tisch ist groß.", exampleEnglish: "The table is big." },
  { id: "stuhl", article: "der", noun: "Stuhl", plural: "Stühle", english: "chair", category: "furniture", exampleGerman: "Der Stuhl ist alt.", exampleEnglish: "The chair is old.", note: "The plural has an umlaut." },
  { id: "bett", article: "das", noun: "Bett", plural: "Betten", english: "bed", category: "furniture", exampleGerman: "Das Bett ist groß.", exampleEnglish: "The bed is big." },
  { id: "sofa", article: "das", noun: "Sofa", plural: "Sofas", english: "sofa", category: "furniture", acceptedGerman: ["die Couch"], exampleGerman: "Das Sofa ist neu.", exampleEnglish: "The sofa is new.", acceptedEnglish: ["couch"] },
  { id: "schrank", article: "der", noun: "Schrank", plural: "Schränke", english: "cupboard / wardrobe", category: "furniture", acceptedEnglish: ["closet", "cabinet"], exampleGerman: "Der Schrank ist groß.", exampleEnglish: "The cupboard is big.", note: "The plural has an umlaut." },
  { id: "regal", article: "das", noun: "Regal", plural: "Regale", english: "shelf", category: "furniture", acceptedEnglish: ["bookshelf", "shelves"], exampleGerman: "Das Regal ist klein.", exampleEnglish: "The shelf is small." },
  { id: "lampe", article: "die", noun: "Lampe", plural: "Lampen", english: "lamp", category: "furniture", acceptedEnglish: ["light"], exampleGerman: "Die Lampe ist neu.", exampleEnglish: "The lamp is new." },
  { id: "spiegel", article: "der", noun: "Spiegel", plural: "Spiegel", english: "mirror", category: "furniture", exampleGerman: "Der Spiegel ist schön.", exampleEnglish: "The mirror is nice.", note: "Plural is unchanged." },

  // Food and drink
  { id: "brot", article: "das", noun: "Brot", plural: "Brote", english: "bread", category: "food", exampleGerman: "Das Brot ist gut.", exampleEnglish: "The bread is good.", note: "Die Brote means loaves or kinds of bread." },
  { id: "apfel", article: "der", noun: "Apfel", plural: "Äpfel", english: "apple", category: "food", exampleGerman: "Der Apfel ist gut.", exampleEnglish: "The apple is good.", note: "The plural has an umlaut." },
  { id: "banane", article: "die", noun: "Banane", plural: "Bananen", english: "banana", category: "food", exampleGerman: "Die Banane ist gut.", exampleEnglish: "The banana is good." },
  { id: "milch", article: "die", noun: "Milch", plural: null, english: "milk", category: "food", exampleGerman: "Die Milch ist gut.", exampleEnglish: "The milk is good.", note: NO_PLURAL_NOTE },
  { id: "kaese", article: "der", noun: "Käse", plural: null, english: "cheese", category: "food", exampleGerman: "Der Käse ist gut.", exampleEnglish: "The cheese is good.", note: NO_PLURAL_NOTE },
  { id: "ei", article: "das", noun: "Ei", plural: "Eier", english: "egg", category: "food", exampleGerman: "Das Ei ist klein.", exampleEnglish: "The egg is small." },
  { id: "reis", article: "der", noun: "Reis", plural: null, english: "rice", category: "food", exampleGerman: "Der Reis ist gut.", exampleEnglish: "The rice is good.", note: NO_PLURAL_NOTE },
  { id: "kartoffel", article: "die", noun: "Kartoffel", plural: "Kartoffeln", english: "potato", category: "food", exampleGerman: "Die Kartoffel ist klein.", exampleEnglish: "The potato is small." },
  { id: "saft", article: "der", noun: "Saft", plural: "Säfte", english: "juice", category: "food", exampleGerman: "Der Saft ist gut.", exampleEnglish: "The juice is good.", note: "Die Säfte means kinds of juice." },
  { id: "suppe", article: "die", noun: "Suppe", plural: "Suppen", english: "soup", category: "food", exampleGerman: "Die Suppe ist gut.", exampleEnglish: "The soup is good." },
  { id: "gemuese", article: "das", noun: "Gemüse", plural: null, english: "vegetables", category: "food", exampleGerman: "Das Gemüse ist gut.", exampleEnglish: "The vegetables are good.", acceptedEnglish: ["vegetable", "veggies", "veg"], note: "Singular in German (das Gemüse), plural in English. No ordinary plural." },
  { id: "wasser", article: "das", noun: "Wasser", plural: null, english: "water", category: "food", exampleGerman: "Das Wasser ist gut.", exampleEnglish: "The water is good.", note: NO_PLURAL_NOTE },
  { id: "kaffee", article: "der", noun: "Kaffee", plural: null, english: "coffee", category: "food", exampleGerman: "Der Kaffee ist gut.", exampleEnglish: "The coffee is good.", note: NO_PLURAL_NOTE },

  // Everyday objects
  { id: "handy", article: "das", noun: "Handy", plural: "Handys", english: "mobile phone", category: "objects", acceptedGerman: ["das Smartphone"], exampleGerman: "Das Handy ist neu.", exampleEnglish: "The mobile phone is new.", acceptedEnglish: ["phone", "cell phone", "mobile", "smartphone"], note: "A German word for a phone that looks English but is not used in English." },
  { id: "schluessel", article: "der", noun: "Schlüssel", plural: "Schlüssel", english: "key", category: "objects", exampleGerman: "Der Schlüssel ist klein.", exampleEnglish: "The key is small.", note: "Plural is unchanged." },
  { id: "uhr", article: "die", noun: "Uhr", plural: "Uhren", english: "clock / watch", category: "objects", exampleGerman: "Die Uhr ist schön.", exampleEnglish: "The clock is nice." },
  { id: "flasche", article: "die", noun: "Flasche", plural: "Flaschen", english: "bottle", category: "objects", exampleGerman: "Die Flasche ist groß.", exampleEnglish: "The bottle is big." },
  { id: "glas", article: "das", noun: "Glas", plural: "Gläser", english: "glass", category: "objects", exampleGerman: "Das Glas ist klein.", exampleEnglish: "The glass is small.", note: "The plural has an umlaut and the ending -er." },
  { id: "tasse", article: "die", noun: "Tasse", plural: "Tassen", english: "cup", category: "objects", acceptedEnglish: ["mug"], exampleGerman: "Die Tasse ist neu.", exampleEnglish: "The cup is new." },
  { id: "teller", article: "der", noun: "Teller", plural: "Teller", english: "plate", category: "objects", exampleGerman: "Der Teller ist klein.", exampleEnglish: "The plate is small.", note: "Plural is unchanged." },
  { id: "gabel", article: "die", noun: "Gabel", plural: "Gabeln", english: "fork", category: "objects", exampleGerman: "Die Gabel ist neu.", exampleEnglish: "The fork is new." },
  { id: "messer", article: "das", noun: "Messer", plural: "Messer", english: "knife", category: "objects", exampleGerman: "Das Messer ist neu.", exampleEnglish: "The knife is new.", note: "Plural is unchanged." },
  { id: "loeffel", article: "der", noun: "Löffel", plural: "Löffel", english: "spoon", category: "objects", exampleGerman: "Der Löffel ist klein.", exampleEnglish: "The spoon is small.", note: "Plural is unchanged." },
  { id: "auto", article: "das", noun: "Auto", plural: "Autos", english: "car", category: "objects", exampleGerman: "Das Auto ist schnell.", exampleEnglish: "The car is fast." },
  { id: "fahrrad", article: "das", noun: "Fahrrad", plural: "Fahrräder", english: "bicycle", category: "objects", exampleGerman: "Das Fahrrad ist alt.", exampleEnglish: "The bicycle is old.", acceptedEnglish: ["bike"], note: "The plural has an umlaut and the ending -er." },

  // People
  { id: "lehrer", article: "der", noun: "Lehrer", plural: "Lehrer", english: "teacher (male)", category: "people", exampleGerman: "Der Lehrer ist gut.", exampleEnglish: "The teacher is good.", acceptedEnglish: ["teacher"], note: "Plural is unchanged." },
  { id: "lehrerin", article: "die", noun: "Lehrerin", plural: "Lehrerinnen", english: "teacher (female)", category: "people", exampleGerman: "Die Lehrerin ist gut.", exampleEnglish: "The teacher is good.", acceptedEnglish: ["teacher"] },
  { id: "schueler", article: "der", noun: "Schüler", plural: "Schüler", english: "pupil (male)", category: "people", exampleGerman: "Der Schüler ist neu.", exampleEnglish: "The pupil is new.", acceptedEnglish: ["pupil", "student", "schoolboy"], note: "Plural is unchanged." },
  { id: "schuelerin", article: "die", noun: "Schülerin", plural: "Schülerinnen", english: "pupil (female)", category: "people", exampleGerman: "Die Schülerin ist neu.", exampleEnglish: "The pupil is new.", acceptedEnglish: ["pupil", "student", "schoolgirl"] },
  { id: "mann", article: "der", noun: "Mann", plural: "Männer", english: "man", category: "people", exampleGerman: "Der Mann ist Lehrer.", exampleEnglish: "The man is a teacher.", note: "The plural has an umlaut and the ending -er." },
  { id: "frau", article: "die", noun: "Frau", plural: "Frauen", english: "woman", category: "people", exampleGerman: "Die Frau ist Lehrerin.", exampleEnglish: "The woman is a teacher.", acceptedEnglish: ["wife"] },
  { id: "maedchen", article: "das", noun: "Mädchen", plural: "Mädchen", english: "girl", category: "people", exampleGerman: "Das Mädchen ist klein.", exampleEnglish: "The girl is small.", note: "Neuter, even though a girl is female. Grammatical gender is not biological gender." },
  { id: "junge", article: "der", noun: "Junge", plural: "Jungen", english: "boy", category: "people", exampleGerman: "Der Junge ist klein.", exampleEnglish: "The boy is small." },
];

export const week3Vocabulary: VocabularyItem[] = rows.map((row) => ({
  id: row.id,
  german: `${row.article} ${row.noun}`,
  english: row.english,
  category: row.category,
  partOfSpeech: "noun",
  article: row.article,
  ...(row.plural
    ? { plural: `die ${row.plural}` }
    : { noPlural: true }),
  requireArticle: true,
  ...(row.acceptedEnglish ? { acceptedEnglish: row.acceptedEnglish } : {}),
  ...(row.acceptedGerman ? { acceptedGerman: row.acceptedGerman } : {}),
  exampleGerman: row.exampleGerman,
  exampleEnglish: row.exampleEnglish,
  ...(row.note ? { note: row.note } : {}),
}));

export const week3VocabularyBatches: VocabularyBatch[] = [
  {
    id: "w3-school",
    title: "School objects",
    intro:
      "Things in your school bag and classroom. Learn each noun together with its article: the article is part of the word you need to remember.",
    itemIds: [
      "stift", "bleistift", "kugelschreiber", "heft", "buch",
      "tasche", "rucksack", "lineal", "schere", "tafel",
    ],
  },
  {
    id: "w3-tech",
    title: "Computers and everyday things",
    intro:
      "Technology and things you carry or use every day. Some plurals add -e or -s, and some do not change at all.",
    itemIds: [
      "computer", "bildschirm", "tastatur", "handy",
      "schluessel", "uhr", "auto", "fahrrad",
    ],
  },
  {
    id: "w3-rooms",
    title: "Rooms and home",
    intro:
      "The rooms of a home and the parts of a room. Many nouns ending in -zimmer are neuter: das Zimmer, das Wohnzimmer.",
    itemIds: [
      "zimmer", "wohnzimmer", "schlafzimmer", "kueche", "badezimmer",
      "tuer", "fenster", "wand", "boden", "treppe", "garten",
    ],
  },
  {
    id: "w3-furniture",
    title: "Furniture",
    intro:
      "What is in a room. Watch the umlauts in the plurals: der Stuhl → die Stühle, der Schrank → die Schränke.",
    itemIds: [
      "tisch", "stuhl", "bett", "sofa", "schrank", "regal", "lampe", "spiegel",
    ],
  },
  {
    id: "w3-food",
    title: "Food and the table",
    intro:
      "Everyday food, plus what you eat it with. Rice has no ordinary plural, but most of these nouns do.",
    itemIds: [
      "brot", "apfel", "banane", "ei", "reis", "kartoffel", "suppe",
      "teller", "gabel", "messer", "loeffel",
    ],
  },
  {
    id: "w3-drinks",
    title: "Drinks and mass nouns",
    intro:
      "Milk, water and coffee are mass nouns, so they have no ordinary plural. You still need to know their article.",
    itemIds: [
      "milch", "kaese", "gemuese", "saft", "wasser",
      "kaffee", "flasche", "glas", "tasse",
    ],
  },
  {
    id: "w3-people",
    title: "People",
    intro:
      "Common people nouns. Grammatical gender is not biological gender: das Mädchen is neuter. Many jobs have a feminine form ending in -in.",
    itemIds: [
      "lehrer", "lehrerin", "schueler", "schuelerin",
      "mann", "frau", "maedchen", "junge",
    ],
  },
];
