import { useCallback, useEffect, useRef } from 'react';

const isSupported = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function';

/** Browsers block speech until the visitor has interacted with the page. */
const hasUserActivation = () => navigator.userActivation?.hasBeenActive ?? true;

/** Thin, failure-tolerant wrapper around the Web Speech synthesis API. */
export function useSpeech(enabled: boolean, lang: string) {
  const supported = isSupported();
  const voices = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const load = () => {
      voices.current = synth.getVoices();
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => {
      synth.removeEventListener('voiceschanged', load);
      synth.cancel();
    };
  }, [supported]);

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  useEffect(() => {
    if (!enabled) cancel();
  }, [enabled, cancel]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !enabled || !hasUserActivation()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95;
      const voice =
        voices.current.find((v) => v.lang === lang) ??
        voices.current.find((v) => v.lang.startsWith(lang.slice(0, 2)));
      if (voice) utterance.voice = voice;
      synth.speak(utterance);
    },
    [supported, enabled, lang],
  );

  return { supported, speak, cancel };
}
