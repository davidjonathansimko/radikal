'use client';

// =====================================================================
// Pasul 2208001 — Sincronizarea VOCII cu TEXTUL („Play Blog")
// =====================================================================
// Cerinta: „sa se auda exact ceea ce apare pe ecran".
//
// Cum functioneaza:
//   1. Textul se taie in bucati de max. ~1500 caractere, DOAR la capat de
//      propozitie, ca vocea sa nu fie taiata la mijloc de cuvant.
//   2. Fiecare bucata se trimite la `/api/tts` si se primeste MP3 (base64).
//   3. Bucatile se redau una dupa alta, fara pauza perceptibila.
//   4. In fiecare cadru citim `audio.currentTime` si calculam CE CUVANT
//      se aude chiar acum, impartind durata reala a bucatii intre cuvinte
//      proportional cu lungimea lor (cuvintele lungi se aud mai mult).
//   5. La PAUZA totul ingheata exact acolo, pentru ca totul se calculeaza
//      din `currentTime`, nu dintr-un cronometru separat.
//
// NIMIC nu apare pe ecran pana cand prima bucata de voce nu e gata
// (`isReady`), exact cum ai cerut.
// =====================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_CHUNK_CHARS = 1500; // sub limita de 2000 a rutei /api/tts

export interface SyncedWord {
  text: string;
  /** indexul bucatii din care face parte */
  chunk: number;
  /** momentul (in secunde, relativ la inceputul bucatii) cand incepe */
  start: number;
  end: number;
}

interface Chunk {
  text: string;
  words: { text: string; weight: number }[];
  audio: HTMLAudioElement | null;
  duration: number; // 0 = inca necunoscuta
}

/** Taie textul in bucati la capat de propozitie */
export function splitIntoChunks(text: string, max = MAX_CHUNK_CHARS): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];

  const sentences = clean.match(/[^.!?…]+[.!?…]*\s*/g) ?? [clean];
  const out: string[] = [];
  let current = '';

  for (const s of sentences) {
    if ((current + s).length > max && current) {
      out.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

function base64ToAudio(base64: string): HTMLAudioElement {
  const audio = new Audio(`data:audio/mp3;base64,${base64}`);
  audio.preload = 'auto';
  return audio;
}

/**
 * Pasul A03 — CAT DUREAZA, DE FAPT, UN CUVANT ROSTIT.
 *
 * Inainte foloseam `Math.max(2, w.length) + 1`, adica numaram literele.
 * Doua probleme mari, care faceau textul sa ramana din ce in ce mai in urma:
 *
 *   1. Vocea nu rosteste litere, ci SILABE. „Gerechtigkeit" (13 litere) si
 *      „aaaaaaaaaaaaa" ar fi avut aceeasi greutate, desi suna complet diferit.
 *   2. Punctuatia nu conta deloc. Dar vocea TACE la virgula, si mai mult la
 *      punct. Timpul acela de tacere era impartit gresit cuvintelor urmatoare,
 *      iar eroarea se aduna: la inceput mergea bine, apoi ramanea in urma —
 *      exact ce se vedea.
 *
 * Acum numaram grupurile de vocale (aproximarea standard pentru silabe) si
 * adaugam explicit pauzele de punctuatie.
 */
export function wordWeight(word: string): number {
  // Litera cu litera, fara semne: ce se pronunta efectiv
  const bare = word.replace(/[^A-Za-z0-9ăâîșțĂÂÎȘȚäöüßÄÖÜéèêàçА-Яа-яЁё]/g, '');

  // Silabe ~ grupuri de vocale (merge rezonabil in ro/de/en/ru)
  const syllables = (bare.match(/[aeiouyăâîäöüéèêàаеёиоуыэюя]+/gi) || []).length || 1;

  // Baza: un cuvant scurt de o silaba = ~3,2 unitati
  let weight = 1 + syllables * 2.2;

  // Cuvintele foarte lungi au si consoane care cer timp
  weight += Math.max(0, bare.length - syllables * 3) * 0.25;

  // PAUZELE — aici se castiga cea mai mare parte din sincronizare
  if (/[.!?…]["»”')\]]*$/.test(word)) weight += 7;      // sfarsit de propozitie
  else if (/[:;]["»”')\]]*$/.test(word)) weight += 5;   // doua puncte / punct-virgula
  else if (/[,—–]["»”')\]]*$/.test(word)) weight += 3;  // virgula, linie de dialog

  // ------------------------------------------------------------------
  // Pasul A19 — PAUZA DINTRE PARAGRAFE.
  //
  // Aici era ultima ramanere in urma. Textul se taia cu `split(' ')`, deci
  // randul nou („\n") ramanea lipit de cuvant si nu conta NICIODATA ca timp.
  // Dar cand se citeste, intre doua paragrafe se face o pauza reala de
  // aproape o secunda — mai ales daca este vocea ta, nu TTS.
  //
  // Fiindca acea pauza nu era numarata, tot timpul ei se imprastia peste
  // cuvintele urmatoare, iar textul o lua inaintea vocii cu cate putin la
  // fiecare paragraf. La un articol lung, diferenta devenea suparatoare.
  //
  // Acum o numaram explicit: un rand nou = +6, un rand gol (paragraf nou)
  // = +14. Asa textul asteapta cat asteapta si vocea.
  const newlines = (word.match(/\n/g) || []).length;
  if (newlines >= 2) weight += 14;
  else if (newlines === 1) weight += 6;

  return weight;
}

/** Transforma un sir de cuvinte in perechi {text, weight}. */
function toWeightedWords(text: string): { text: string; weight: number }[] {
  return text.split(' ').map((w) => ({ text: w, weight: wordWeight(w) }));
}

export interface UseVoiceSyncedTextOptions {
  text: string;
  language: string;
  speakingRate?: number;
  blogSlug?: string | null;
  blogTitle?: string | null;
  /**
   * Pasul 2208002 — fisier MP3 PREGENERAT pentru intreg articolul.
   * Daca exista, NU se mai cere nimic de la Google: se reda un singur
   * fisier, pornirea e instantanee si costul este zero.
   */
  prebuiltUrl?: string | null;
  /** Nu incepe sa incarce nimic pana nu e `true` */
  enabled: boolean;
  /**
   * Pasul 2308003 — viteza de REDARE (nu de generare).
   * `speakingRate` schimba fisierul cerut de la Google si ar invalida cache-ul.
   * `playbackRate` incetineste doar redarea in browser, deci NU costa nimic
   * si NU regenereaza audio-ul. La Play Blog folosim 0.8.
   */
  playbackRate?: number;
}

export function useVoiceSyncedText({
  text,
  language,
  speakingRate = 0.9,
  blogSlug = null,
  blogTitle = null,
  prebuiltUrl = null,
  enabled,
  playbackRate = 1,
}: UseVoiceSyncedTextOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Cate cuvinte (global) s-au auzit deja */
  const [spokenCount, setSpokenCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);

  // Pasul A03 — viteza de redare, tinuta intr-un ref ca bucla de
  // sincronizare (`tick`) sa o poata folosi fara sa fie recreata.
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;

  const chunksRef = useRef<Chunk[]>([]);
  const indexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  /** Toate cuvintele, in ordine, ca sa le poata desena componenta */
  const [allWords, setAllWords] = useState<string[]>([]);

  // ------------------------------------------------------------------
  // Incarcarea unei bucati
  // ------------------------------------------------------------------
  const fetchChunk = useCallback(
    async (i: number) => {
      const chunk = chunksRef.current[i];
      if (!chunk || chunk.audio) return;

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chunk.text,
          language,
          speakingRate,
          blogSlug,
          blogTitle,
        }),
      });

      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const data = await res.json();
      if (!data?.audioContent) throw new Error('TTS fara audio');

      const audio = base64ToAudio(data.audioContent);
      chunk.audio = audio;

      // Aflam durata reala — fara ea nu putem sincroniza
      await new Promise<void>((resolve) => {
        if (audio.readyState >= 1 && isFinite(audio.duration)) {
          chunk.duration = audio.duration;
          resolve();
          return;
        }
        const done = () => {
          chunk.duration = isFinite(audio.duration) ? audio.duration : 0;
          audio.removeEventListener('loadedmetadata', done);
          resolve();
        };
        audio.addEventListener('loadedmetadata', done);
        // Plasa de siguranta: daca metadatele nu vin, estimam din caractere
        setTimeout(() => {
          if (!chunk.duration) {
            chunk.duration = chunk.text.length / 14; // ~14 caractere/secunda
            resolve();
          }
        }, 4000);
      });

      setTotal(chunksRef.current.reduce((s, c) => s + (c.duration || c.text.length / 14), 0));
    },
    [language, speakingRate, blogSlug, blogTitle],
  );

  // ------------------------------------------------------------------
  // Pregatirea: taiem textul, cerem PRIMA bucata, apoi restul in fundal
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !text.trim()) return;
    cancelledRef.current = false;
    setError(null);
    setIsReady(false);
    setSpokenCount(0);
    setElapsed(0);
    indexRef.current = 0;

    const pieces = splitIntoChunks(text);
    chunksRef.current = pieces.map((p) => ({
      text: p,
      words: toWeightedWords(p),
      audio: null,
      duration: 0,
    }));
    setAllWords(chunksRef.current.flatMap((c) => c.words.map((w) => w.text)));

    // ----------------------------------------------------------------
    // CAZUL 1 — exista fisier PREGENERAT: o singura bucata, zero cereri
    // ----------------------------------------------------------------
    if (prebuiltUrl) {
      const clean = text.replace(/\s+/g, ' ').trim();
      const words = toWeightedWords(clean);
      const audio = new Audio(prebuiltUrl);
      audio.preload = 'auto';

      const single: Chunk = { text: clean, words, audio, duration: 0 };
      chunksRef.current = [single];
      setAllWords(words.map((w) => w.text));

      const ready = () => {
        if (cancelledRef.current) return;
        single.duration = isFinite(audio.duration) ? audio.duration : clean.length / 14;
        setTotal(single.duration);
        setIsReady(true);
      };

      if (audio.readyState >= 1 && isFinite(audio.duration)) {
        ready();
      } else {
        audio.addEventListener('loadedmetadata', ready, { once: true });
        audio.addEventListener(
          'error',
          () => {
            if (!cancelledRef.current) {
              setError('Fișierul audio salvat nu a putut fi încărcat.');
            }
          },
          { once: true },
        );
        // Plasa de siguranta
        setTimeout(() => {
          if (!cancelledRef.current && !single.duration) ready();
        }, 6000);
      }

      return () => {
        cancelledRef.current = true;
        audio.pause();
        audio.src = '';
        chunksRef.current = [];
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    // ----------------------------------------------------------------
    // CAZUL 2 — fara fisier pregenerat: se cere vocea in direct (ca inainte)
    // ----------------------------------------------------------------
    (async () => {
      try {
        await fetchChunk(0);
        if (cancelledRef.current) return;
        setIsReady(true);

        // Restul se incarca in fundal, una cate una (fara sa sufoce reteaua)
        for (let i = 1; i < chunksRef.current.length; i++) {
          if (cancelledRef.current) return;
          try {
            await fetchChunk(i);
          } catch {
            /* o bucata lipsa nu trebuie sa opreasca tot */
          }
        }
      } catch (e) {
        if (!cancelledRef.current) {
          setError(e instanceof Error ? e.message : 'Vocea nu a putut fi pregătită.');
        }
      }
    })();

    return () => {
      cancelledRef.current = true;
      chunksRef.current.forEach((c) => {
        if (c.audio) {
          c.audio.pause();
          c.audio.src = '';
        }
      });
      chunksRef.current = [];
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, text, prebuiltUrl, fetchChunk]);

  // ------------------------------------------------------------------
  // Bucla de sincronizare: din `currentTime` aflam cuvantul curent
  // ------------------------------------------------------------------
  const tick = useCallback(() => {
    const i = indexRef.current;
    const chunk = chunksRef.current[i];
    if (!chunk?.audio) return;

    const t = chunk.audio.currentTime;
    const dur = chunk.duration || chunk.audio.duration || 1;

    // Cuvintele dinaintea bucatii curente sunt deja rostite
    let before = 0;
    for (let k = 0; k < i; k++) before += chunksRef.current[k].words.length;

    // In interiorul bucatii impartim timpul proportional cu lungimea cuvintelor
    const totalWeight = chunk.words.reduce((s, w) => s + w.weight, 0) || 1;

    // Pasul 2308000 — ANTICIPARE.
    // Inainte, un cuvant se aprindea abia dupa ce era rostit COMPLET, asa ca
    // textul parea ca vine din urma vocii.
    //
    // Pasul A03 — de ce 0,22 s nu era de ajuns:
    // aprinderea cuvantului NU e instantanee, ci dureaza cat tranzitia CSS
    // (~0,42 s) plus mica intarziere a literelor. Daca pornim animatia cu
    // 0,22 s inainte, cuvantul devine complet vizibil la ~0,25 s DUPA ce a
    // fost rostit. De aceea „auzeai cuvantul, apoi il vedeai".
    // Acum pornim cu 0,42 s inainte, adica exact cat sa fie complet aprins
    // in clipa in care il auzi.
    //
    // Nota: `currentTime` curge mai incet cand redarea e incetinita
    // (Play Blog foloseste 0,8). De aceea inmultim cu viteza de redare,
    // ca anticiparea sa ramana 0,42 s de timp REAL, nu de timp audio.
    // Pasul A07 — animatia a devenit mai lunga (800 ms, ca la reels), ca
    // literele sa se FORMEZE, nu sa apara brusc. Deci trebuie sa pornim si
    // mai devreme: pornim la ~60% din animatie inainte de sunet, ca in
    // clipa in care auzi cuvantul el sa fie deja aproape complet format.
    const LEAD_SECONDS = 0.58 * (playbackRateRef.current || 1);
    const target = ((t + LEAD_SECONDS) / dur) * totalWeight;

    let acc = 0;
    let spokenInChunk = 0;
    for (const w of chunk.words) {
      acc += w.weight;
      if (acc - w.weight / 2 <= target) spokenInChunk++;
      else break;
    }

    setSpokenCount(before + spokenInChunk);

    let elapsedBefore = 0;
    for (let k = 0; k < i; k++) elapsedBefore += chunksRef.current[k].duration || 0;
    setElapsed(elapsedBefore + t);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  // ------------------------------------------------------------------
  // Redare / pauza / cautare
  // ------------------------------------------------------------------
  const playFrom = useCallback(
    async (i: number, offset = 0) => {
      const chunk = chunksRef.current[i];
      if (!chunk) {
        setIsPlaying(false);
        stopLoop();
        return;
      }
      if (!chunk.audio) {
        try {
          await fetchChunk(i);
        } catch {
          setIsPlaying(false);
          return;
        }
      }
      const audio = chunksRef.current[i].audio;
      if (!audio) return;

      indexRef.current = i;
      audio.currentTime = offset;

      audio.onended = () => {
        if (i + 1 < chunksRef.current.length) {
          void playFrom(i + 1, 0);
        } else {
          setIsPlaying(false);
          stopLoop();
        }
      };

      try {
        // Viteza de redare (0.9 la Play Blog) — se aplica de fiecare data,
        // pentru ca fiecare bucata are propriul element <audio>.
        //
        // Pasul 2308005 — `preservesPitch`: fara el, browserul coboara
        // TONUL vocii cand incetineste, si vocea suna groasa si nenaturala.
        // Cu el, tonul ramane exact al vocii noastre Chirp3-HD; se schimba
        // doar ritmul. Numele cu prefix exista pentru Safari mai vechi.
        const el = audio as HTMLAudioElement & {
          mozPreservesPitch?: boolean;
          webkitPreservesPitch?: boolean;
        };
        el.preservesPitch = true;
        el.mozPreservesPitch = true;
        el.webkitPreservesPitch = true;

        audio.defaultPlaybackRate = playbackRate;
        audio.playbackRate = playbackRate;
        await audio.play();
        setIsPlaying(true);
        startLoop();
      } catch {
        setIsPlaying(false);
      }
    },
    [fetchChunk, startLoop, stopLoop, playbackRate],
  );

  const play = useCallback(() => {
    const chunk = chunksRef.current[indexRef.current];
    void playFrom(indexRef.current, chunk?.audio?.currentTime ?? 0);
  }, [playFrom]);

  const pause = useCallback(() => {
    const chunk = chunksRef.current[indexRef.current];
    chunk?.audio?.pause();
    setIsPlaying(false);
    // Oprim bucla, deci si animatia textului ingheata EXACT aici.
    stopLoop();
  }, [stopLoop]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  /** Cautare pe bara de progres, in secunde globale */
  const seek = useCallback(
    (seconds: number) => {
      let remaining = Math.max(0, seconds);
      for (let i = 0; i < chunksRef.current.length; i++) {
        const d = chunksRef.current[i].duration || chunksRef.current[i].text.length / 14;
        if (remaining < d) {
          // Oprim bucata curenta inainte sa sarim in alta
          const cur = chunksRef.current[indexRef.current];
          if (cur?.audio && indexRef.current !== i) cur.audio.pause();
          void playFrom(i, remaining);
          return;
        }
        remaining -= d;
      }
    },
    [playFrom],
  );

  // Pornim automat cand vocea e gata
  useEffect(() => {
    if (isReady) void playFrom(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    isReady,
    isPlaying,
    error,
    words: allWords,
    spokenCount,
    elapsed,
    total,
    play,
    pause,
    toggle,
    seek,
  };
}

export default useVoiceSyncedText;
