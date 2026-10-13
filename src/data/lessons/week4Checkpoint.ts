import type { CourseConcept, CourseQuestion } from "./grammarCourseTypes";
import type {
  ComprehensionQuestion,
  ListeningItem,
  VocabularySlot,
} from "./week1Checkpoint";
import { week4SpeakingChecklist, week4SpeakingCues } from "./week4Speaking";

/*
 * checkpoint-004: the Week 4 mastery checkpoint and the October Foundations
 * assessment. Cumulative (Weeks 1–4) with most weight on Week 4. Fresh
 * questions, not replays of the lessons.
 *
 * Grammar ids trace back to the lesson that teaches the skill:
 * c4-art- (grammar-006), c4-acc- (grammar-007), c4-neg- (grammar-008),
 * c4-pr- (grammar-009), c4-iv- (grammar-010), c4-v2- (grammar-002) and
 * c4-q- (grammar-003).
 */

export const week4VocabularySlots: VocabularySlot[] = [
  { category: "actions", kind: "de-en", pool: ["treffen", "tragen", "suchen", "benutzen", "besuchen", "verstehen"] },
  { category: "meals", kind: "en-de", pool: ["fruehstueck", "abendessen", "fleisch", "kuchen", "obst", "salat"] },
  { category: "study", kind: "article", pool: ["pruefung", "satz", "fach", "antwort", "wort", "pause"] },
  { category: "home", kind: "plural", pool: ["wohnung", "kuehlschrank", "bild", "hund", "katze"] },
  { category: "descriptions", kind: "de-en", pool: ["muede", "wichtig", "langweilig", "falsch", "wie-bitte", "das-stimmt"] },
  { category: "clothes", kind: "typed", pool: ["jacke", "hose", "schuh", "brille", "kleidung"] },
  // Cumulative: Week 3 nouns and Week 1–2 words.
  { category: "furniture", kind: "plural", pool: ["stuhl", "glas", "buch", "schrank", "apfel", "garten"] },
  { category: "activities", kind: "de-en", pool: ["sprechen", "arbeiten", "schwierig", "einfach", "geschwister", "supermarkt"] },
];

const typed = (
  id: string,
  instruction: string,
  prompt: string,
  accepted: string[],
  explanation: string,
  concept?: CourseConcept,
): CourseQuestion => ({ id, kind: "typed", instruction, prompt, accepted, explanation, concept });

const fill = (
  id: string,
  sentence: string,
  hint: string | undefined,
  answer: string,
  explanation: string,
  concept?: CourseConcept,
): CourseQuestion => ({ id, kind: "fill", sentence, hint, accepted: [answer], explanation, concept });

const choice = (
  id: string,
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
  concept?: CourseConcept,
): CourseQuestion => ({ id, kind: "choice", prompt, options, answer, explanation, concept });

const reorder = (
  id: string,
  words: string[],
  accepted: string[],
  explanation: string,
): CourseQuestion => ({ id, kind: "reorder", words, accepted, explanation, concept: "word_order" });

/** Twelve slots, two equivalent questions each; the attempt number picks one. */
export const week4GrammarSlots: CourseQuestion[][] = [
  // 1. noun gender (nominative article)
  [
    choice("c4-art-1a", "___ Wohnung ist klein.", ["Der", "Die", "Das"], "Die", "Nouns ending in -ung are feminine: die Wohnung."),
    choice("c4-art-1b", "___ Wörterbuch ist neu.", ["Der", "Die", "Das"], "Das", "Wörterbuch is neuter, like Buch: das Wörterbuch."),
  ],
  // 2. plurals
  [
    typed("c4-art-2a", "Write the plural, with the article.", "der Satz", ["die Sätze"], "der Satz → die Sätze (umlaut and -e)."),
    typed("c4-art-2b", "Write the plural, with the article.", "das Wort", ["die Wörter"], "das Wort → die Wörter (umlaut and -er)."),
  ],
  // 3. accusative: masculine change
  [
    choice("c4-acc-3a", "Ich nehme ___ Kuchen.", ["der", "den", "das"], "den", "Kuchen is masculine and the direct object: der → den.", "accusative"),
    fill("c4-acc-3b", "Sie kauft ___ Salat.", "(ein)", "einen", "Salat is masculine and the direct object: ein → einen.", "accusative"),
  ],
  // 4. accusative: feminine and neuter stay the same
  [
    choice("c4-acc-4a", "Er sucht ___ Wohnung.", ["den", "die", "das"], "die", "Wohnung is feminine, and feminine articles do not change: die Wohnung.", "accusative"),
    choice("c4-acc-4b", "Wir brauchen ___ Wörterbuch.", ["ein", "einen", "eine"], "ein", "Wörterbuch is neuter, and neuter articles do not change: ein Wörterbuch.", "accusative"),
  ],
  // 5. subject and direct object in a V2 sentence
  [
    choice("c4-acc-5a", "Morgen trifft Lena einen Freund. Which words are the direct object?", ["Morgen", "Lena", "einen Freund"], "einen Freund", "Lena is the subject (it comes straight after the verb). einen Freund is who she meets: the direct object.", "accusative"),
    choice("c4-acc-5b", "Heute sucht der Junge die Katze. Which words are the subject?", ["Heute", "der Junge", "die Katze"], "der Junge", "der Junge does the looking: the subject, in the nominative. die Katze is the direct object.", "accusative"),
  ],
  // 6. accusative pronouns for nouns
  [
    choice("c4-pr-6a", "Kennst du den Mann? – Ja, ich kenne ___.", ["er", "ihn", "sie"], "ihn", "den Mann is a masculine direct object, so the pronoun is ihn.", "pronoun"),
    choice("c4-pr-6b", "Brauchst du das Heft? – Ja, ich brauche ___.", ["es", "ihn", "sie"], "es", "das Heft is neuter, so the pronoun is es.", "pronoun"),
  ],
  // 7. accusative pronouns for people
  [
    fill("c4-pr-7a", "Der Lehrer fragt ___.", "(wir)", "uns", "We are the direct object: wir → uns.", "pronoun"),
    fill("c4-pr-7b", "Ich besuche ___ morgen.", "(ihr)", "euch", "ihr as a direct object becomes euch.", "pronoun"),
  ],
  // 8. irregular verbs: a → ä
  [
    choice("c4-iv-8a", "Du ___ eine Brille. (tragen)", ["tragst", "trägst", "trägt", "tragt"], "trägst", "tragen adds an umlaut with du: du trägst.", "verb_form"),
    fill("c4-iv-8b", "Er ___ heute Fahrrad.", "(fahren)", "fährt", "fahren adds an umlaut with er/sie/es: er fährt.", "verb_form"),
  ],
  // 9. irregular verbs: e → i
  [
    fill("c4-iv-9a", "Sie ___ den Bleistift.", "(nehmen)", "nimmt", "nehmen → sie nimmt (the vowel changes and the m doubles).", "verb_form"),
    fill("c4-iv-9b", "___ du Lena heute?", "(treffen)", "Triffst", "A yes/no question starts with the verb. treffen → du triffst.", "verb_form"),
  ],
  // 10. nicht vs kein
  [
    choice("c4-neg-10a", "Ich habe ___ Zeit.", ["nicht", "kein", "keine"], "keine", "Zeit is a feminine noun, so use keine: Ich habe keine Zeit.", "negation"),
    choice("c4-neg-10b", "Die Prüfung ist ___ schwierig.", ["nicht", "kein", "keine"], "nicht", "schwierig is an adjective, so use nicht.", "negation"),
  ],
  // 11. word order
  [
    reorder("c4-v2-11a", ["Heute", "trägt", "Sara", "eine", "Jacke"], ["Heute trägt Sara eine Jacke.", "Sara trägt heute eine Jacke.", "Eine Jacke trägt Sara heute."], "The verb is in position 2. After Heute comes the verb, then the subject: Heute trägt Sara eine Jacke."),
    reorder("c4-q-11b", ["Nimmst", "du", "den", "Rucksack"], ["Nimmst du den Rucksack?"], "A yes/no question starts with the verb: Nimmst du den Rucksack?"),
  ],
  // 12. production: irregular verb + direct object
  [
    typed("c4-iv-12a", "Write this in German.", "He sees us.", ["Er sieht uns."], "sehen → er sieht, and us as a direct object is uns.", "verb_form"),
    typed("c4-iv-12b", "Write this in German.", "She is taking an apple.", ["Sie nimmt einen Apfel."], "nehmen → sie nimmt, and Apfel is masculine: einen Apfel.", "verb_form"),
  ],
];

export const checkpoint4ReadingText =
  "Herr Weber ist Lehrer. Heute ist Freitag, und er fährt Fahrrad. Er trägt eine Jacke und eine Brille. In der Schule trifft er die Klasse. Die Schüler haben heute einen Test. Ein Schüler heißt Ben. Ben hat keinen Bleistift. Herr Weber hat einen Bleistift, und Ben nimmt ihn. Der Test ist nicht lang, und die Fragen sind einfach. Mia versteht eine Frage nicht. Sie fragt: „Wie bitte?“ Herr Weber liest die Frage noch einmal. Die Pause ist kurz. Herr Weber isst ein Brötchen und trinkt Kaffee. Er ist müde, und er hat keine Zeit.";

export const checkpoint4ReadingQuestions: ComprehensionQuestion[] = [
  {
    id: "c4-r-1",
    kind: "mc",
    prompt: "What is Herr Weber wearing?",
    options: [
      "A jacket and glasses",
      "A jacket and a T-shirt",
      "Glasses and new shoes",
      "Only a jacket",
    ],
    answer: "A jacket and glasses",
    explanation: "“Er trägt eine Jacke und eine Brille.” die Brille = glasses.",
  },
  {
    id: "c4-r-2",
    kind: "mc",
    prompt: "In “Ben nimmt ihn”, what does ihn refer to?",
    options: ["The pencil", "The test", "Herr Weber", "The bread roll"],
    answer: "The pencil",
    explanation: "“Herr Weber hat einen Bleistift, und Ben nimmt ihn.” Bleistift is masculine, so the pronoun is ihn.",
  },
  {
    id: "c4-r-3",
    kind: "short",
    prompt: "At the start, does Ben have a pencil? (answer yes or no, in English)",
    answer: "No",
    keywords: [["no", "nein"]],
    forbidden: ["yes", "ja"],
    explanation: "“Ben hat keinen Bleistift.” keinen = no (pencil).",
  },
  {
    id: "c4-r-4",
    kind: "mc",
    prompt: "Why does Mia say “Wie bitte?”",
    options: [
      "She does not understand a question",
      "She has no pencil",
      "She is tired",
      "The test is long",
    ],
    answer: "She does not understand a question",
    explanation: "“Mia versteht eine Frage nicht. Sie fragt: „Wie bitte?“” Herr Weber then reads the question again.",
  },
];

export const checkpoint4ListeningItems: ListeningItem[] = [
  {
    id: "c4-l-plan",
    audio: "Was machst du heute? – Ich treffe Omar. Wir fahren Fahrrad.",
    translation: "What are you doing today? – I'm meeting Omar. We're riding bikes.",
    questions: [
      {
        id: "c4-l-1",
        kind: "mc",
        prompt: "What are the speaker and Omar doing today?",
        options: ["Riding bikes", "Cooking dinner", "Doing homework", "Visiting a teacher"],
        answer: "Riding bikes",
        explanation: "“Ich treffe Omar. Wir fahren Fahrrad.”",
      },
    ],
  },
  {
    id: "c4-l-dog",
    audio: "Siehst du den Hund? – Nein, ich sehe ihn nicht. Er ist nicht hier.",
    translation: "Do you see the dog? – No, I don't see it. It's not here.",
    questions: [
      {
        id: "c4-l-2",
        kind: "mc",
        prompt: "What does the second speaker say about the dog?",
        options: [
          "They cannot see it; it is not here",
          "It is here and sleeping",
          "It is in the kitchen",
          "They see it",
        ],
        answer: "They cannot see it; it is not here",
        explanation: "“Nein, ich sehe ihn nicht. Er ist nicht hier.” ihn = den Hund.",
      },
    ],
  },
  {
    id: "c4-l-food",
    audio: "Ich habe Hunger. Ich nehme eine Suppe und einen Salat. Was nimmst du? – Ich nehme den Fisch.",
    translation: "I'm hungry. I'll have a soup and a salad. What are you having? – I'll have the fish.",
    questions: [
      {
        id: "c4-l-3",
        kind: "mc",
        prompt: "What does the first speaker order?",
        options: ["A soup and a salad", "A soup and the fish", "The fish and a salad", "Only a salad"],
        answer: "A soup and a salad",
        explanation: "“Ich nehme eine Suppe und einen Salat.”",
      },
      {
        id: "c4-l-4",
        kind: "mc",
        prompt: "What does the second speaker take?",
        options: ["The fish", "The soup", "A salad", "A cake"],
        answer: "The fish",
        explanation: "“Was nimmst du? – Ich nehme den Fisch.”",
      },
    ],
  },
];

/** checkpoint-004 speaking: the same honest self-check as speaking-002. */
export const checkpoint4Speaking = {
  heading: "Introduce yourself and your daily life.",
  instructions:
    "Speak out loud for 2–3 minutes. Use the timer and the cues, but no script.",
  seconds: 180,
  cues: week4SpeakingCues,
  checklist: week4SpeakingChecklist,
};
