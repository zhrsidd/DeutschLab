import { useEffect, useState } from "react";

/*
 * Speech synthesis helper. Uses a German voice when one is installed;
 * reports unavailability instead of throwing.
 */
export function useGermanSpeech() {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicesChecked, setVoicesChecked] = useState(!supported);

  useEffect(() => {
    if (!supported) return;

    const synth = window.speechSynthesis;

    const load = () => {
      const voices = synth.getVoices();
      if (voices.length === 0) return;

      setVoice(
        voices.find((v) => v.lang.toLowerCase() === "de-de") ??
          voices.find((v) => v.lang.toLowerCase().startsWith("de")) ??
          null,
      );
      setVoicesChecked(true);
    };

    load();
    synth.addEventListener("voiceschanged", load);

    // Some webviews never report voices; stop waiting after a moment.
    const timer = window.setTimeout(() => setVoicesChecked(true), 1500);

    return () => {
      synth.removeEventListener("voiceschanged", load);
      window.clearTimeout(timer);
    };
  }, [supported]);

  const available = supported && voice !== null;

  const speak = (text: string, rate = 0.8) => {
    if (!available || !voice) return;

    try {
      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = rate;
      synth.speak(utterance);
    } catch (error) {
      console.error("Speech synthesis failed:", error);
    }
  };

  const stop = () => {
    if (supported) window.speechSynthesis.cancel();
  };

  // Don't keep talking after the lesson screen is left.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { available, checked: voicesChecked, speak, stop };
}
