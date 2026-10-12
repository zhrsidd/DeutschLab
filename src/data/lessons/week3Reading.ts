import type { ReadingPassage } from "./week2Reading";

/*
 * reading-002: two short A1 passages built from Week 1–3 language.
 * Questions with a `concept` map to a reusable word or grammar item (a
 * wrong answer feeds Mistakes and Review); plain comprehension questions
 * about the passage never do.
 */

export const week3ReadingPassages: ReadingPassage[] = [
  {
    id: "rd3-zimmer",
    title: "Monas Zimmer",
    text: "Mona hat ein Zimmer. Das Zimmer ist klein und neu. Es hat ein Fenster und eine Tür. Das Fenster ist groß, und die Tür ist alt. Das Bett ist neu, und der Tisch ist klein. Mona hat einen Stuhl und eine Lampe. Sie hat keinen Computer. Das Zimmer hat auch kein Sofa. Der Schrank ist groß, und das Regal ist nicht neu. Der Spiegel ist schön, und der Boden ist alt. Mona liest ein Buch. Die Bücher sind interessant. Mona isst eine Banane und trinkt Wasser. Mona hat Zeit.",
    questions: [
      {
        id: "rd3-1",
        kind: "mc",
        prompt: "Which of these does Mona's room NOT have?",
        options: ["A computer", "A bed", "A table", "A lamp"],
        answer: "A computer",
        explanation: "“Sie hat keinen Computer.” keinen = no, because Computer is masculine and the direct object.",
        concept: { sourceType: "grammar", sourceId: "neg-c-stift" },
      },
      {
        id: "rd3-2",
        kind: "mc",
        prompt: "Which article goes with Fenster in the text?",
        options: ["der", "die", "das"],
        answer: "das",
        explanation: "“Das Fenster ist groß.” Fenster is neuter: das Fenster.",
        concept: { sourceType: "vocabulary", sourceId: "fenster#article" },
      },
      {
        id: "rd3-3",
        kind: "mc",
        prompt: "In “Mona hat einen Stuhl”, which words are the direct object?",
        options: ["Mona", "hat", "einen Stuhl"],
        answer: "einen Stuhl",
        explanation: "“Mona hat einen Stuhl und eine Lampe.” Mona is the subject. einen Stuhl is what she has: the direct object (ein → einen for a masculine noun).",
        concept: { sourceType: "grammar", sourceId: "acc-c-obj-stift" },
      },
      {
        id: "rd3-4",
        kind: "short",
        prompt: "Was liest Mona? (one word, in German)",
        answer: "Buch",
        language: "german",
        keywords: [["buch"]],
        forbidden: ["bücher", "buecher"],
        explanation: "“Mona liest ein Buch.”",
        concept: { sourceType: "vocabulary", sourceId: "buch" },
      },
    ],
  },
  {
    id: "rd3-rucksack",
    title: "Omars Rucksack",
    text: "Omar ist Schüler. Er hat einen Rucksack, und der Rucksack ist neu. Omar hat zwei Hefte, drei Bücher und einen Stift. Er hat keinen Bleistift und kein Lineal. Die Hefte sind klein. Die Bücher sind nicht neu. Omar hat auch eine Tasche, und die Tasche ist groß. Das Handy ist neu, und die Uhr ist alt. Die Lehrerin heißt Frau Weber. Sie hat einen Computer und ein Handy. Sie hat keine Tasche. Heute lernt Omar Physik. Physik ist nicht schwierig.",
    questions: [
      {
        id: "rd3-5",
        kind: "mc",
        prompt: "How many books does Omar have?",
        options: ["Three", "Two", "Four", "One"],
        answer: "Three",
        explanation: "“Omar hat zwei Hefte, drei Bücher und einen Stift.” drei Bücher = three books.",
      },
      {
        id: "rd3-6",
        kind: "mc",
        prompt: "Which word in the text is the plural of das Heft?",
        options: ["Hefte", "Heft", "Heften", "Hefts"],
        answer: "Hefte",
        explanation: "“zwei Hefte”, “Die Hefte sind klein.” The plural of das Heft is die Hefte.",
        concept: { sourceType: "vocabulary", sourceId: "heft#plural" },
      },
      {
        id: "rd3-7",
        kind: "short",
        prompt: "Does Omar have a pencil? (answer yes or no, in English)",
        answer: "No",
        keywords: [["no", "nein"]],
        forbidden: ["yes", "ja"],
        explanation: "“Er hat keinen Bleistift.” keinen = no (a pencil).",
        concept: { sourceType: "grammar", sourceId: "neg-c-stift" },
      },
      {
        id: "rd3-8",
        kind: "mc",
        prompt: "Complete from the text: Die Lehrerin hat ___ Computer.",
        options: ["ein", "eine", "einen"],
        answer: "einen",
        explanation: "“Sie hat einen Computer und ein Handy.” Computer is masculine and the direct object: einen.",
        concept: { sourceType: "grammar", sourceId: "acc-c-einen-rucksack" },
      },
    ],
  },
];
