import { useCallback, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import type { SvaraaId } from './data/svaraas';
import { Hero } from './components/landing/Hero';
import { MeetTheTeam } from './components/landing/MeetTheTeam';
import { TrustStrip } from './components/landing/TrustStrip';
import { WhySvaraa } from './components/landing/WhySvaraa';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { ProductExplorer } from './components/product/ProductExplorer';
import { SvaraasSection } from './components/svaraas/SvaraasSection';

export function App() {
  const [heroSvaraa, setHeroSvaraa] = useState<SvaraaId>('recite');
  const [demoSvaraa, setDemoSvaraa] = useState<SvaraaId>('recite');

  // The hero link is an anchor to #svaraas, so the browser handles the scroll.
  const openDemo = useCallback((id: SvaraaId) => setDemoSvaraa(id), []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="ambient pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <div id="top" className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero selected={heroSvaraa} onSelect={setHeroSvaraa} onOpenDemo={openDemo} />
          <SvaraasSection selected={demoSvaraa} onSelect={setDemoSvaraa} />
          <WhySvaraa />
          <ProductExplorer />
          <MeetTheTeam />
          <TrustStrip />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
