'use client';

import { Navigation } from '@/components/shared/Navigation';
import { Hero, FeatureHighlights, HowItWorks, Pricing, Footer, AuthModal } from '@/components/landing';
import { useState } from 'react';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      <Navigation onLoginClick={() => setShowAuthModal(true)} />
      <main style={{ width: '100%' }}>
        <Hero onGetStarted={() => setShowAuthModal(true)} />
        <FeatureHighlights />
        <HowItWorks />
        <Pricing onGetStarted={() => setShowAuthModal(true)} />
      </main>
      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
