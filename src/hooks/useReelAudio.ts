// Pasul 21082026 — Muzica de fundal pentru Reels, cu bucla FARA taietura
//
// PROBLEMA:
//   Un <audio loop> normal taie brusc la sfarsit si reporneste brusc.
//   Daca melodia are 10 secunde si reel-ul sta deschis 60 de secunde,
//   auzi 6 "opriri" suparatoare.
//
// SOLUTIA (crossfade cu doua surse):
//   Folosim DOUA elemente <audio> care se alterneaza. Cu ~1 secunda inainte
//   ca prima sa se termine, pornim a doua si facem crossfade:
//     - prima coboara in volum spre 0
//     - a doua urca de la 0 la volumul tinta
//   Rezultatul curge continuu, cat timp reel-ul este deschis.
//
// Respectam si politica browserelor: audio-ul porneste doar dupa o
// interactiune a utilizatorului (deschiderea modalului este suficienta
// in majoritatea cazurilor; daca nu, esuam elegant, fara eroare).

'use client';

import { useCallback, useEffect, useRef } from 'react';

/** Cat dureaza tranzitia intre cele doua surse (secunde) */
const CROSSFADE_S = 1.0;
/** Cat de des verificam pozitia (ms) */
const TICK_MS = 100;

export function useReelAudio() {
  const aRef = useRef<HTMLAudioElement | null>(null);
  const bRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<'a' | 'b'>('a');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetVolumeRef = useRef(0.6);
  const isSwappingRef = useRef(false);
  const currentUrlRef = useRef<string | null>(null);

  // -------------------------------------------------------------------
  // Pasul 2308003 — DE CE uneori nu se auzea muzica
  // -------------------------------------------------------------------
  // `stop()` stinge sunetul lin, pe parcursul a ~300ms, cu un `setInterval`.
  // La final acel interval face `pause()`.
  // Daca intre timp userul intra din nou in reels sau deruleaza repede,
  // `play()` pornea melodia noua — dar intervalul VECHI inca rula, ii ducea
  // volumul la 0 si apoi ii dadea `pause()`. Rezultat: reel cu muzica,
  // dar tacere. Se intampla doar cand actiunile erau apropiate in timp,
  // de aceea parea „uneori".
  //
  // Solutia: tinem minte TOATE intervalele de fade si le anulam inainte
  // de orice pornire noua.
  const fadeIdsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearFades = useCallback(() => {
    fadeIdsRef.current.forEach(clearInterval);
    fadeIdsRef.current = [];
  }, []);

  /** Porneste un fade si il inregistreaza, ca sa poata fi anulat */
  const registerFade = useCallback((id: ReturnType<typeof setInterval>) => {
    fadeIdsRef.current.push(id);
    return id;
  }, []);

  // Cream elementele o singura data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const make = () => {
      const el = new Audio();
      el.preload = 'auto';
      el.loop = false; // bucla o gestionam noi, manual, cu crossfade
      el.volume = 0;
      el.crossOrigin = 'anonymous';
      return el;
    };

    aRef.current = make();
    bRef.current = make();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      [aRef.current, bRef.current].forEach((el) => {
        if (!el) return;
        el.pause();
        el.src = '';
      });
      aRef.current = null;
      bRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearFades();
    currentUrlRef.current = null;
    isSwappingRef.current = false;

    // Stingem lin, ca sa nu se auda o taietura brusca la iesire
    const fadeOut = (el: HTMLAudioElement | null) => {
      if (!el) return;
      const startVolume = el.volume;
      const steps = 12;
      let i = 0;
      const id = setInterval(() => {
        i += 1;
        el.volume = Math.max(0, startVolume * (1 - i / steps));
        if (i >= steps) {
          clearInterval(id);
          el.pause();
          el.currentTime = 0;
        }
      }, 25);
      registerFade(id);
    };

    fadeOut(aRef.current);
    fadeOut(bRef.current);
  }, [clearFades, registerFade]);

  /**
   * Porneste (sau schimba) muzica de fundal.
   * @param url    adresa fisierului audio; `null` opreste muzica
   * @param volume 0..100
   */
  const play = useCallback(
    (url: string | null, volume = 60) => {
      const a = aRef.current;
      const b = bRef.current;
      if (!a || !b) return;

      if (!url) {
        stop();
        return;
      }

      targetVolumeRef.current = Math.min(1, Math.max(0, volume / 100));

      // Acelasi cantec ruleaza deja -> doar ajustam volumul
      // ATENTIE: verificam si ca elementul chiar canta. Daca a fost oprit
      // intre timp (fade-out incheiat), trebuie sa il pornim din nou,
      // altfel ramaneam cu „acelasi url" dar fara sunet.
      const activeEl = activeRef.current === 'a' ? a : b;
      if (currentUrlRef.current === url && !activeEl.paused) {
        if (!isSwappingRef.current) activeEl.volume = targetVolumeRef.current;
        return;
      }

      currentUrlRef.current = url;
      if (timerRef.current) clearInterval(timerRef.current);
      clearFades(); // anulam orice fade-out ramas din reel-ul anterior
      isSwappingRef.current = false;

      // Pregatim ambele surse cu aceeasi melodie
      a.src = url;
      b.src = url;
      a.currentTime = 0;
      b.currentTime = 0;
      b.pause();
      b.volume = 0;

      activeRef.current = 'a';
      a.volume = 0;

      a.play()
        .then(() => {
          // Intrare lina (fade in), nu brusc
          const steps = 15;
          let i = 0;
          const id = setInterval(() => {
            i += 1;
            a.volume = Math.min(targetVolumeRef.current, targetVolumeRef.current * (i / steps));
            if (i >= steps) clearInterval(id);
          }, 30);
          registerFade(id);
        })
        .catch(() => {
          // Browserul a blocat redarea automata — ignoram elegant
        });

      // Bucla cu crossfade
      timerRef.current = setInterval(() => {
        const current = activeRef.current === 'a' ? a : b;
        const next = activeRef.current === 'a' ? b : a;

        if (!current.duration || Number.isNaN(current.duration)) return;

        const remaining = current.duration - current.currentTime;

        // A mai ramas ~1 secunda -> pornim urmatoarea si facem crossfade
        if (remaining <= CROSSFADE_S && !isSwappingRef.current) {
          isSwappingRef.current = true;

          next.currentTime = 0;
          next.volume = 0;
          next.play().catch(() => {});

          const target = targetVolumeRef.current;
          const steps = Math.max(1, Math.round((CROSSFADE_S * 1000) / 40));
          let i = 0;

          const fadeId = setInterval(() => {
            i += 1;
            const t = Math.min(1, i / steps);
            // Curbe egale de putere -> volumul perceput ramane constant
            current.volume = Math.max(0, target * Math.cos((t * Math.PI) / 2));
            next.volume = Math.min(target, target * Math.sin((t * Math.PI) / 2));

            if (t >= 1) {
              clearInterval(fadeId);
              current.pause();
              current.currentTime = 0;
              current.volume = 0;
              next.volume = target;
              activeRef.current = activeRef.current === 'a' ? 'b' : 'a';
              isSwappingRef.current = false;
            }
          }, 40);
          registerFade(fadeId);
        }
      }, TICK_MS);
    },
    [stop, clearFades, registerFade]
  );

  return { play, stop };
}

export default useReelAudio;
