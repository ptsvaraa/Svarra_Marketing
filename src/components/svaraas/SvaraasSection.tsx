import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SVARAAS, type LanguageCode, type SvaraaId } from '../../data/svaraas';
import { SvaraaPanel } from './SvaraaPanel';
import { SvaraaTabs, tabId } from './SvaraaTabs';

const EASE = [0.22, 1, 0.36, 1] as const;
const TAB_PREFIX = 'svaraa';
const PANEL_ID = 'svaraa-tabpanel';

interface SvaraasSectionProps {
  /** Controlled, so other parts of the page (the hero) can open a specific demo. */
  selected: SvaraaId;
  onSelect: (id: SvaraaId) => void;
}

/** "The 7 Svaraas": a tabbed live demo of each capability; each one plays when the visitor presses Start. */
export function SvaraasSection({ selected, onSelect }: SvaraasSectionProps) {
  // Preferences persist across tabs, so they live here rather than in each panel.
  const [audioOn, setAudioOn] = useState(true);
  const [language, setLanguage] = useState<LanguageCode>('hi-IN');

  const svaraa = SVARAAS.find((s) => s.id === selected) ?? SVARAAS[0]!;

  return (
    <section id="svaraas" aria-labelledby="svaraas-title" className="scroll-mt-6 py-16 sm:py-24">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-10">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-medium tracking-[0.3em] text-gold uppercase">Live demo</p>
          <h2 id="svaraas-title" className="mt-2 font-serif text-2xl text-heading sm:text-3xl">
            The 7 Svaraas
          </h2>
        </div>

        {/* Pinned just below the sticky navbar on phones. */}
        <div className="sticky top-[4.5rem] z-20 mb-10 sm:static">
          <div className="mx-auto w-fit max-w-full rounded-2xl px-1 py-0.5 max-sm:glass">
            <SvaraaTabs
              items={SVARAAS}
              selected={selected}
              onSelect={onSelect}
              idPrefix={TAB_PREFIX}
              panelId={PANEL_ID}
              label="The 7 Svaraas"
            />
          </div>
        </div>

        <div id={PANEL_ID} role="tabpanel" aria-labelledby={tabId(TAB_PREFIX, selected)}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={svaraa.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.18, ease: 'easeIn' } }}
            >
              <SvaraaPanel
                svaraa={svaraa}
                audioOn={audioOn}
                onAudioChange={setAudioOn}
                language={language}
                onLanguageChange={setLanguage}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
