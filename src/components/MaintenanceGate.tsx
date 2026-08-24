'use client';

// =====================================================================
// Pasul 2308004 (A) — poarta care decide ce se vede
// ---------------------------------------------------------------------
// Regula, pe scurt:
//   • modul „Working" oprit          -> siteul normal
//   • pornit + vizitator normal      -> ecranul „Se efectuează lucrări"
//   • pornit + ADMIN                 -> siteul normal + o bara de avertizare
//
// DE CE nu aratam nimic cat timp verificam: daca am arata siteul si abia
// apoi l-am inlocui, vizitatorul ar apuca sa vada o clipa continutul —
// exact genul de clipire pe care tocmai am reparat-o in alta parte.
// =====================================================================

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { isAdminUser } from '@/lib/isAdmin';
import { useMaintenance, ADMIN_ENTRY_KEY } from '@/lib/maintenance';
import MaintenanceScreen from '@/components/MaintenanceScreen';

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useMaintenance();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  // Pasul 2308010 — adminul a tinut apasat pe logo si vrea sa se autentifice.
  const [adminEntry, setAdminEntry] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    try {
      setAdminEntry(sessionStorage.getItem(ADMIN_ENTRY_KEY) === '1');
    } catch {
      /* sessionStorage blocat — usa ascunsa ramane inchisa */
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setIsAdmin(isAdminUser(data.session?.user));
      setAuthChecked(true);
    });

    // Daca adminul se autentifica intre timp, poarta se deschide imediat
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(isAdminUser(session?.user));
      setAuthChecked(true);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Modul „Working" e oprit -> nu asteptam nimic, siteul merge normal.
  // Verificarea sesiunii nu trebuie sa intarzie pagina pentru nimeni.
  if (!loading && !settings.enabled) return <>{children}</>;

  // Inca verificam -> ecran negru simplu, fara continut si fara mesaj.
  // Dureaza cat o singura cerere mica.
  if (loading || !authChecked) {
    return <div className="fixed inset-0 z-[10000] bg-black" aria-hidden="true" />;
  }

  // In lucru + vizitator normal -> totul inghetat.
  // Singura exceptie: adminul care a folosit usa ascunsa poate ajunge la login.
  if (!isAdmin) {
    if (adminEntry && pathname?.startsWith('/auth/login')) return <>{children}</>;
    return <MaintenanceScreen settings={settings} />;
  }

  // In lucru + admin -> lucreaza normal, dar cu un memento vizibil
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[10001] bg-amber-500 px-3 py-1 text-center text-[11px] font-semibold text-black">
        Mod „în lucru&ldquo; activ — vizitatorii NU văd site-ul.
      </div>
      {children}
    </>
  );
}
