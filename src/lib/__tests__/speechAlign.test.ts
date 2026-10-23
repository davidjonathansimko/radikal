import { alignFromChannel } from '../speechAlign';
import { wordWeight } from '@/hooks/useVoiceSyncedText';

// Vorbire sintetica: bucati de zgomot cu pauze la punctuatie; timpii reali nu urmeaza exact greutatile.
function makeSpeech(text: string, rate: number, seed = 7) {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const words = text.split(' ').map((w) => ({ text: w, weight: wordWeight(w) }));
  const segs: { from: number; to: number }[] = [];
  const centers: number[] = [];
  let t = 0.3; // liniste la inceput
  for (const w of words) {
    const dur = (0.05 + w.weight * 0.012) * (0.7 + rnd() * 0.6); // ±30% fata de greutate
    segs.push({ from: t, to: t + dur });
    centers.push(t + dur / 2);
    t += dur;
    if (/[.!?]$/.test(w.text)) t += 0.55;
    else if (/[,;:]$/.test(w.text)) t += 0.28;
  }
  const total = t + 0.4;
  const ch = new Float32Array(Math.floor(total * rate));
  for (const sg of segs) {
    for (let i = Math.floor(sg.from * rate); i < Math.floor(sg.to * rate); i++) ch[i] = (rnd() - 0.5) * 0.6;
  }
  return { words, ch, centers };
}

describe('speechAlign', () => {
  const text =
    'Geht durch die enge Pforte. Denn die Pforte ist weit und der Weg ist breit, der ins Verderben führt, und viele sind es, die auf ihm gehen. ' +
    'Aber eng ist das Tor und schmal der Weg, der zum Leben führt, und wenige sind es, die ihn finden. ' +
    'Ich wollte unbedingt verstehen, wie die Dinge in den Anfängen des Christentums waren, denn dies kann das Wesen unseres Glaubens ausmachen. ' +
    'Ich habe ein wichtiges Detail entdeckt: In den ersten Jahren nannten sich die ersten Gläubigen nicht Christen. Sie nannten sich Der Weg.';

  it('aliniaza cuvintele cu pauzele reale', () => {
    const { words, ch, centers } = makeSpeech(text, 8000);
    const times = alignFromChannel(ch, 8000, words);
    expect(times).not.toBeNull();
    const errs = times!.map((t, i) => Math.abs(t - centers[i]));
    const within = errs.filter((e) => e < 0.35).length / errs.length;
    expect(within).toBeGreaterThan(0.9);
  });

  it('timpii cresc mereu', () => {
    const { words, ch } = makeSpeech(text, 8000, 21);
    const times = alignFromChannel(ch, 8000, words)!;
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
  });

  it('intoarce null cand nu exista pauze', () => {
    const ch = new Float32Array(8000 * 20).map(() => Math.random() * 0.4 - 0.2);
    const words = text.split(' ').map((w) => ({ text: w, weight: wordWeight(w) }));
    expect(alignFromChannel(ch, 8000, words)).toBeNull();
  });
});
