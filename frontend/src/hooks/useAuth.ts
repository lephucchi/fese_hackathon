'use client';

/**
 * useAuth Hook
 * 
 * Convenience hook to access authentication context.
 * Re-exports the useAuth from AuthContext for cleaner imports.
 */

export { useAuth } from '@/contexts/AuthContext';
export type { User } from '@/contexts/AuthContext';
