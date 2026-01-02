import { Navigation } from '@/components/shared/Navigation';
import { Hero, CoreValue, HowItWorks, UseCases, CTA, Footer } from '@/components/landing';

export default function Home() {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      <Navigation />
      <main style={{ width: '100%' }}>
        <Hero />
        <CoreValue />
        <HowItWorks />
        <UseCases />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
