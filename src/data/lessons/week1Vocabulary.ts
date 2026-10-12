export interface VocabularyItem {
  id: string;
  german: string;
  english: string;
  exampleGerman: string;
  exampleEnglish: string;
  note?: string;
}

export const week1Vocabulary: VocabularyItem[] = [
  {
    id: "hallo",
    german: "Hallo",
    english: "Hello",
    exampleGerman: "Hallo! Ich heiße Zuhayr.",
    exampleEnglish: "Hello! My name is Zuhayr.",
  },
  {
    id: "guten-morgen",
    german: "Guten Morgen",
    english: "Good morning",
    exampleGerman: "Guten Morgen! Wie geht es dir?",
    exampleEnglish: "Good morning! How are you?",
  },
  {
    id: "guten-tag",
    german: "Guten Tag",
    english: "Good day / Hello",
    exampleGerman: "Guten Tag, Herr Müller.",
    exampleEnglish: "Good day, Mr Müller.",
    note: "A more formal daytime greeting.",
  },
  {
    id: "guten-abend",
    german: "Guten Abend",
    english: "Good evening",
    exampleGerman: "Guten Abend! Wie geht es Ihnen?",
    exampleEnglish: "Good evening! How are you?",
  },
  {
    id: "tschuss",
    german: "Tschüss",
    english: "Bye",
    exampleGerman: "Tschüss! Bis morgen.",
    exampleEnglish: "Bye! See you tomorrow.",
  },
  {
    id: "auf-wiedersehen",
    german: "Auf Wiedersehen",
    english: "Goodbye",
    exampleGerman: "Auf Wiedersehen, Frau Schmidt.",
    exampleEnglish: "Goodbye, Ms Schmidt.",
    note: "More formal than Tschüss.",
  },
  {
    id: "danke",
    german: "Danke",
    english: "Thank you",
    exampleGerman: "Danke für deine Hilfe.",
    exampleEnglish: "Thank you for your help.",
  },
  {
    id: "bitte",
    german: "Bitte",
    english: "Please / You're welcome",
    exampleGerman: "Ein Wasser, bitte.",
    exampleEnglish: "A water, please.",
    note: "Bitte can mean both “please” and “you're welcome”.",
  },
  {
    id: "ja",
    german: "Ja",
    english: "Yes",
    exampleGerman: "Ja, ich lerne Deutsch.",
    exampleEnglish: "Yes, I am learning German.",
  },
  {
    id: "nein",
    german: "Nein",
    english: "No",
    exampleGerman: "Nein, ich spreche noch nicht gut Deutsch.",
    exampleEnglish: "No, I don't speak German well yet.",
  },
];