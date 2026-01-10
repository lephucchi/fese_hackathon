'use client';

import { Navigation } from '@/components/shared/Navigation';
import { PersonalTab } from '@/components/personal/PersonalTab';

export default function PersonalPage() {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navigation />
      <main style={{ paddingTop: '80px' }}>
        <PersonalTab />
      </main>
    </div>
  );
}

