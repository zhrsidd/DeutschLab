import type { CourseQuestion } from "./grammarCourseTypes";
import type {
  ComprehensionQuestion,
  ListeningItem,
  VocabularySlot,
} from "./week1Checkpoint";

/*
 * checkpoint-003 content. Fresh questions (not replays of the lessons).
 * Grammar ids use the prefixes c3-art-, c3-acc- and c3-neg- so a missed
 * question traces back to articles/plurals, the accusative or negation.
 */

export const week3VocabularySlots: VocabularySlot[] = [
  { category: "school", kind: "de-en", pool: ["heft", "lineal", "tafel", "bildschirm", "tastatur", "schere"] },
  { category: "furniture", kind: "en-de", pool: ["bett", "regal", "spiegel", "sofa", "schrank"] },
  { category: "rooms", kind: "article", pool: ["kueche", "tuer", "wand", "boden", "garten", "zimmer"] },
  { category: "food", kind: "article", pool: ["brot", "apfel", "suppe", "kartoffel", "banane", "ei"] },
  { category: "objects", kind: "plural", pool: ["glas", "messer", "flasche", "tasse", "loeffel", "uhr"] },
  { category: "people", kind: "plural", pool: ["mann", "frau", "junge", "lehrerin", "schueler"] },
  { category: "objects", kind: "typed", pool: ["teller", "gabel", "schluessel", "handy", "fahrrad"] },
  { category: "food", kind: "de-en", pool: ["milch", "kaese", "reis", "saft", "wasser", "kaffee"] },
];

const typed = (
  id: string,
  instruction: string,
  prompt: string,
  accepted: string[],
  explanation: string,
  concept?: "accusative" | "negation",
): CourseQuestion => ({ id, kind: "typed", instruction, prompt, accepted, explanation, concept });

const fill = (
  id: string,
  sentence: string,
  hint: string | undefined,
  answer: string,
  explanation: string,
  concept?: "accusative" | "negation",
): CourseQuestion => ({ id, kind: "fill", sentence, hint, accepted: [answer], explanation, concept });

const choice = (
  id: string,
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
  concept?: "accusative" | "negation",
): CourseQuestion => ({ id, kind: "choice", prompt, options, answer, explanation, concept });

/** Ten slots, two equivalent questions each; the attempt number picks one. */
export const week3GrammarSlots: CourseQuestion[][] = [
  // 1. noun gender
  [
    choice("c3-art-1a", "What is the grammatical gender of der Schrank?", ["masculine", "feminine", "neuter"], "masculine", "der goes with masculine nouns: der Schrank."),
    choice("c3-art-1b", "What is the grammatical gender of die Tür?", ["masculine", "feminine", "neuter"], "feminine", "die goes with feminine nouns: die Tür."),
  ],
  // 2. nominative definite article
  [
    fill("c3-art-2a", "___ Bett ist groß.", undefined, "Das", "Bett is neuter: Das Bett ist groß."),
    fill("c3-art-2b", "___ Küche ist neu.", undefined, "Die", "Küche is feminine: Die Küche ist neu."),
  ],
  // 3. indefinite article
  [
    choice("c3-art-3a", "Das ist ___ Sofa.", ["ein", "eine"], "ein", "Sofa is neuter: ein Sofa."),
    choice("c3-art-3b", "Das ist ___ Tür.", ["ein", "eine"], "eine", "Tür is feminine: eine Tür."),
  ],
  // 4. plurals
  [
    typed("c3-art-4a", "Write the plural, with the article.", "die Lampe", ["die Lampen"], "die Lampe → die Lampen."),
    typed("c3-art-4b", "Write the plural, with the article.", "das Glas", ["die Gläser"], "das Glas → die Gläser (umlaut and -er)."),
  ],
  // 5. accusative: masculine change
  [
    choice("c3-acc-5a", "Ich habe ___ Schrank.", ["der", "den", "die", "das"], "den", "Schrank is masculine and the direct object: den Schrank.", "accusative"),
    fill("c3-acc-5b", "Ich habe ___ Computer.", "(ein)", "einen", "Masculine direct object: ein → einen.", "accusative"),
  ],
  // 6. subject vs direct object
  [
    choice("c3-acc-6a", "Die Schülerin liest das Heft. Which words are the subject?", ["Die Schülerin", "liest", "das Heft"], "Die Schülerin", "Die Schülerin does the reading: the subject.", "accusative"),
    choice("c3-acc-6b", "Ich habe einen Rucksack. Which words are the direct object?", ["Ich", "habe", "einen Rucksack"], "einen Rucksack", "einen Rucksack is what I have: the direct object.", "accusative"),
  ],
  // 7. kein, keine, keinen
  [
    choice("c3-neg-7a", "Sie hat ___ Schere.", ["kein", "keine", "keinen"], "keine", "Schere is feminine: keine Schere.", "negation"),
    choice("c3-neg-7b", "Er hat ___ Tisch.", ["kein", "keine", "keinen"], "keinen", "Tisch is masculine and the direct object: keinen Tisch.", "negation"),
  ],
  // 8. nicht vs kein
  [
    choice("c3-neg-8a", "Das Zimmer ist ___ groß.", ["nicht", "kein", "keine"], "nicht", "groß is an adjective, so use nicht.", "negation"),
    choice("c3-neg-8b", "Das ist ___ Handy.", ["nicht", "kein", "keine"], "kein", "Handy is a neuter noun: kein Handy.", "negation"),
  ],
  // 9. accusative production
  [
    typed("c3-acc-9a", "Write this in German.", "I have the key.", ["Ich habe den Schlüssel."], "Schlüssel is masculine: den Schlüssel.", "accusative"),
    typed("c3-acc-9b", "Write this in German.", "I have a table.", ["Ich habe einen Tisch."], "Tisch is masculine: einen Tisch.", "accusative"),
  ],
  // 10. negation production
  [
    typed("c3-neg-10a", "Make the sentence negative.", "Ich habe einen Computer.", ["Ich habe keinen Computer."], "einen Computer → keinen Computer.", "negation"),
    typed("c3-neg-10b", "Make the sentence negative.", "Das ist eine Lampe.", ["Das ist keine Lampe."], "eine Lampe → keine Lampe.", "negation"),
  ],
];

export const checkpoint3ReadingText =
  "Leila hat ein Zimmer. Das Zimmer ist groß und schön. Es hat ein Bett, einen Schrank und ein Regal. Der Tisch ist alt, und die Lampe ist neu. Leila hat einen Computer und ein Handy. Sie hat kein Sofa. Das Fenster ist nicht klein. Leila liest ein Buch. Die Bücher sind interessant. Heute isst Leila eine Banane und trinkt Wasser.";

export const checkpoint3ReadingQuestions: ComprehensionQuestion[] = [
  {
    id: "c3-r-1",
    kind: "mc",
    prompt: "Which furniture does Leila have?",
    options: [
      "A bed, a wardrobe and a shelf",
      "A bed, a sofa and a shelf",
      "A table, a sofa and a wardrobe",
      "A bed and a sofa",
    ],
    answer: "A bed, a wardrobe and a shelf",
    explanation: "“Es hat ein Bett, einen Schrank und ein Regal.”",
  },
  {
    id: "c3-r-2",
    kind: "mc",
    prompt: "True or false: Leila has a sofa.",
    options: ["True", "False"],
    answer: "False",
    explanation: "“Sie hat kein Sofa.” kein = no (a sofa).",
  },
  {
    id: "c3-r-3",
    kind: "short",
    prompt: "Wie ist die Lampe? (one word, in German)",
    answer: "neu",
    language: "german",
    keywords: [["neu"]],
    forbidden: ["alt"],
    explanation: "“Der Tisch ist alt, und die Lampe ist neu.”",
  },
  {
    id: "c3-r-4",
    kind: "mc",
    prompt: "In “Leila hat einen Computer”, which words are the direct object?",
    options: ["Leila", "hat", "einen Computer"],
    answer: "einen Computer",
    explanation: "Leila is the subject; einen Computer is what she has: the direct object.",
  },
];

export const checkpoint3ListeningItems: ListeningItem[] = [
  {
    id: "c3-l-objects",
    audio: "Das Handy ist neu. Der Schlüssel ist klein. Die Uhr ist alt.",
    translation: "The mobile phone is new. The key is small. The clock is old.",
    questions: [
      {
        id: "c3-l-1",
        kind: "mc",
        prompt: "Which object is old?",
        options: ["The clock", "The mobile phone", "The key", "The lamp"],
        answer: "The clock",
        explanation: "“Die Uhr ist alt.” alt = old.",
      },
      {
        id: "c3-l-2",
        kind: "mc",
        prompt: "Which object is small?",
        options: ["The key", "The clock", "The mobile phone", "The bag"],
        answer: "The key",
        explanation: "“Der Schlüssel ist klein.” klein = small.",
      },
    ],
  },
  {
    id: "c3-l-possession",
    audio: "Ich habe einen Stuhl und eine Lampe. Ich habe keinen Tisch.",
    translation: "I have a chair and a lamp. I do not have a table.",
    questions: [
      {
        id: "c3-l-3",
        kind: "mc",
        prompt: "What does the speaker NOT have?",
        options: ["A table", "A chair", "A lamp", "A bed"],
        answer: "A table",
        explanation: "“Ich habe keinen Tisch.” keinen = no, because Tisch is masculine and the direct object.",
      },
    ],
  },
  {
    id: "c3-l-plural",
    audio: "Die Tassen sind groß.",
    translation: "The cups are big.",
    questions: [
      {
        id: "c3-l-4",
        kind: "mc",
        prompt: "Which sentence did you hear?",
        options: [
          "Die Tassen sind groß.",
          "Die Tasse ist groß.",
          "Die Gläser sind groß.",
          "Das Glas ist groß.",
        ],
        answer: "Die Tassen sind groß.",
        explanation: "Die Tassen sind = plural (the cups are). Die Tasse ist = singular.",
      },
    ],
  },
];
