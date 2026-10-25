'use client';

// Afiseaza butonul „inapoi la pagina principala" doar daca e pornit din admin (implicit ascuns).

import React from 'react';
import { useFeatureFlags } from '@/lib/featureFlags';

export default function HomeButtonGate({ children }: { children: React.ReactNode }) {
  const flags = useFeatureFlags();
  return flags.homeButton ? <>{children}</> : null;
}
