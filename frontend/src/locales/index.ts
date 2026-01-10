/**
 * Locales barrel export
 */

import vi from './vi.json';
import en from './en.json';

export type Language = 'vi' | 'en';

export const translations = {
    vi,
    en,
} as const;

export type TranslationKeys = typeof vi;
