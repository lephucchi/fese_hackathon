'use client';

import React from 'react';
import { ThemeProvider } from '@/hooks/useTheme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
