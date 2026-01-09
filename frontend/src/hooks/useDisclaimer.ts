'use client';

import { useState, useEffect } from 'react';

const DISCLAIMER_STORAGE_KEY = 'macroinsight_disclaimer_accepted';

export function useDisclaimer() {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has already accepted
    const accepted = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
    setHasAccepted(accepted === 'true');
    setIsLoading(false);
  }, []);

  const acceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
    setHasAccepted(true);
  };

  const resetDisclaimer = () => {
    localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
    setHasAccepted(false);
  };

  return {
    hasAccepted,
    isLoading,
    acceptDisclaimer,
    resetDisclaimer
  };
}
