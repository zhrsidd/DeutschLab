export interface SoundExample {
  german: string;
  english: string;
}

export interface PronunciationSound {
  id: string;
  sound: string;
  title: string;
  explanation: string;
  examples: [SoundExample, SoundExample];
}

export interface PronunciationQuestion {
  id: string;
  prompt: string;
  /** German word shown with a Play button, if any. */
  word?: string;
  options: string[];
  answer: string;
  explanation: string;
}

export const week1Sounds: PronunciationSound[] = [
  {
    id: "ae",
    sound: "ä",
    title: "ä (a-umlaut)",
    explanation:
      "Short ä (Mädchen) is close to the 'e' in 'bed'. Long ä (Käse) is a similar open 'e' held longer, with no 'ay' glide. Many speakers say long ä almost like a long e.",
    examples: [
      { german: "Mädchen", english: "girl" },
      { german: "Käse", english: "cheese" },
    ],
  },
  {
    id: "oe",
    sound: "ö",
    title: "ö (o-umlaut)",
    explanation:
      "Say 'ay' (as in 'say', without the glide), then round your lips as if saying 'oh' while keeping your tongue where it is.",
    examples: [
      { german: "schön", english: "beautiful" },
      { german: "Öl", english: "oil" },
    ],
  },
  {
    id: "ue",
    sound: "ü",
    title: "ü (u-umlaut)",
    explanation:
      "Say 'ee', then round your lips as if saying 'oo' while keeping your tongue forward. It is neither 'ee' nor 'oo'.",
    examples: [
      { german: "über", english: "over, about" },
      { german: "Tür", english: "door" },
    ],
  },
  {
    id: "ch",
    sound: "ch",
    title: "ch (two sounds)",
    explanation:
      "After a, o, u, au it is a rough sound at the back of the throat (Buch, auch). After e, i, ä, ö, ü and after consonants such as l, n, r it is a soft hiss with the tongue raised towards the front of the mouth (ich, Milch).",
    examples: [
      { german: "ich", english: "I" },
      { german: "Buch", english: "book" },
    ],
  },
  {
    id: "sch",
    sound: "sch",
    title: "sch",
    explanation:
      "Always like English 'sh' in 'shoe'. Also at the start of words before p or t: Sport, Stein are said 'Shport', 'Shtein'.",
    examples: [
      { german: "Schule", english: "school" },
      { german: "Tisch", english: "table" },
    ],
  },
  {
    id: "z",
    sound: "z",
    title: "z",
    explanation:
      "Always 'ts' as in 'cats', even at the start of a word. Never like English 'z'.",
    examples: [
      { german: "Zeit", english: "time" },
      { german: "Zimmer", english: "room" },
    ],
  },
  {
    id: "w",
    sound: "w",
    title: "w",
    explanation:
      "Said like English 'v' in 'very'. Never like English 'w'.",
    examples: [
      { german: "Wasser", english: "water" },
      { german: "wir", english: "we" },
    ],
  },
  {
    id: "v",
    sound: "v",
    title: "v",
    explanation:
      "Usually said like English 'f' in German words. (In foreign words like Vase it is 'v'.)",
    examples: [
      { german: "Vater", english: "father" },
      { german: "viel", english: "much, a lot" },
    ],
  },
  {
    id: "ei",
    sound: "ei",
    title: "ei",
    explanation:
      "Like English 'eye' or 'i' in 'mine'. Watch out: it looks like English 'ay' but is not.",
    examples: [
      { german: "mein", english: "my" },
      { german: "Eis", english: "ice cream, ice" },
    ],
  },
  {
    id: "ie",
    sound: "ie",
    title: "ie",
    explanation:
      "A long 'ee' as in 'see'. The e is just a length marker, not a separate sound.",
    examples: [
      { german: "Bier", english: "beer" },
      { german: "sieben", english: "seven" },
    ],
  },
  {
    id: "eu",
    sound: "eu",
    title: "eu",
    explanation:
      "Like English 'oy' in 'boy'. Äu is said the same way.",
    examples: [
      { german: "Euro", english: "euro" },
      { german: "heute", english: "today" },
    ],
  },
];

export const week1PronunciationQuiz: PronunciationQuestion[] = [
  {
    id: "q-ei",
    prompt: "How is ei pronounced in this word?",
    word: "mein",
    options: ["Like 'eye'", "Like 'ee'", "Like 'oy'", "Like 'ay' in 'say'"],
    answer: "Like 'eye'",
    explanation: "ei sounds like English 'eye': mein ≈ 'mine'.",
  },
  {
    id: "q-ie",
    prompt: "How is ie pronounced in this word?",
    word: "Bier",
    options: ["Like 'eye'", "Like 'ee'", "Like 'oy'", "Like 'ih-eh'"],
    answer: "Like 'ee'",
    explanation: "ie is a long 'ee': Bier ≈ 'beer'.",
  },
  {
    id: "q-eu",
    prompt: "How is eu pronounced in this word?",
    word: "Euro",
    options: ["Like 'oy'", "Like 'eye'", "Like 'you'", "Like 'ee'"],
    answer: "Like 'oy'",
    explanation: "eu sounds like English 'oy': Euro ≈ 'OY-ro'.",
  },
  {
    id: "q-w",
    prompt: "How is w pronounced in this word?",
    word: "Wasser",
    options: ["Like English 'v'", "Like English 'w'", "Like English 'f'", "Like English 'b'"],
    answer: "Like English 'v'",
    explanation: "German w is like English 'v': Wasser ≈ 'VAH-ser'.",
  },
  {
    id: "q-v",
    prompt: "How is v pronounced in this word?",
    word: "Vater",
    options: ["Like English 'f'", "Like English 'v'", "Like English 'w'", "Like English 'b'"],
    answer: "Like English 'f'",
    explanation: "German v is usually like 'f': Vater ≈ 'FAH-ter'.",
  },
  {
    id: "q-z",
    prompt: "How is z pronounced in this word?",
    word: "Zeit",
    options: ["Like 'ts'", "Like English 'z'", "Like 's'", "Like 'sh'"],
    answer: "Like 'ts'",
    explanation: "z is always 'ts': Zeit ≈ 'tsite'.",
  },
  {
    id: "q-sch",
    prompt: "How is sch pronounced in this word?",
    word: "Schule",
    options: ["Like 'sh'", "Like 'sk'", "Like 's + ch'", "Like 'ts'"],
    answer: "Like 'sh'",
    explanation: "sch is 'sh': Schule ≈ 'SHOO-leh'.",
  },
  {
    id: "q-ch",
    prompt: "Which word has the rough, back-of-the-throat ch?",
    options: ["ich", "Buch", "Milch", "nicht"],
    answer: "Buch",
    explanation:
      "ch after a, o, u, au is rough (Buch). After i, e, ä, ö, ü and after consonants like l it is soft (ich, Milch, nicht).",
  },
  {
    id: "q-ae",
    prompt: "Which English vowel is closest to the short ä in this word?",
    word: "Mädchen",
    options: ["'e' in 'bed'", "'a' in 'father'", "'o' in 'more'", "'oo' in 'food'"],
    answer: "'e' in 'bed'",
    explanation:
      "Short ä is close to the 'e' in 'bed'. Long ä (Käse) is similar but held longer.",
  },
  {
    id: "q-oe",
    prompt: "Which word contains the ö sound?",
    options: ["schön", "Tür", "Käse", "Bruder"],
    answer: "schön",
    explanation: "schön has ö. Tür has ü, Käse has ä, Bruder has u.",
  },
  {
    id: "q-ue",
    prompt: "What do your lips do when you say ü?",
    word: "Tür",
    options: [
      "Rounded, with the tongue forward as for 'ee'",
      "Wide and flat, as for 'ee'",
      "Rounded, with the tongue back as for 'oo'",
      "Open wide, as for 'ah'",
    ],
    answer: "Rounded, with the tongue forward as for 'ee'",
    explanation:
      "ü = 'ee' tongue position with 'oo' lip rounding.",
  },
];
