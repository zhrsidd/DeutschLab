import type {
  VocabularyBatch,
  VocabularyCategory,
  VocabularyItem,
} from "./week1Vocabulary";

/*
 * Week 4 vocabulary (vocab-004): everyday German in context.
 *
 * A mixed set: nouns (article-aware, like Week 3), verbs, adjectives and
 * useful expressions. Nouns store their article, a written-out plural (or
 * `noPlural` for mass nouns) and `requireArticle`. Verbs with a vowel change
 * show their du / er forms in the note; grammar-010 practises them.
 *
 * Examples use only Weeks 1–4 grammar: present tense, V2, nominative and
 * accusative articles, nicht / kein. Adjectives are only used after sein
 * (Die Jacke ist warm), never before a noun, because adjective endings are
 * not taught yet.
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
  acceptedGerman?: string[];
  note?: string;
}

const NO_PLURAL_NOTE = "No ordinary plural: used as a mass noun.";

const nouns: NounRow[] = [
  // Meals and food
  { id: "fruehstueck", article: "das", noun: "Frühstück", plural: "Frühstücke", english: "breakfast", category: "meals", exampleGerman: "Das Frühstück ist gut.", exampleEnglish: "Breakfast is good.", note: "The plural is rarely needed." },
  { id: "mittagessen", article: "das", noun: "Mittagessen", plural: "Mittagessen", english: "lunch", category: "meals", exampleGerman: "Heute ist das Mittagessen gut.", exampleEnglish: "Today lunch is good.", acceptedEnglish: ["midday meal"], note: "Plural is unchanged." },
  { id: "abendessen", article: "das", noun: "Abendessen", plural: "Abendessen", english: "dinner", category: "meals", exampleGerman: "Ich koche das Abendessen.", exampleEnglish: "I am cooking dinner.", acceptedEnglish: ["supper", "evening meal"], note: "Plural is unchanged." },
  { id: "broetchen", article: "das", noun: "Brötchen", plural: "Brötchen", english: "bread roll", category: "meals", exampleGerman: "Ich esse ein Brötchen.", exampleEnglish: "I am eating a bread roll.", acceptedEnglish: ["roll", "bun"], note: "Plural is unchanged. Nouns ending in -chen are always neuter." },
  { id: "butter", article: "die", noun: "Butter", plural: null, english: "butter", category: "meals", exampleGerman: "Ich brauche Butter.", exampleEnglish: "I need butter.", note: "No ordinary plural: used as a mass noun. Learn die Butter: some regions also use it as masculine." },
  { id: "tee", article: "der", noun: "Tee", plural: null, english: "tea", category: "meals", exampleGerman: "Ich trinke Tee.", exampleEnglish: "I drink tea.", note: NO_PLURAL_NOTE },
  { id: "fleisch", article: "das", noun: "Fleisch", plural: null, english: "meat", category: "meals", exampleGerman: "Ich esse kein Fleisch.", exampleEnglish: "I don't eat meat.", note: NO_PLURAL_NOTE },
  { id: "fisch", article: "der", noun: "Fisch", plural: "Fische", english: "fish", category: "meals", exampleGerman: "Ich esse heute Fisch.", exampleEnglish: "I am eating fish today." },
  { id: "kuchen", article: "der", noun: "Kuchen", plural: "Kuchen", english: "cake", category: "meals", exampleGerman: "Der Kuchen ist lecker.", exampleEnglish: "The cake is tasty.", note: "Plural is unchanged." },
  { id: "schokolade", article: "die", noun: "Schokolade", plural: null, english: "chocolate", category: "meals", exampleGerman: "Ich kaufe Schokolade.", exampleEnglish: "I am buying chocolate.", note: NO_PLURAL_NOTE },
  { id: "obst", article: "das", noun: "Obst", plural: null, english: "fruit", category: "meals", exampleGerman: "Ich esse Obst.", exampleEnglish: "I eat fruit.", note: "Fruit in general, with no ordinary plural. One apple is ein Apfel." },
  { id: "tomate", article: "die", noun: "Tomate", plural: "Tomaten", english: "tomato", category: "meals", exampleGerman: "Ich brauche eine Tomate.", exampleEnglish: "I need a tomato." },
  { id: "salat", article: "der", noun: "Salat", plural: "Salate", english: "salad", category: "meals", exampleGerman: "Ich mache einen Salat.", exampleEnglish: "I am making a salad.", acceptedEnglish: ["lettuce"] },

  // Home and daily life
  { id: "wohnung", article: "die", noun: "Wohnung", plural: "Wohnungen", english: "flat / apartment", category: "home", exampleGerman: "Die Wohnung ist klein.", exampleEnglish: "The flat is small.", note: "Nouns ending in -ung are always feminine." },
  { id: "kuehlschrank", article: "der", noun: "Kühlschrank", plural: "Kühlschränke", english: "fridge", category: "home", exampleGerman: "Der Kühlschrank ist neu.", exampleEnglish: "The fridge is new.", acceptedEnglish: ["refrigerator"], note: "Like der Schrank: the plural has an umlaut." },
  { id: "fernseher", article: "der", noun: "Fernseher", plural: "Fernseher", english: "television / TV", category: "home", exampleGerman: "Der Fernseher ist alt.", exampleEnglish: "The television is old.", acceptedEnglish: ["tv set", "television set"], note: "Plural is unchanged." },
  { id: "bild", article: "das", noun: "Bild", plural: "Bilder", english: "picture", category: "home", exampleGerman: "Das Bild ist schön.", exampleEnglish: "The picture is beautiful.", acceptedEnglish: ["image", "painting", "photo"], note: "The plural ends in -er." },
  { id: "hund", article: "der", noun: "Hund", plural: "Hunde", english: "dog", category: "home", exampleGerman: "Ich habe einen Hund.", exampleEnglish: "I have a dog." },
  { id: "katze", article: "die", noun: "Katze", plural: "Katzen", english: "cat", category: "home", exampleGerman: "Die Katze schläft.", exampleEnglish: "The cat is sleeping." },
  { id: "geld", article: "das", noun: "Geld", plural: null, english: "money", category: "home", exampleGerman: "Ich habe kein Geld.", exampleEnglish: "I have no money.", note: "No ordinary plural: used as a mass noun. (die Gelder means funds.)" },
  { id: "zeit", article: "die", noun: "Zeit", plural: "Zeiten", english: "time", category: "home", exampleGerman: "Ich habe keine Zeit.", exampleEnglish: "I have no time." },

  // Clothes and belongings
  { id: "kleidung", article: "die", noun: "Kleidung", plural: null, english: "clothes / clothing", category: "clothes", exampleGerman: "Die Kleidung ist neu.", exampleEnglish: "The clothes are new.", note: "Singular in German (die Kleidung), plural in English. No ordinary plural." },
  { id: "jacke", article: "die", noun: "Jacke", plural: "Jacken", english: "jacket", category: "clothes", exampleGerman: "Die Jacke ist warm.", exampleEnglish: "The jacket is warm.", acceptedEnglish: ["coat"] },
  { id: "hose", article: "die", noun: "Hose", plural: "Hosen", english: "trousers", category: "clothes", exampleGerman: "Die Hose ist neu.", exampleEnglish: "The trousers are new.", acceptedEnglish: ["pants", "pair of trousers"], note: "Singular in German (eine Hose), plural in English." },
  { id: "t-shirt", article: "das", noun: "T-Shirt", plural: "T-Shirts", english: "T-shirt", category: "clothes", exampleGerman: "Das T-Shirt ist billig.", exampleEnglish: "The T-shirt is cheap.", acceptedEnglish: ["tshirt", "t shirt", "tee shirt"] },
  { id: "schuh", article: "der", noun: "Schuh", plural: "Schuhe", english: "shoe", category: "clothes", exampleGerman: "Die Schuhe sind neu.", exampleEnglish: "The shoes are new." },
  { id: "brille", article: "die", noun: "Brille", plural: "Brillen", english: "glasses", category: "clothes", exampleGerman: "Ich trage eine Brille.", exampleEnglish: "I wear glasses.", acceptedEnglish: ["spectacles", "pair of glasses"], note: "Singular in German (eine Brille), plural in English." },

  // School and study
  { id: "hausaufgabe", article: "die", noun: "Hausaufgabe", plural: "Hausaufgaben", english: "homework task", category: "study", exampleGerman: "Ich mache die Hausaufgaben.", exampleEnglish: "I am doing the homework.", acceptedEnglish: ["homework", "homework exercise"], note: "Usually plural: die Hausaufgaben = homework." },
  { id: "klasse", article: "die", noun: "Klasse", plural: "Klassen", english: "class", category: "study", exampleGerman: "Die Klasse ist groß.", exampleEnglish: "The class is big.", acceptedEnglish: ["school class", "form", "grade"] },
  { id: "pruefung", article: "die", noun: "Prüfung", plural: "Prüfungen", english: "exam", category: "study", exampleGerman: "Die Prüfung ist heute.", exampleEnglish: "The exam is today.", acceptedEnglish: ["examination", "test"], note: "Nouns ending in -ung are always feminine." },
  { id: "test", article: "der", noun: "Test", plural: "Tests", english: "test", category: "study", exampleGerman: "Der Test ist einfach.", exampleEnglish: "The test is easy.", acceptedEnglish: ["quiz"] },
  { id: "frage", article: "die", noun: "Frage", plural: "Fragen", english: "question", category: "study", exampleGerman: "Ich habe eine Frage.", exampleEnglish: "I have a question." },
  { id: "antwort", article: "die", noun: "Antwort", plural: "Antworten", english: "answer", category: "study", exampleGerman: "Die Antwort ist richtig.", exampleEnglish: "The answer is correct.", acceptedEnglish: ["reply"] },
  { id: "wort", article: "das", noun: "Wort", plural: "Wörter", english: "word", category: "study", exampleGerman: "Das Wort ist neu.", exampleEnglish: "The word is new.", note: "The plural has an umlaut and the ending -er: die Wörter." },
  { id: "satz", article: "der", noun: "Satz", plural: "Sätze", english: "sentence", category: "study", exampleGerman: "Der Satz ist lang.", exampleEnglish: "The sentence is long.", note: "The plural has an umlaut." },
  { id: "fach", article: "das", noun: "Fach", plural: "Fächer", english: "school subject", category: "study", exampleGerman: "Das Fach ist interessant.", exampleEnglish: "The subject is interesting.", acceptedEnglish: ["subject"], note: "The plural has an umlaut and the ending -er." },
  { id: "stunde", article: "die", noun: "Stunde", plural: "Stunden", english: "hour / lesson", category: "study", exampleGerman: "Die Stunde ist lang.", exampleEnglish: "The lesson is long.", acceptedEnglish: ["class", "period"], note: "An hour, or a school lesson." },
  { id: "pause", article: "die", noun: "Pause", plural: "Pausen", english: "break", category: "study", exampleGerman: "Die Pause ist kurz.", exampleEnglish: "The break is short.", acceptedEnglish: ["pause", "recess", "breaktime"] },
  { id: "woerterbuch", article: "das", noun: "Wörterbuch", plural: "Wörterbücher", english: "dictionary", category: "study", exampleGerman: "Ich brauche ein Wörterbuch.", exampleEnglish: "I need a dictionary.", note: "Like das Buch: die Wörterbücher." },
];

const nounItems: VocabularyItem[] = nouns.map((row) => ({
  id: row.id,
  german: `${row.article} ${row.noun}`,
  english: row.english,
  category: row.category,
  partOfSpeech: "noun",
  article: row.article,
  ...(row.plural ? { plural: `die ${row.plural}` } : { noPlural: true }),
  requireArticle: true,
  ...(row.acceptedEnglish ? { acceptedEnglish: row.acceptedEnglish } : {}),
  ...(row.acceptedGerman ? { acceptedGerman: row.acceptedGerman } : {}),
  exampleGerman: row.exampleGerman,
  exampleEnglish: row.exampleEnglish,
  ...(row.note ? { note: row.note } : {}),
}));

const verb = (
  id: string,
  english: string,
  exampleGerman: string,
  exampleEnglish: string,
  extra: Partial<VocabularyItem> = {},
): VocabularyItem => ({
  id,
  german: id,
  english,
  category: "actions",
  partOfSpeech: "verb",
  exampleGerman,
  exampleEnglish,
  ...extra,
});

const verbItems: VocabularyItem[] = [
  verb("sehen", "to see", "Ich sehe den Lehrer.", "I see the teacher.", { acceptedEnglish: ["to watch"], note: "Vowel change: du siehst, er/sie/es sieht." }),
  verb("nehmen", "to take", "Ich nehme einen Apfel.", "I'll take an apple.", { note: "Vowel change: du nimmst, er/sie/es nimmt (also the m doubles)." }),
  verb("treffen", "to meet", "Ich treffe einen Freund.", "I am meeting a friend.", { note: "Vowel change: du triffst, er/sie/es trifft." }),
  verb("tragen", "to wear / to carry", "Ich trage eine Jacke.", "I am wearing a jacket.", { note: "Vowel change: du trägst, er/sie/es trägt." }),
  verb("fahren", "to drive / to travel", "Ich fahre Fahrrad.", "I ride a bike.", { acceptedEnglish: ["to ride", "to go by vehicle"], note: "Vowel change: du fährst, er/sie/es fährt. Used for going by car, bus, bike or train." }),
  verb("kaufen", "to buy", "Ich kaufe ein Brot.", "I am buying a loaf of bread.", { acceptedEnglish: ["to purchase"] }),
  verb("suchen", "to look for", "Ich suche den Schlüssel.", "I am looking for the key.", { acceptedEnglish: ["to search", "to search for", "to seek"], note: "No extra word for “for”: suchen takes a direct object." }),
  verb("brauchen", "to need", "Ich brauche einen Stift.", "I need a pen."),
  verb("finden", "to find", "Ich finde den Schlüssel.", "I find the key.", { note: "Extra e like arbeiten: du findest, er/sie/es findet. Also: Ich finde Physik interessant = I find physics interesting." }),
  verb("machen", "to do / to make", "Was machst du heute?", "What are you doing today?"),
  verb("kennen", "to know", "Ich kenne den Mann.", "I know the man.", { note: "kennen = to know a person or a place." }),
  verb("besuchen", "to visit", "Ich besuche einen Freund.", "I am visiting a friend."),
  verb("fragen", "to ask", "Der Lehrer fragt den Schüler.", "The teacher asks the pupil."),
  verb("verstehen", "to understand", "Ich verstehe das nicht.", "I don't understand that."),
  verb("putzen", "to clean", "Ich putze das Zimmer.", "I am cleaning the room.", { note: "du putzt: the stem already ends in z, so only -t is added." }),
  verb("benutzen", "to use", "Ich benutze den Computer.", "I am using the computer.", { note: "du benutzt: the stem already ends in z, so only -t is added." }),
];

const adjective = (
  id: string,
  german: string,
  english: string,
  exampleGerman: string,
  exampleEnglish: string,
  extra: Partial<VocabularyItem> = {},
): VocabularyItem => ({
  id,
  german,
  english,
  category: "descriptions",
  partOfSpeech: "adjective",
  exampleGerman,
  exampleEnglish,
  ...extra,
});

const adjectiveItems: VocabularyItem[] = [
  adjective("lang", "lang", "long", "Die Hose ist lang.", "The trousers are long."),
  adjective("kurz", "kurz", "short", "Die Pause ist kurz.", "The break is short.", { acceptedEnglish: ["brief"] }),
  adjective("muede", "müde", "tired", "Ich bin müde.", "I am tired.", { acceptedEnglish: ["sleepy"] }),
  adjective("krank", "krank", "ill / sick", "Der Lehrer ist krank.", "The teacher is ill."),
  adjective("wichtig", "wichtig", "important", "Die Prüfung ist wichtig.", "The exam is important."),
  adjective("langweilig", "langweilig", "boring", "Das Buch ist langweilig.", "The book is boring.", { acceptedEnglish: ["dull"] }),
  adjective("richtig", "richtig", "correct / right", "Die Antwort ist richtig.", "The answer is correct.", { acceptedEnglish: ["true"] }),
  adjective("falsch", "falsch", "wrong / false", "Das ist falsch.", "That is wrong.", { acceptedEnglish: ["incorrect"] }),
  adjective("warm", "warm", "warm", "Der Tee ist warm.", "The tea is warm.", { category: "clothes" }),
  adjective("kalt", "kalt", "cold", "Das Wasser ist kalt.", "The water is cold.", { category: "clothes" }),
  adjective("teuer", "teuer", "expensive", "Das Handy ist teuer.", "The mobile phone is expensive.", { category: "clothes", acceptedEnglish: ["dear", "pricey"] }),
  adjective("billig", "billig", "cheap", "Das T-Shirt ist billig.", "The T-shirt is cheap.", { category: "clothes", acceptedEnglish: ["inexpensive"] }),
  adjective("lecker", "lecker", "tasty / delicious", "Der Kuchen ist lecker.", "The cake is tasty.", { category: "meals", acceptedEnglish: ["yummy"] }),
];

const expression = (
  id: string,
  german: string,
  english: string,
  exampleGerman: string,
  exampleEnglish: string,
  extra: Partial<VocabularyItem> = {},
): VocabularyItem => ({
  id,
  german,
  english,
  category: "expressions",
  partOfSpeech: "expression",
  exampleGerman,
  exampleEnglish,
  ...extra,
});

const expressionItems: VocabularyItem[] = [
  expression("ich-habe-hunger", "Ich habe Hunger.", "I am hungry.", "Hast du Hunger? – Ja, ich habe Hunger.", "Are you hungry? – Yes, I am hungry.", { category: "meals", acceptedEnglish: ["I'm hungry", "I have hunger"], note: "German says “I have hunger”: haben + Hunger, with no article." }),
  expression("ich-habe-durst", "Ich habe Durst.", "I am thirsty.", "Ich habe Durst. Ich trinke Wasser.", "I am thirsty. I am drinking water.", { category: "meals", acceptedEnglish: ["I'm thirsty", "I have thirst"], note: "Like Hunger: haben + Durst, with no article." }),
  expression("guten-appetit", "Guten Appetit!", "Enjoy your meal!", "Die Suppe ist warm. Guten Appetit!", "The soup is warm. Enjoy your meal!", { category: "meals", acceptedEnglish: ["enjoy your food", "bon appetit", "bon appétit", "enjoy"] }),
  expression("was-kostet-das", "Was kostet das?", "How much does that cost?", "Was kostet das Brot?", "How much does the bread cost?", { category: "meals", acceptedEnglish: ["How much is that?", "How much is it?", "What does that cost?", "How much does it cost?"], note: "kosten = to cost." }),
  expression("zu-hause", "zu Hause", "at home", "Ich bin heute zu Hause.", "I am at home today.", { category: "home", acceptedEnglish: ["home"], note: "A fixed phrase. Compare nach Hause = (going) home." }),
  expression("wie-bitte", "Wie bitte?", "Pardon? / Sorry?", "Wie bitte? Noch einmal, bitte.", "Pardon? Once more, please.", { acceptedEnglish: ["what", "excuse me", "sorry what", "I beg your pardon"], note: "A polite way to ask someone to repeat something." }),
  expression("noch-einmal", "Noch einmal, bitte.", "Once more, please.", "Noch einmal, bitte. Ich verstehe das nicht.", "Once more, please. I don't understand that.", { acceptedEnglish: ["Again, please.", "One more time, please.", "Once again, please.", "Again please"] }),
  expression("kein-problem", "Kein Problem.", "No problem.", "Danke! – Kein Problem.", "Thanks! – No problem.", { acceptedEnglish: ["No worries.", "No problem at all."] }),
  expression("alles-klar", "Alles klar.", "All right. / OK.", "Alles klar, bis morgen!", "All right, see you tomorrow!", { acceptedEnglish: ["Alright.", "Okay.", "Got it.", "All clear."] }),
  expression("das-stimmt", "Das stimmt.", "That's right.", "Physik ist interessant. – Das stimmt.", "Physics is interesting. – That's right.", { acceptedEnglish: ["That is right.", "That's true.", "That is true.", "True.", "Right."] }),
  expression("bis-morgen", "Bis morgen!", "See you tomorrow!", "Tschüss, bis morgen!", "Bye, see you tomorrow!", { acceptedEnglish: ["Until tomorrow!", "Till tomorrow!"] }),
  expression("gern", "gern", "gladly / like doing", "Ich lese gern.", "I like reading.", { partOfSpeech: "adverb", acceptedEnglish: ["with pleasure", "like to", "willingly"], note: "Put gern after the verb to say you like doing something: Ich spiele gern. Also: gerne." , acceptedGerman: ["gerne"] }),
  expression("sehr", "sehr", "very", "Das ist sehr gut.", "That is very good.", { partOfSpeech: "adverb", category: "descriptions", acceptedEnglish: ["really", "very much"] }),
  expression("auch", "auch", "also / too", "Ich lerne auch Deutsch.", "I am also learning German.", { partOfSpeech: "adverb", acceptedEnglish: ["as well"] }),
  expression("jetzt", "jetzt", "now", "Ich lerne jetzt Deutsch.", "I am learning German now.", { partOfSpeech: "adverb", acceptedEnglish: ["right now"] }),
  expression("hier", "hier", "here", "Der Schlüssel ist hier.", "The key is here.", { partOfSpeech: "adverb" }),
];

export const week4Vocabulary: VocabularyItem[] = [
  ...verbItems,
  ...nounItems,
  ...adjectiveItems,
  ...expressionItems,
];

export const week4VocabularyBatches: VocabularyBatch[] = [
  {
    id: "w4-actions",
    title: "Everyday actions",
    intro:
      "Verbs you use every day. Five of them change their vowel with du and er/sie/es (du siehst, er nimmt). Grammar-010 practises those forms; for now, learn the meaning.",
    itemIds: [
      "sehen", "nehmen", "treffen", "tragen",
      "fahren", "kaufen", "suchen", "brauchen",
    ],
  },
  {
    id: "w4-verbs",
    title: "More useful verbs",
    intro:
      "Regular verbs that work like lernen. Most of them take a direct object: Ich kenne den Mann. Ich putze das Zimmer.",
    itemIds: [
      "finden", "machen", "kennen", "besuchen",
      "fragen", "verstehen", "putzen", "benutzen",
    ],
  },
  {
    id: "w4-meals",
    title: "Meals",
    intro:
      "The three meals of the day and what you eat or drink with them. To say you are hungry, German uses haben: Ich habe Hunger.",
    itemIds: [
      "fruehstueck", "mittagessen", "abendessen", "broetchen", "butter",
      "tee", "ich-habe-hunger", "ich-habe-durst", "guten-appetit",
    ],
  },
  {
    id: "w4-food",
    title: "More food",
    intro:
      "More food nouns. Fleisch, Obst and Schokolade are mass nouns with no ordinary plural. You can also say how something tastes and ask what it costs.",
    itemIds: [
      "fleisch", "fisch", "kuchen", "schokolade", "obst",
      "tomate", "salat", "lecker", "was-kostet-das",
    ],
  },
  {
    id: "w4-home",
    title: "Home and daily life",
    intro:
      "Your flat, the things in it and the pets that live there. Nouns ending in -ung are feminine: die Wohnung.",
    itemIds: [
      "wohnung", "kuehlschrank", "fernseher", "bild", "hund",
      "katze", "geld", "zeit", "zu-hause",
    ],
  },
  {
    id: "w4-clothes",
    title: "Clothes and belongings",
    intro:
      "What you wear and what it is like. Some are singular in German but plural in English: eine Hose (trousers), eine Brille (glasses).",
    itemIds: [
      "kleidung", "jacke", "hose", "t-shirt", "schuh",
      "brille", "warm", "kalt", "teuer", "billig",
    ],
  },
  {
    id: "w4-study",
    title: "School and study",
    intro:
      "Words for lessons, homework and exams. Watch the umlaut plurals: das Wort → die Wörter, der Satz → die Sätze, das Fach → die Fächer.",
    itemIds: [
      "hausaufgabe", "klasse", "pruefung", "test", "frage", "antwort",
      "wort", "satz", "fach", "stunde", "pause", "woerterbuch",
    ],
  },
  {
    id: "w4-describe",
    title: "Describing things",
    intro:
      "Adjectives to describe people, things and school. Use them after sein for now: Die Prüfung ist wichtig. Ich bin müde.",
    itemIds: [
      "lang", "kurz", "muede", "krank", "wichtig",
      "langweilig", "richtig", "falsch", "sehr",
    ],
  },
  {
    id: "w4-expressions",
    title: "Useful everyday words",
    intro:
      "Short words and phrases that keep a conversation going. Put gern after the verb to say what you like doing: Ich lese gern.",
    itemIds: [
      "wie-bitte", "noch-einmal", "kein-problem", "alles-klar", "das-stimmt",
      "bis-morgen", "gern", "auch", "jetzt", "hier",
    ],
  },
];
