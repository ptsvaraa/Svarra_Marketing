import { useCallback, useState, type ComponentType } from 'react';
import { MotionConfig } from 'framer-motion';
import type { SvaraaId } from './data/svaraas';
import { Hero } from './components/landing/Hero';
import { ImpactStats } from './components/landing/ImpactStats';
import { MeetTheTeam } from './components/landing/MeetTheTeam';
import { SvaraaCards } from './components/landing/SvaraaCards';
import { TrustStrip } from './components/landing/TrustStrip';
import { WhySvaraa } from './components/landing/WhySvaraa';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { FoldExplorer } from './components/product/FoldExplorer';
import { SvaraasSection } from './components/svaraas/SvaraasSection';
import { PreorderPage } from './pages/PreorderPage';
import { LEGAL_PATHS } from './legal/company';
import { COOKIE_POLICY } from './legal/cookies';
import { LegalPage } from './legal/LegalPage';
import { PRIVACY_POLICY } from './legal/privacy';
import { TERMS } from './legal/terms';

/** The site's pages, by path. A small lookup is enough here; no router needed. */
const PAGES: Record<string, ComponentType> = {
  '/pre-order': PreorderPage,
  [LEGAL_PATHS.privacy]: () => <LegalPage doc={PRIVACY_POLICY} />,
  [LEGAL_PATHS.terms]: () => <LegalPage doc={TERMS} />,
  [LEGAL_PATHS.cookies]: () => <LegalPage doc={COOKIE_POLICY} />,
};

function HomePage() {
  const [heroSvaraa, setHeroSvaraa] = useState<SvaraaId>('recite');
  const [demoSvaraa, setDemoSvaraa] = useState<SvaraaId>('recite');

  // The hero link is an anchor to #svaraas, so the browser handles the scroll.
  const openDemo = useCallback((id: SvaraaId) => setDemoSvaraa(id), []);

  return (
    <>
      <Hero selected={heroSvaraa} onSelect={setHeroSvaraa} onOpenDemo={openDemo} />
      <SvaraaCards onOpenDemo={openDemo} />
      <SvaraasSection selected={demoSvaraa} onSelect={setDemoSvaraa} />
      <WhySvaraa />
      <FoldExplorer />
      <MeetTheTeam />
      <TrustStrip />
      <ImpactStats />
    </>
  );
}

export function App() {
  const Page = PAGES[window.location.pathname.replace(/\/+$/, '')] ?? HomePage;
  return (
    <MotionConfig reducedMotion="user">
      <div className="ambient pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <div id="top" className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">
          <Page />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
