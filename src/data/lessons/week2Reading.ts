import type { ComprehensionQuestion } from "./week1Checkpoint";

/*
 * reading-001: two short A1 passages built from Week 1 + Week 2 language.
 * Questions with a `concept` map to a reusable word; the rest are plain
 * comprehension and never create Review items.
 */

export interface ReadingPassage {
  id: string;
  title: string;
  text: string;
  questions: ComprehensionQuestion[];
}

export const readingPassages: ReadingPassage[] = [
  {
    id: "rd-mona",
    title: "Mona's day",
    text: "Hallo! Ich heiße Mona. Ich bin Schülerin, und ich wohne in Doha. Die Familie ist groß. Ich habe zwei Brüder. Die Brüder heißen Omar und Sami. Der Vater arbeitet in der Stadt. Die Mutter ist Lehrerin. Sie arbeitet in der Schule. Die Großeltern wohnen in Indien. Heute ist Dienstag. Heute esse ich in der Schule. Die Schule ist groß, und das Haus ist neu. Heute lerne ich Deutsch und Englisch. Physik ist interessant, und Mathematik ist schwierig.",
    questions: [
      {
        id: "rd-1",
        kind: "mc",
        prompt: "What is Mona's mother's job?",
        options: ["Teacher", "Student", "Doctor", "Engineer"],
        answer: "Teacher",
        explanation: "“Die Mutter ist Lehrerin.” Lehrerin = (female) teacher.",
      },
      {
        id: "rd-2",
        kind: "mc",
        prompt: "True or false: Mona has two brothers.",
        options: ["True", "False"],
        answer: "True",
        explanation: "“Ich habe zwei Brüder.”",
      },
      {
        id: "rd-3",
        kind: "short",
        prompt: "Where do Mona's grandparents live? (answer in English)",
        answer: "India",
        keywords: [["india", "indien"]],
        forbidden: ["doha", "pakistan"],
        explanation: "“Die Großeltern wohnen in Indien.”",
      },
      {
        id: "rd-4",
        kind: "short",
        prompt: "Welches Fach ist interessant? (one word, in German)",
        answer: "Physik",
        language: "german",
        keywords: [["physik"]],
        forbidden: ["mathematik"],
        explanation: "“Physik ist interessant, und Mathematik ist schwierig.”",
        concept: { sourceType: "vocabulary", sourceId: "physik" },
      },
    ],
  },
  {
    id: "rd-jonas",
    title: "Jonas and Paul",
    text: "Guten Tag! Ich heiße Jonas. Ich komme aus Österreich, und ich wohne in Zürich. Die Stadt ist schön. Heute ist Samstag. Heute schlafe ich. Ich trinke Wasser, und ich esse. Morgen ist Sonntag. Morgen spiele ich Fußball. Der Park ist groß. Der Freund heißt Paul. Er wohnt auch in Zürich. Paul spricht Deutsch und Französisch. Er hat Zeit. Paul liest ein Buch, und Jonas hört Musik. Der Supermarkt ist neu, und das Restaurant ist gut. Wir sprechen Deutsch.",
    questions: [
      {
        id: "rd-5",
        kind: "mc",
        prompt: "Where does Jonas live?",
        options: ["Zurich", "Austria", "Doha", "Berlin"],
        answer: "Zurich",
        explanation: "“Ich komme aus Österreich, und ich wohne in Zürich.” He comes from Austria but lives in Zurich.",
      },
      {
        id: "rd-6",
        kind: "mc",
        prompt: "True or false: Jonas plays football today.",
        options: ["True", "False"],
        answer: "False",
        explanation: "He sleeps today (“Heute schlafe ich”) and plays football tomorrow (“Morgen spiele ich Fußball”).",
      },
      {
        id: "rd-7",
        kind: "short",
        prompt: "Which two languages does Paul speak? (answer in English)",
        answer: "German and French",
        keywords: [["german", "deutsch"], ["french", "französisch", "franzoesisch"]],
        forbidden: ["english", "arabic", "spanish"],
        explanation: "“Paul spricht Deutsch und Französisch.”",
      },
      {
        id: "rd-8",
        kind: "mc",
        prompt: "Who is Paul?",
        options: ["Jonas's friend", "Jonas's brother", "Jonas's father", "Jonas's teacher"],
        answer: "Jonas's friend",
        explanation: "“Der Freund heißt Paul.” Freund = friend.",
        concept: { sourceType: "vocabulary", sourceId: "freund" },
      },
    ],
  },
];

export const readingQuestionsAll: ComprehensionQuestion[] =
  readingPassages.flatMap((passage) => passage.questions);
