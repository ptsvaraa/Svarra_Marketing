import { useCallback, useEffect, useRef, useState } from 'react';

const isSupported = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function';

/** Browsers block speech until the visitor has interacted with the page. */
const hasUserActivation = () => navigator.userActivation?.hasBeenActive ?? true;

/**
 * Natural-sounding voices to prefer, best first. Svaraa speaks in the feminine,
 * so female voices lead: for Hindi, Edge's neural "Swara", Chrome's "Google हिन्दी",
 * Windows "Kalpana", Apple "Lekha"; for English, Edge's "Neerja" (Indian English),
 * then Google's voices.
 */
const PREFERRED = [/swara/i, /neerja/i, /google/i, /kalpana/i, /lekha/i];

function pickVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const norm = (l: string) => l.toLowerCase().replace('_', '-');
  const base = norm(lang).slice(0, 2);
  const exact = voices.filter((v) => norm(v.lang) === norm(lang));
  const sameLanguage = voices.filter((v) => norm(v.lang).startsWith(base));
  // Prefer the exact locale (en-IN over en-US), then any voice in the language.
  for (const pool of [exact, sameLanguage]) {
    for (const pattern of PREFERRED) {
      const voice = pool.find((v) => pattern.test(v.name));
      if (voice) return voice;
    }
    if (pool[0]) return pool[0];
  }
  return undefined;
}

/**
 * Thin, failure-tolerant wrapper around the Web Speech synthesis API.
 * `supported` is false when the browser can't speak or has no voice for `lang`,
 * so Hindi lines are never read out by an English voice.
 */
export function useSpeech(enabled: boolean, lang: string) {
  const apiSupported = isSupported();
  const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>();
  // Voices load asynchronously; until the first list arrives, assume one may exist.
  const [loaded, setLoaded] = useState(false);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  useEffect(() => {
    if (!apiSupported) return;
    const synth = window.speechSynthesis;
    const load = () => {
      const voices = synth.getVoices();
      if (!voices.length) return;
      setVoice(pickVoice(voices, lang));
      setLoaded(true);
    };
    load();
    synth.addEventListener('voiceschanged', load);
    return () => {
      synth.removeEventListener('voiceschanged', load);
      synth.cancel();
    };
  }, [apiSupported, lang]);

  const supported = apiSupported && (!loaded || !!voice);

  const cancel = useCallback(() => {
    if (apiSupported) window.speechSynthesis.cancel();
  }, [apiSupported]);

  useEffect(() => {
    if (!enabled) cancel();
  }, [enabled, cancel]);

  const speak = useCallback(
    (text: string) => {
      if (!apiSupported || !enabled || !hasUserActivation()) return;
      const chosen = voiceRef.current;
      if (loaded && !chosen) return;
      // Queue rather than interrupt: Hindi lines can outlast a beat, and cutting
      // them off mid-sentence sounds broken. Pause, reset and tab changes still cancel.
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = chosen?.lang ?? lang;
      utterance.rate = 0.92;
      if (chosen) utterance.voice = chosen;
      synth.speak(utterance);
    },
    [apiSupported, enabled, lang, loaded],
  );

  return { supported, speak, cancel };
}
