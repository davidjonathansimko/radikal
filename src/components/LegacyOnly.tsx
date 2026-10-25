'use client';

// Pe desktop se vede mereu; pe telefon si tableta doar daca „Cautare si categorii vechi" e pornita din admin.

import React from 'react';
import { useFeatureFlags } from '@/lib/featureFlags';

export default function LegacyOnly({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const flags = useFeatureFlags();
  return <div className={`${flags.legacyBrowse ? '' : 'hidden lg:block'} ${className}`}>{children}</div>;
}
