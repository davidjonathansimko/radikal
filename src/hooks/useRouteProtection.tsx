// Route Protection Middleware - Protects routes until user completes modal
// Middleware de Protecție Rute - Protejează rutele până când utilizatorul completează modalul

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';

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

        // Check if user is authenticated
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

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
        // On error, redirect to home to be safe
        router.push('/');
        setIsAllowed(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [pathname, router]);

  return { isAllowed, isChecking };
}
