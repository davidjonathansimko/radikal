'use client';

import React, { useEffect, useState } from 'react';
import { fetchSignature, saveSignature, SIGNATURE_DEFAULTS, type SignatureSettings, type SignatureStyle } from '@/lib/signature';

export default function SignatureAdmin() {
  const [s, setS] = useState<SignatureSettings>(SIGNATURE_DEFAULTS);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    void fetchSignature(true).then((v) => alive && setS(v));
    return () => {
      alive = false;
    };
  }, []);

  const update = async (next: SignatureSettings) => {
    setS(next);
    try {
      await saveSignature(next);
      setMsg('Salvat.');
    } catch {
      setMsg('Nu am putut salva.');
    }
  };

  const toggle = 'btn-solid shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80';
  const on = 'border border-black/15 text-black dark:border-white/15 dark:text-white';
  const off = 'bg-black text-white dark:bg-white dark:text-black';

  const row = (label: string, text: string, value: boolean, key: 'reels' | 'playBlog') => (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-black dark:text-white">{label}</p>
        <p className="mt-0.5 text-xs text-black/55 dark:text-white/55">{text}</p>
      </div>
      <button type="button" onClick={() => void update({ ...s, [key]: !value })} className={`${toggle} ${value ? on : off}`}>
        {value ? 'Afișată · Ascunde' : 'Ascunsă · Afișează'}
      </button>
    </div>
  );

  const styleBtn = (v: SignatureStyle, label: string) => (
    <button
      key={v}
      type="button"
      onClick={() => void update({ ...s, style: v })}
      className={`${toggle} ${s.style === v ? off : on}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {row('În Reels', 'Semnătura fină „RADIKAL.” sub text.', s.reels, 'reels')}
      {row('În Play Blog', 'La bloguri, mărturii, Andacht și pentru copii (articole dinamice).', s.playBlog, 'playBlog')}
      <div>
        <p className="mb-2 text-sm font-semibold text-black dark:text-white">Cum arată</p>
        <div className="flex flex-wrap gap-2">
          {styleBtn('text', 'Text „RADIKAL.”')}
          {styleBtn('logo', 'Logo în contur')}
        </div>
      </div>
      {msg && <p className="text-xs text-black/60 dark:text-white/60" role="status">{msg}</p>}
    </div>
  );
}
