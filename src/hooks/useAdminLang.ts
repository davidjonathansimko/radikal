'use client';

/**
 * Pasul 2308006-D — LIMBA PANOULUI DE ADMINISTRARE.
 *
 * Problema: meniul de admin era scris amestecat (parte romana, parte
 * germana). Daca inviti pe cineva care stie doar germana, se pierde.
 *
 * Solutia: fiecare admin isi alege limba lui, iar alegerea se salveaza in
 * baza de date (tabelul `admin_preferences`). Oridecateori se logheaza,
 * panoul apare direct in limba lui, pe orice calculator.
 *
 * Tabelul se creeaza cu `STEP_2308006_ADMIN_LANG.sql`.
 * Daca SQL-ul nu a fost inca rulat, totul merge mai departe: alegerea se
 * tine minte doar pe calculatorul curent si nimic nu se strica.
 */

import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export const ADMIN_LANGS = ['de', 'en', 'ro', 'ru'] as const;
export type AdminLang = (typeof ADMIN_LANGS)[number];

export const ADMIN_LANG_LABELS: Record<AdminLang, string> = {
  de: 'Deutsch',
  en: 'English',
  ro: 'Română',
  ru: 'Русский',
};

/** Steagul, ca sa recunosti limba dintr-o privire */
export const ADMIN_LANG_FLAGS: Record<AdminLang, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  ro: '🇷🇴',
  ru: '🇷🇺',
};

const STORAGE_KEY = 'radikal.adminLang';

function isAdminLang(value: unknown): value is AdminLang {
  return typeof value === 'string' && (ADMIN_LANGS as readonly string[]).includes(value);
}

/* =========================================================================
 * TEXTELE panoului, in cele 4 limbi.
 * Cheile sunt scurte si descriptive: `tabs.blogs`, `actions.save` …
 * Daca o traducere lipseste, se foloseste germana (limba standard).
 * ========================================================================= */
const T: Record<AdminLang, Record<string, string>> = {
  de: {
    'lang.label': 'Sprache des Adminbereichs',
    'lang.saved': 'Sprache gespeichert',
    'tabs.blogs': 'Beiträge',
    'tabs.reels': 'Reels',
    'tabs.news': 'News',
    'tabs.categories': 'Kategorien',
    'tabs.settings': 'Einstellungen',
    'tabs.stats': 'Statistiken',
    'tabs.users': 'Benutzer',
    'actions.view': 'Ansehen',
    'actions.edit': 'Bearbeiten',
    'actions.delete': 'Löschen',
    'actions.newsletter': 'Newsletter senden',
    'actions.save': 'Speichern',
    'actions.cancel': 'Abbrechen',
    'actions.create': 'Erstellen',
    'state.draft': 'Entwurf',
    'state.published': 'Veröffentlicht',
  },
  en: {
    'lang.label': 'Admin panel language',
    'lang.saved': 'Language saved',
    'tabs.blogs': 'Posts',
    'tabs.reels': 'Reels',
    'tabs.news': 'News',
    'tabs.categories': 'Categories',
    'tabs.settings': 'Settings',
    'tabs.stats': 'Statistics',
    'tabs.users': 'Users',
    'actions.view': 'View',
    'actions.edit': 'Edit',
    'actions.delete': 'Delete',
    'actions.newsletter': 'Send newsletter',
    'actions.save': 'Save',
    'actions.cancel': 'Cancel',
    'actions.create': 'Create',
    'state.draft': 'Draft',
    'state.published': 'Published',
  },
  ro: {
    'lang.label': 'Limba panoului de administrare',
    'lang.saved': 'Limba a fost salvată',
    'tabs.blogs': 'Articole',
    'tabs.reels': 'Reels',
    'tabs.news': 'Noutăți',
    'tabs.categories': 'Categorii',
    'tabs.settings': 'Setări',
    'tabs.stats': 'Statistici',
    'tabs.users': 'Utilizatori',
    'actions.view': 'Vezi',
    'actions.edit': 'Modifică',
    'actions.delete': 'Șterge',
    'actions.newsletter': 'Trimite newsletter',
    'actions.save': 'Salvează',
    'actions.cancel': 'Renunță',
    'actions.create': 'Creează',
    'state.draft': 'Ciornă',
    'state.published': 'Publicat',
  },
  ru: {
    'lang.label': 'Язык панели администратора',
    'lang.saved': 'Язык сохранён',
    'tabs.blogs': 'Записи',
    'tabs.reels': 'Reels',
    'tabs.news': 'Новости',
    'tabs.categories': 'Категории',
    'tabs.settings': 'Настройки',
    'tabs.stats': 'Статистика',
    'tabs.users': 'Пользователи',
    'actions.view': 'Смотреть',
    'actions.edit': 'Изменить',
    'actions.delete': 'Удалить',
    'actions.newsletter': 'Отправить рассылку',
    'actions.save': 'Сохранить',
    'actions.cancel': 'Отмена',
    'actions.create': 'Создать',
    'state.draft': 'Черновик',
    'state.published': 'Опубликовано',
  },
};

/**
 * Hook-ul principal.
 *
 * Intoarce:
 *  - `lang`     limba aleasa acum
 *  - `setLang`  o schimba si o salveaza (baza de date + calculatorul curent)
 *  - `t`        traduce o cheie: `t('actions.save')`
 *  - `ready`    `true` dupa ce am citit alegerea salvata (ca sa nu clipeasca)
 */
export function useAdminLang() {
  const [lang, setLangState] = useState<AdminLang>('de');
  const [ready, setReady] = useState(false);

  // 1. Citim intai de pe calculator (instantaneu, fara clipire),
  //    apoi din baza de date (adevarul, valabil pe orice calculator).
  useEffect(() => {
    let cancelled = false;

    const local = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (isAdminLang(local)) setLangState(local);

    (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { setReady(true); return; }

        const { data, error } = await supabase
          .from('admin_preferences')
          .select('admin_lang')
          .eq('user_id', user.id)
          .maybeSingle();

        // 42P01 = tabelul nu exista inca (SQL-ul nu a fost rulat).
        // Nu e o problema: ramanem cu alegerea de pe calculator.
        if (!cancelled && !error && isAdminLang(data?.admin_lang)) {
          setLangState(data.admin_lang as AdminLang);
          localStorage.setItem(STORAGE_KEY, data.admin_lang as string);
        }
      } catch {
        /* fara internet sau fara tabel — mergem mai departe */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // 2. Schimbarea limbii
  const setLang = useCallback(async (next: AdminLang) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* mod privat */ }

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('admin_preferences')
        .upsert(
          { user_id: user.id, admin_lang: next, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
    } catch {
      /* daca tabelul nu exista, alegerea ramane doar pe calculatorul curent */
    }
  }, []);

  // 3. Traducerea
  const t = useCallback(
    (key: string) => T[lang]?.[key] ?? T.de[key] ?? key,
    [lang],
  );

  return { lang, setLang, t, ready };
}
