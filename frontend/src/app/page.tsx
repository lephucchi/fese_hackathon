'use client';

import { Navigation } from '@/components/shared/Navigation';
import { Hero, FeatureHighlights, HowItWorks, Pricing, Footer, AuthModal } from '@/components/landing';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Already logged in, go to dashboard
      router.push('/dashboard');
    } else {
      // Not logged in, show auth modal
      setShowAuthModal(true);
    }
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      <Navigation onLoginClick={() => setShowAuthModal(true)} />
      <main style={{ width: '100%' }}>
        <Hero onGetStarted={handleGetStarted} />
        <FeatureHighlights />
        <HowItWorks />
        <Pricing onGetStarted={handleGetStarted} />
      </main>
      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
