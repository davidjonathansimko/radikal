// Route Protection Middleware - Protects routes until user completes modal
// Middleware de Protecție Rute - Protejează rutele până când utilizatorul completează modalul

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { isGuestMode } from '@/hooks/useGuestMode';

export function useRouteProtection() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Allow access to auth pages always
        if (pathname.startsWith('/auth/')) {
          setIsAllowed(true);
          setIsChecking(false);
          return;
        }

        // Allow access to home page always (modal will show there)
        if (pathname === '/') {
          setIsAllowed(true);
          setIsChecking(false);
          return;
        }

        // Pasul C3: modul VIZITATOR — utilizatorul a ales "Continuă ca vizitator".
        // Poate naviga liber, dar comentariile si notificarile sunt blocate
        // separat (vezi useGuestMode).
        // Guest mode — allowed to browse, comments/notifications blocked elsewhere.
        if (isGuestMode()) {
          setIsAllowed(true);
          setIsChecking(false);
          return;
        }

        // Check if user is authenticated.
        //
        // IMPORTANT: getSession() reads the token from local storage and never
        // touches the network. getUser() does a round trip and used to be the
        // FIRST check — so a slow connection, an offline moment or (previously)
        // a stale cached auth response made it throw, and the catch below threw
        // the user back to the home page with a broken shell. Local first,
        // network only as a fallback.
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        let user = session?.user ?? null;
        if (!user) {
          const { data } = await supabase.auth.getUser();
          user = data.user;
        }

        if (user) {
          // Authenticated user - check if they have selected a language
          const savedLanguage = localStorage.getItem('radikalSelectedLanguage');
          if (savedLanguage) {
            // User has selected language, allow access
            setIsAllowed(true);
          } else {
            // User hasn't selected language yet, redirect to home
            router.push('/');
            setIsAllowed(false);
          }
        } else {
          // Not authenticated — redirect to home (registration required)
          // Nicht authentifiziert — zur Startseite weiterleiten (Registrierung erforderlich)
          // Nu este autentificat — redirecționează la pagina principală (înregistrare necesară)
          router.push('/');
          setIsAllowed(false);
        }
      } catch (error) {
        console.error('Error checking route access:', error);
        // A network hiccup must NOT log the user out of the UI. If we still
        // have a stored session and a chosen language, let them keep browsing.
        const hasLocalSession =
          typeof window !== 'undefined' &&
          !!localStorage.getItem('radikalSelectedLanguage') &&
          Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.includes('auth-token'));

        if (hasLocalSession) {
          setIsAllowed(true);
        } else {
          router.push('/');
          setIsAllowed(false);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [pathname, router]);

  return { isAllowed, isChecking };
}
