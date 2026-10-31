import { useEffect } from 'react';
import { conversationLang, type LanguageCode, type Svaraa } from '../../data/svaraas';
import { useSimulation } from '../../hooks/useSimulation';
import { useSpeech } from '../../hooks/useSpeech';
import { DEMOS } from './demos';
import { LiveDemoFrame } from './LiveDemoFrame';
import { ProgressTracker } from './ProgressTracker';
import { SimulationControls } from './SimulationControls';

interface SvaraaPanelProps {
  svaraa: Svaraa;
  audioOn: boolean;
  onAudioChange: (on: boolean) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

/**
 * One tab's content. It's keyed by tab id, so switching tabs remounts it and
 * the simulation always starts fresh.
 */
export function SvaraaPanel({ svaraa, audioOn, onAudioChange, language, onLanguageChange }: SvaraaPanelProps) {
  const sim = useSimulation(svaraa.beatDurations);
  const { supported, speak, cancel } = useSpeech(audioOn, language);
  const Demo = DEMOS[svaraa.id];

  const lang = conversationLang(language);
  const line = sim.isPlaying ? svaraa.voiceLines[lang][sim.beat] : undefined;
  useEffect(() => {
    if (line) speak(line);
  }, [line, sim.beat, sim.runId, speak]);

  useEffect(() => {
    if (sim.status === 'paused' || sim.status === 'idle') cancel();
  }, [sim.status, cancel]);

  const activeStep = svaraa.trackerByBeat[Math.min(sim.beat, svaraa.trackerByBeat.length - 1)] ?? 0;
  const headingId = `svaraa-heading-${svaraa.id}`;

  return (
    <div className="flex flex-col gap-8 sm:gap-10" aria-labelledby={headingId} role="group">
      <header className="mx-auto max-w-5xl text-center text-balance">
        <h3 id={headingId} className="font-serif text-4xl leading-[1.08] tracking-tight text-heading sm:text-5xl lg:text-6xl">
          {svaraa.headline.lead}
          {svaraa.headline.accent && <em className="text-accent">{svaraa.headline.accent}</em>}
        </h3>
        <p className="mt-3 text-lg text-muted sm:text-xl">{svaraa.subheadline}</p>
      </header>

      <div className="glass rounded-[32px] p-2 sm:p-3">
        <div className="grid gap-2 sm:gap-3 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <SimulationControls
            svaraa={svaraa}
            sim={sim}
            audioOn={audioOn}
            onAudioChange={onAudioChange}
            speechSupported={supported}
            language={language}
            onLanguageChange={onLanguageChange}
          />
          <LiveDemoFrame
            label={svaraa.label}
            status={sim.status}
            headerBadge={svaraa.simulation.headerBadge}
            footnote={svaraa.simulation.footnote}
            tracker={
              <ProgressTracker
                steps={svaraa.steps}
                active={activeStep}
                complete={sim.isComplete}
                live={sim.isPlaying}
              />
            }
          >
            <Demo
              key={sim.runId}
              beat={sim.beat}
              isPlaying={sim.isPlaying}
              isComplete={sim.isComplete}
              goTo={sim.goTo}
              togglePlayback={sim.toggle}
              lang={lang}
            />
          </LiveDemoFrame>
        </div>
      </div>
    </div>
  );
}
