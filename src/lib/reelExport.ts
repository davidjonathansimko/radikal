// Pasul 2308005 (E) — EXPORT VIDEO pentru YouTube / Shorts
//
// De ce exista fisierul acesta?
// Ai cerut sa poti descarca un reel „curat": doar imaginea, efectele vizuale,
// textul si muzica — FARA butonul X din dreapta sus, fara inimioara de like,
// fara sageata de derulare si fara numarul reel-ului.
//
// Cum functioneaza, pe scurt:
//   1. Desenam fiecare cadru pe un <canvas> ascuns de 1080x1920 (formatul
//      vertical cerut de YouTube Shorts / Instagram / TikTok).
//   2. `canvas.captureStream()` transforma desenul intr-o pista video.
//   3. Muzica trece printr-un AudioContext si devine o pista audio.
//   4. `MediaRecorder` lipeste cele doua piste intr-un singur fisier .webm.
//
// IMPORTANT: nu folosim „poza de ecran" a paginii, ci redesenam totul de la
// zero. Asa suntem siguri ca in video nu apare NICIUN buton al aplicatiei.
//
// Nota despre format: browserul stie sa scrie .webm, nu .mp4. YouTube accepta
// .webm fara nicio problema, deci il poti incarca direct.

// Impartirea pe fraze o face acelasi cod ca in aplicatie, ca sa arate identic.
import { paginateText } from './paginateText';

export interface ReelExportEffects {  backgroundOpacity: number;   // 0–100
  effectBw?: boolean;
  effectSepia?: boolean;
  sepiaIntensity?: number;     // 0–100
  effectVignette?: boolean;
  vignetteIntensity?: number;  // 0–100
  effectGrain?: boolean;
  grainOpacity?: number;       // 0–100
  effectNoise?: boolean;
  effectBloom?: boolean;
  effectLightLeak?: boolean;
  effectLetterbox?: boolean;
}

export interface ReelExportOptions {
  content: string;
  reference?: string | null;
  backgroundImageUrl?: string | null;
  audioUrl?: string | null;
  effects: ReelExportEffects;
  /** Cat dureaza clipul, in secunde (implicit: calculat din text) */
  durationSec?: number;
  /**
   * Randurile alese de tine, manual, in admin. Daca lipsesc, textul este
   * impartit automat pe fraze (fara sa taie sensul la mijloc).
   */
  manualPages?: string[] | null;
  /** true = text doar cu MAJUSCULE (asa cum arata Cinzel pe site) */
  uppercase?: boolean;
  /** Ne anunta cu un procent 0–100, ca sa putem arata o bara de progres */
  onProgress?: (percent: number) => void;
}

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

/**
 * Fontul textului — EXACT stiva din aplicatie (`.font-cinzel`).
 * Prima versiune cerea doar „Cinzel", care este un font DOAR cu majuscule.
 * De aceea videoul iesea cu litere mari de tipar, desi pe ecran reel-ul se
 * vede cu litere mici. Georgia este ce se aplica in realitate.
 */
const TEXT_FONT = "Georgia, 'Times New Roman', serif";

// ------------------------------------------------------------------
// ANIMATIA — copiata 1:1 din ReelsModal.tsx
// ------------------------------------------------------------------
// Nu mai „inventam" o animatie asemanatoare. Folosim EXACT aceleasi
// numere ca timeline-ul GSAP din aplicatie, ca sa iasa identic:
const IN_DURATION = 0.8;    // cat dureaza aparitia unui cuvant
const IN_STAGGER = 0.18;    // cat sta un cuvant dupa cel dinaintea lui
const OUT_DURATION = 0.4;   // cat dureaza disparitia
const OUT_STAGGER = 0.05;
const HOLD = 2.6;           // pauza de citire pe o pagina obisnuita
const HOLD_LAST = 4.2;      // pauza pe ultima pagina
const CITE_DURATION = 1.2;  // aparitia referintei biblice

/** GSAP „power2.out" */
function power2Out(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 2);
}

/** GSAP „power2.in" */
function power2In(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x;
}

/** GSAP „power1.inOut" — folosit de stagger */
function power1InOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}


/** Incarca o imagine cu CORS pornit, ca sa nu „murdareasca" pânza (canvas). */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Imaginea de fundal nu a putut fi încărcată (CORS?).'));
    img.src = url;
  });
}

/** Imparte textul in randuri care incap in latimea data. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Deseneaza imaginea de fundal „cover" (umple tot, fara sa deformeze). */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const scale = Math.max(WIDTH / img.width, HEIGHT / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
}

/**
 * Genereaza clipul si returneaza un Blob .webm.
 * Se apeleaza DOAR din admin.
 */
export async function exportReelVideo(options: ReelExportOptions): Promise<Blob> {
  const {
    content,
    reference,
    backgroundImageUrl,
    audioUrl,
    effects,
    durationSec,
    manualPages,
    uppercase = false,
    onProgress,
  } = options;

  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    throw new Error('Exportul video nu este disponibil în acest browser.');
  }

  // Asteptam fonturile. Fara asta, primele cadre s-ar desena cu fontul
  // de rezerva al sistemului, iar textul ar „sari" la jumatatea clipului.
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nu am putut pregăti pânza de desen.');

  // Imaginea de fundal (daca exista). Daca da eroare, mergem mai departe pe negru.
  let bgImage: HTMLImageElement | null = null;
  if (backgroundImageUrl) {
    try {
      bgImage = await loadImage(backgroundImageUrl);
    } catch {
      bgImage = null;
    }
  }

  // ---- Pista video ----
  const stream = canvas.captureStream(FPS);

  // ---- Pista audio (muzica reel-ului) ----
  // Folosim un AudioContext ca sa scoatem sunetul ca pista de stream,
  // nu ca sa il auzim in casti. De aceea NU il conectam la difuzoare.
  let audioCtx: AudioContext | null = null;
  let audioEl: HTMLAudioElement | null = null;

  if (audioUrl) {
    try {
      audioEl = new Audio();
      audioEl.crossOrigin = 'anonymous';
      audioEl.src = audioUrl;
      audioEl.loop = true;

      const Ctor = window.AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
      const source = audioCtx.createMediaElementSource(audioEl);
      const destination = audioCtx.createMediaStreamDestination();
      source.connect(destination);

      destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      await audioEl.play();
    } catch {
      // Fara muzica clipul tot iese — nu oprim exportul pentru atat.
      audioEl = null;
    }
  }

  // ---- Inregistrarea ----
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });

  // ---- Paginarea textului ----
  // In aplicatie, reel-ul NU arata tot textul deodata: arata o frază, apoi
  // urmatoarea. Exportul face acum exact la fel. Daca ai ales manual randurile
  // in admin, le folosim pe acelea; altfel taiem automat, la capat de frază.
  const pages = (manualPages && manualPages.length > 0)
    ? manualPages.map((p) => p.trim()).filter(Boolean)
    : paginateText(content);

  const safePages = pages.length > 0 ? pages : [content];

  // Cat dureaza fiecare pagina — calculat cu ACELEASI formule ca in aplicatie,
  // nu ghicit. O pagina cu mai multe cuvinte sta pe ecran mai mult, exact ca
  // in reel-ul adevarat.
  const pageWordCounts = safePages.map(
    (p) => p.split(/\s+/).filter(Boolean).length || 1,
  );

  const pageDurations = pageWordCounts.map((n, i) => {
    const isLast = i === safePages.length - 1;
    const inTime = IN_DURATION + (n - 1) * IN_STAGGER;
    const outTime = OUT_DURATION + (n - 1) * OUT_STAGGER;
    return inTime + (isLast ? HOLD_LAST : HOLD) + outTime;
  });

  const naturalDuration = pageDurations.reduce((s, d) => s + d, 0);
  const totalDuration = durationSec ?? naturalDuration;

  // Momentul de start al fiecarei pagini
  const pageStarts: number[] = [];
  let acc0 = 0;
  for (const d of pageDurations) {
    pageStarts.push(acc0);
    acc0 += d;
  }

  const totalFrames = Math.round(totalDuration * FPS);

  recorder.start();

  await new Promise<void>((resolve) => {
    let frame = 0;

    const drawFrame = () => {
      const t = frame / totalFrames; // 0 → 1

      // 1) Fundal negru
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // 2) Imaginea, cu filtrele alb-negru / sepia si opacitatea aleasa
      if (bgImage) {
        const parts: string[] = [];
        if (effects.effectBw) parts.push('grayscale(1)', 'contrast(1.12)', 'brightness(1.02)');
        if (effects.effectSepia) parts.push(`sepia(${(effects.sepiaIntensity ?? 12) / 100})`);
        ctx.filter = parts.length ? parts.join(' ') : 'none';
        ctx.globalAlpha = Math.min(100, Math.max(0, effects.backgroundOpacity)) / 100;
        drawCover(ctx, bgImage);
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
      }

      // 3) Bloom — un halou cald care „respira", exact ca pe site
      if (effects.effectBloom) {
        const breathe = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * (totalDuration / 7));
        const g = ctx.createRadialGradient(
          WIDTH / 2, HEIGHT * 0.42, 0,
          WIDTH / 2, HEIGHT * 0.42, WIDTH * 0.75,
        );
        g.addColorStop(0, `rgba(255, 224, 178, ${0.10 + 0.05 * breathe})`);
        g.addColorStop(1, 'rgba(255, 224, 178, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      // 4) Light leak — o dâră de lumina care se plimba incet
      if (effects.effectLightLeak) {
        const drift = (t * (totalDuration / 14)) % 1;
        const g = ctx.createLinearGradient(
          WIDTH * (drift - 0.3), 0,
          WIDTH * (drift + 0.7), HEIGHT,
        );
        g.addColorStop(0, 'rgba(255, 170, 90, 0)');
        g.addColorStop(0.45, 'rgba(255, 170, 90, 0.16)');
        g.addColorStop(1, 'rgba(255, 170, 90, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      // 5) Granulatie / zgomot — puncte aleatoare, refacute la fiecare cadru
      if (effects.effectGrain || effects.effectNoise) {
        const strength = effects.effectGrain ? (effects.grainOpacity ?? 25) / 100 : 0.12;
        // Desenam putine puncte, dar mari — arata la fel si nu incetineste redarea
        ctx.globalAlpha = strength * 0.5;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 900; i++) {
          ctx.fillRect(Math.random() * WIDTH, Math.random() * HEIGHT, 2, 2);
        }
        ctx.globalAlpha = 1;
      }

      // 6) Vignette — colturile mai intunecate
      if (effects.effectVignette) {
        const strength = (effects.vignetteIntensity ?? 45) / 100;
        const g = ctx.createRadialGradient(
          WIDTH / 2, HEIGHT / 2, HEIGHT * 0.2,
          WIDTH / 2, HEIGHT / 2, HEIGHT * 0.62,
        );
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(0,0,0,${strength})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      // 7) TEXTUL — animatie IDENTICA cu cea din aplicatie
      //
      // Fiecare cuvant are propriul lui moment de start (stagger 0,18 s) si
      // isi face singur drumul: opacitate 0 → 1, blur 10px → 0, urca 8px si
      // aluneca 15px dinspre stanga. Exact ce face GSAP in ReelsModal.
      //
      // FOARTE IMPORTANT: un cuvant care nu a inceput inca are opacitatea 0,
      // adica este INVIZIBIL. Inainte il desenam la 0,16 si de aceea se vedea
      // „locul gol care asteapta sa fie umplut" — tocmai ce nu voiai.
      const now = t * totalDuration;

      let pageIndex = 0;
      for (let i = 0; i < pageStarts.length; i++) {
        if (now >= pageStarts[i]) pageIndex = i;
      }
      const isLastPage = pageIndex === safePages.length - 1;
      const pageTime = now - pageStarts[pageIndex];

      const rawPage = safePages[pageIndex];
      const pageText = uppercase ? rawPage.toLocaleUpperCase('ro-RO') : rawPage;

      ctx.textBaseline = 'middle';
      // Marimile sunt scalate din reel-ul real de pe telefon catre 1080x1920
      ctx.font = `italic 66px ${TEXT_FONT}`;

      const maxWidth = WIDTH * 0.795;
      const lines = wrapText(ctx, pageText, maxWidth);
      const lineHeight = 108;
      const startY = HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2;

      const nWords = pageText.split(/\s+/).filter(Boolean).length || 1;
      const inTime = IN_DURATION + (nWords - 1) * IN_STAGGER;
      const holdEnd = inTime + (isLastPage ? HOLD_LAST : HOLD);

      let wordIndex = 0;

      lines.forEach((line, i) => {
        const lineWords = line.split(' ');
        const lineWidth = ctx.measureText(line).width;
        let x = WIDTH / 2 - lineWidth / 2;
        const y = startY + i * lineHeight;

        for (const w of lineWords) {
          const wWidth = ctx.measureText(`${w} `).width;

          // --- Aparitia (stagger cu ease power1.inOut, ca in GSAP) ---
          const staggerPos = nWords > 1 ? wordIndex / (nWords - 1) : 0;
          const inStart = power1InOut(staggerPos) * (nWords - 1) * IN_STAGGER;
          const inProgress = power2Out((pageTime - inStart) / IN_DURATION);

          // --- Disparitia: cuvintele pleaca in ordine INVERSA ---
          const outOrder = nWords - 1 - wordIndex;
          const outStart = holdEnd + outOrder * OUT_STAGGER;
          const outProgress = power2In((pageTime - outStart) / OUT_DURATION);

          const opacity = inProgress * (1 - outProgress);

          // Cuvantul inca nu a inceput sau a plecat deja -> nu il desenam deloc
          if (opacity <= 0.001) {
            x += wWidth;
            wordIndex++;
            continue;
          }

          // blur 10px → 0 la intrare, 0 → 12px la iesire
          const blur = 10 * (1 - inProgress) + 12 * outProgress;
          // y: 8px in jos → 0 ;  x: 15px la stanga → 0 → 30px la dreapta
          const dy = 8 * (1 - inProgress);
          const dx = -15 * (1 - inProgress) + 30 * outProgress;

          ctx.globalAlpha = opacity;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';

          // Canvas nu are „blur" pe text. Il imitam printr-o umbra fara
          // deplasare — arata la fel ca `filter: blur()` din CSS.
          if (blur > 0.3) {
            ctx.shadowColor = `rgba(255,255,255,${opacity * 0.75})`;
            ctx.shadowBlur = blur * 2.4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.globalAlpha = opacity * 0.35;
            ctx.fillText(w, x + dx, y + dy);
            ctx.globalAlpha = opacity;
          }

          // Umbra neagra de lizibilitate, ca pe fundal deschis textul sa se vada
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 18;
          ctx.fillText(w, x + dx, y + dy);
          ctx.shadowBlur = 0;

          x += wWidth;
          wordIndex++;
        }
      });

      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';

      // 8) Referinta biblica — doar pe ULTIMA pagina, ca in aplicatie.
      //    Intra cu 0,8 s inainte sa se termine aparitia cuvintelor.
      if (reference && reference.trim() && isLastPage) {
        const citeStart = Math.max(0, inTime - 0.8);
        const citeIn = power2Out((pageTime - citeStart) / CITE_DURATION);
        const citeOut = power2In((pageTime - holdEnd) / 0.5);
        const citeAlpha = citeIn * (1 - citeOut);

        if (citeAlpha > 0.001) {
          const citeDy = 15 * (1 - citeIn) + 15 * citeOut;
          ctx.globalAlpha = citeAlpha;
          ctx.font = `600 40px ${TEXT_FONT}`;
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 14;
          ctx.fillText(
            uppercase ? reference.toLocaleUpperCase('ro-RO') : reference,
            WIDTH / 2,
            startY + lines.length * lineHeight + 46 + citeDy,
          );
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }

      // 9) Barele cinema — mereu ULTIMELE, ca sa stea peste tot
      if (effects.effectLetterbox) {
        const bar = HEIGHT * 0.08;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, WIDTH, bar);
        ctx.fillRect(0, HEIGHT - bar, WIDTH, bar);
      }

      // 10) Fade-in la inceput si fade-out la final — finisaj profesional
      const fade = 0.06;
      let dark = 0;
      if (t < fade) dark = 1 - t / fade;
      else if (t > 1 - fade) dark = 1 - (1 - t) / fade;
      if (dark > 0) {
        ctx.fillStyle = `rgba(0,0,0,${dark})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      frame++;
      onProgress?.(Math.min(100, Math.round((frame / totalFrames) * 100)));

      if (frame >= totalFrames) {
        resolve();
        return;
      }
      setTimeout(drawFrame, 1000 / FPS);
    };

    drawFrame();
  });

  recorder.stop();

  // Curatenie: oprim muzica si eliberam resursele.
  if (audioEl) {
    audioEl.pause();
    audioEl.src = '';
  }
  if (audioCtx) {
    await audioCtx.close().catch(() => undefined);
  }
  stream.getTracks().forEach((track) => track.stop());

  return finished;
}

/**
 * Numele fisierului descarcat.
 *
 * Exemplu: buildReelVideoName('R09', 'Pavel', '2026-08-23')
 *          -> „radikal-r09-pavel-230826.webm"
 *
 * Titlul este cel pe care il scrii tu in admin. Nu se vede nicaieri in
 * aplicatie — exista doar ca sa te descurci mai usor prin lista si ca
 * fisierele descarcate sa aiba nume cu inteles, nu „radikal-r09".
 */
export function buildReelVideoName(
  tag: string,
  title?: string | null,
  createdAt?: string | null,
  lang?: string | null,
): string {
  const safeTag = (tag.replace(/[^a-zA-Z0-9-]/g, '') || 'reel').toLowerCase();

  // Diacriticele romanesti/germane devin litere simple, ca numele
  // fisierului sa functioneze pe orice sistem (Windows, Mac, Android).
  const safeTitle = (title ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  // Data in forma scurta: 23 august 2026 -> „230826"
  const d = createdAt ? new Date(createdAt) : new Date();
  const valid = !Number.isNaN(d.getTime()) ? d : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${pad(valid.getDate())}${pad(valid.getMonth() + 1)}${String(valid.getFullYear()).slice(-2)}`;

  const parts = ['radikal', safeTag, safeTitle, lang ?? '', stamp].filter(Boolean);
  return `${parts.join('-')}.webm`;
}

/** Declanseaza descarcarea unui Blob in browser. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Eliberam memoria dupa ce browserul a apucat sa porneasca descarcarea.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
