// Panou de administrare pentru Reels / Reels admin panel
//
// Permite:
//   - crearea unui reel DE SINE STATATOR (fara blog)  -> are doar buton de like
//   - crearea unui reel LEGAT DE UN ARTICOL de blog   -> are like + sageata
//   - comutator "Publicat" (draft <-> public)
//   - ordonare (sort_order), editare text si stergere
//
// Componenta este complet independenta de formularul de blog existent,
// ca sa nu existe niciun risc pentru functionalitatea actuala.

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface ReelRow {
  id: string;
  content: string;
  reference: string | null;
  blog_post_id: string | null;
  published: boolean;
  sort_order: number;
  likes_count: number;
}

interface PostOption {
  id: string;
  title: string;
}

export default function ReelsAdmin() {
  const [reels, setReels] = useState<ReelRow[]>([]);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Formular de creare
  const [content, setContent] = useState('');
  const [reference, setReference] = useState('');
  const [blogPostId, setBlogPostId] = useState<string>('');
  const [published, setPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  const notify = (type: 'ok' | 'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const [reelsRes, postsRes] = await Promise.all([
        supabase
          .from('reels')
          .select('id, content, reference, blog_post_id, published, sort_order, likes_count')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('blog_posts')
          .select('id, title')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      if (reelsRes.error) {
        notify('err', `Nu am putut încărca reels: ${reelsRes.error.message}`);
        setReels([]);
      } else {
        setReels((reelsRes.data as ReelRow[]) || []);
      }

      if (!postsRes.error) {
        setPosts((postsRes.data as PostOption[]) || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      notify('err', 'Textul reel-ului nu poate fi gol.');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('reels').insert({
        content: content.trim(),
        reference: reference.trim() || null,
        // Gol = reel de sine statator (doar like)
        blog_post_id: blogPostId || null,
        published,
        sort_order: sortOrder,
      });

      if (error) {
        notify('err', `Eroare la salvare: ${error.message}`);
      } else {
        notify('ok', 'Reel creat cu succes.');
        setContent('');
        setReference('');
        setBlogPostId('');
        setPublished(false);
        setSortOrder(0);
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (reel: ReelRow) => {
    const supabase = createClient();
    // Actualizare optimista
    setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, published: !r.published } : r)));

    const { error } = await supabase
      .from('reels')
      .update({ published: !reel.published })
      .eq('id', reel.id);

    if (error) {
      // Revenim daca a esuat
      setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, published: reel.published } : r)));
      notify('err', `Nu am putut schimba starea: ${error.message}`);
    }
  };

  const handleDelete = async (reel: ReelRow) => {
    if (!window.confirm('Sigur ștergi acest reel? Acțiunea nu poate fi anulată.')) return;

    const supabase = createClient();
    const { error } = await supabase.from('reels').delete().eq('id', reel.id);

    if (error) {
      notify('err', `Nu am putut șterge: ${error.message}`);
    } else {
      setReels((prev) => prev.filter((r) => r.id !== reel.id));
      notify('ok', 'Reel șters.');
    }
  };

  const inputClass =
    'w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors';

  return (
    <section className="rounded-2xl border border-black/10 dark:border-white/10 p-5 sm:p-6 bg-white dark:bg-black">
      <h2 className="text-xl font-bold text-black dark:text-white mb-1">Reels</h2>
      <p className="text-sm text-black/60 dark:text-white/60 mb-5">
        Reels fără articol au <strong>doar buton de like</strong>. Cele legate de un articol au și săgeata către articol.
      </p>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.type === 'ok'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ---------------- Formular de creare ---------------- */}
      <form onSubmit={handleCreate} className="grid gap-4 mb-8">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
            Text (apare animat cuvânt cu cuvânt)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Frica de oameni este o capcană"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
              Referință (opțional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
              placeholder="Proverbe 29:25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 mb-1">
              Articol legat (opțional)
            </label>
            <select
              value={blogPostId}
              onChange={(e) => setBlogPostId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Fără articol (doar like) —</option>
              {posts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
              Ordine
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="w-20 rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-sm"
            />
          </div>

          {/* Comutator de publicare */}
          <button
            type="button"
            onClick={() => setPublished((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-black dark:text-white"
            aria-pressed={published}
          >
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                published ? 'bg-green-500' : 'bg-black/20 dark:bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  published ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
            {published ? 'Publicat' : 'Ciornă'}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="ml-auto rounded-lg bg-black dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-black transition-opacity disabled:opacity-50 hover:opacity-80"
          >
            {saving ? 'Se salvează…' : 'Creează reel'}
          </button>
        </div>
      </form>

      {/* ---------------- Lista existenta ---------------- */}
      {loading ? (
        <p className="text-sm text-black/50 dark:text-white/50">Se încarcă…</p>
      ) : reels.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">Încă nu există niciun reel.</p>
      ) : (
        <ul className="grid gap-3">
          {reels.map((reel) => (
            <li
              key={reel.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 dark:border-white/10 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-black dark:text-white">{reel.content}</p>
                <p className="text-xs text-black/50 dark:text-white/50">
                  {reel.blog_post_id ? '🔗 legat de articol' : '● doar like'} · ordine {reel.sort_order} · ♥ {reel.likes_count}
                </p>
              </div>

              <button
                onClick={() => togglePublished(reel)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  reel.published
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                    : 'bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60'
                }`}
              >
                {reel.published ? 'Publicat' : 'Ciornă'}
              </button>

              <button
                onClick={() => handleDelete(reel)}
                className="rounded-full px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Șterge
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
