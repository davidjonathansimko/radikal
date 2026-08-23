'use client';

/**
 * Pasul 2308006-D — butonul de limba din capul panoului de administrare.
 *
 * Patru steaguri. Apesi pe unul, panoul trece in limba aceea si alegerea
 * se salveaza pentru contul tau. Alt admin poate avea alta limba — nu se
 * incurca intre ei.
 */

import { ADMIN_LANGS, ADMIN_LANG_FLAGS, ADMIN_LANG_LABELS, type AdminLang } from '@/hooks/useAdminLang';

interface AdminLangSwitcherProps {
  lang: AdminLang;
  onChange: (lang: AdminLang) => void;
  /** Eticheta de deasupra, deja tradusa */
  label?: string;
  className?: string;
}

export default function AdminLangSwitcher({
  lang,
  onChange,
  label,
  className = '',
}: AdminLangSwitcherProps) {
  return (
    <div className={className}>
      {label && (
        <span className="mr-3 text-xs uppercase tracking-wider text-white/40">
          {label}
        </span>
      )}
      <div className="inline-flex items-center gap-1 rounded-lg border border-white/15 p-1">
        {ADMIN_LANGS.map((code) => {
          const active = code === lang;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              aria-pressed={active}
              title={ADMIN_LANG_LABELS[code]}
              className={`rounded-md px-2.5 py-1 text-sm transition-colors ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <span aria-hidden="true">{ADMIN_LANG_FLAGS[code]}</span>
              <span className="ml-1.5 hidden sm:inline text-xs">
                {code.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
