'use client';

/**
 * useTheme Hook
 * 
 * Re-exports theme utilities from ThemeContext.
 * This provides backward compatibility for existing imports.
 */

export { useTheme, ThemeProvider } from '@/contexts/ThemeContext';
export type { Theme, ThemeContextType } from '@/contexts/ThemeContext';
