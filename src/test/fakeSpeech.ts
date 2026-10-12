/*
 * Fake speechSynthesis so tests never depend on a real macOS voice.
 */

export interface FakeVoice {
  name: string;
  lang: string;
}

export interface FakeSpeech {
  spoken: { text: string; rate: number; lang: string }[];
  setVoices: (voices: FakeVoice[]) => void;
}

const GERMAN: FakeVoice = { name: "Test German", lang: "de-DE" };

export function installFakeSpeech(voices: FakeVoice[] = [GERMAN]): FakeSpeech {
  let current = voices;
  const listeners = new Set<() => void>();
  const spoken: FakeSpeech["spoken"] = [];

  class FakeUtterance {
    text: string;
    rate = 1;
    lang = "";
    voice: FakeVoice | null = null;

    constructor(text: string) {
      this.text = text;
    }
  }

  const synth = {
    getVoices: () => current,
    speak: (utterance: FakeUtterance) => {
      spoken.push({
        text: utterance.text,
        rate: utterance.rate,
        lang: utterance.lang,
      });
    },
    cancel: () => {},
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
  };

  Object.defineProperty(window, "speechSynthesis", {
    value: synth,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    value: FakeUtterance,
    configurable: true,
    writable: true,
  });

  const handle: FakeSpeech = {
    spoken,
    setVoices: (next) => {
      current = next;
      listeners.forEach((listener) => listener());
    },
  };

  (window as unknown as { __fakeSpeech: FakeSpeech }).__fakeSpeech = handle;

  return handle;
}

export function getFakeSpeech(): FakeSpeech {
  return (window as unknown as { __fakeSpeech: FakeSpeech }).__fakeSpeech;
}

/** Simulates a machine with no German voice at all. */
export function removeGermanVoices() {
  installFakeSpeech([]);
}
