import { useCallback, useEffect, useState } from "react";
export function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
export function useSpeech(enabled: boolean) {
  const [notice, setNotice] = useState("");
  const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>();
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synthesis = window.speechSynthesis;
    const update = () =>
      setVoice(
        synthesis
          .getVoices()
          .find((v) => v.lang.toLowerCase().startsWith("id")),
      );
    update();
    synthesis.addEventListener("voiceschanged", update);
    return () => {
      stopSpeech();
      synthesis.removeEventListener("voiceschanged", update);
    };
  }, []);
  useEffect(() => {
    if (!enabled) stopSpeech();
  }, [enabled]);
  const speak = useCallback(
    (text: string) => {
      stopSpeech();
      if (!enabled) {
        setNotice("Suara sedang dimatikan. Teks tetap bisa dibaca bersama.");
        return;
      }
      if (!("speechSynthesis" in window)) {
        setNotice(
          "Browser ini belum mendukung suara. Yuk, baca teks bersama pendamping.",
        );
        return;
      }
      if (!voice) {
        setNotice(
          "Suara bahasa Indonesia belum tersedia di perangkat ini. Teks dan gambar tetap bisa digunakan.",
        );
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.voice = voice;
      utterance.rate = 0.85;
      utterance.onerror = () =>
        setNotice("Suara belum dapat diputar. Teks tetap tersedia.");
      setNotice("");
      window.speechSynthesis.speak(utterance);
    },
    [enabled, voice],
  );
  return { speak, notice };
}
