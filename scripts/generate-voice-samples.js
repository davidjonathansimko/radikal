/**
 * Generates .mp3 samples so you can listen and pick a voice.
 *
 *   node scripts/generate-voice-samples.js            (ro, de, en, ru)
 *   node scripts/generate-voice-samples.js ro
 *
 * Focus: ALL male Chirp3-HD voices per language (the chosen tier),
 *        plus Studio samples where they exist, for A/B comparison.
 *
 * Output: _local/samples/<lang>/<NN>-<voice>.mp3
 *
 * Cost: ~145 characters per sample, ~55 samples => ~8.000 characters,
 *       i.e. 0,8% of the free monthly tier. Effectively free.
 *
 * The API key is read from .env.local and is never printed.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readKey() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*GOOGLE_CLOUD_TTS_API_KEY\s*=\s*(.+)\s*$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  throw new Error('GOOGLE_CLOUD_TTS_API_KEY not found in .env.local');
}

// A sentence long enough to judge rhythm, intonation and warmth.
// IMPORTANT: always use correct diacritics / native script. Stripping them
// (e.g. "Pastorul" instead of "Păstorul") makes ANY voice sound wrong.
const TEXTS = {
  de: 'Ich habe ein großes Werk zu tun, ich bin beschäftigt. Wenn ich die Arbeit jetzt ruhen ließe, würde sie aufhören...',
  en: 'I am doing a great work, and I am busy. If I were to leave the work now, it would cease...',
  ro: 'Am o mare lucrare de făcut, sunt ocupat. De aș lăsa lucrul acum, acesta ar înceta...',
  ru: 'Я занят большим делом; я не могу сойти. Дело остановится, если я оставлю его...',
};

// All MALE Chirp3-HD voices, verified against the live voice list (18 Aug 2026).
const CHIRP3_MALE = [
  'Achird', 'Algenib', 'Algieba', 'Alnilam', 'Charon', 'Enceladus',
  'Fenrir', 'Iapetus', 'Orus', 'Puck', 'Rasalgethi', 'Sadachbia',
  'Sadaltager', 'Schedar', 'Umbriel', 'Zubenelgenubi',
];

// ru-RU only ships a subset of the Chirp3-HD roster.
const CHIRP3_MALE_RU = ['Charon', 'Fenrir', 'Orus', 'Puck'];

// Studio voices, included purely for A/B comparison.
// WARNING: Studio free tier is 100.000 chars/month (10x smaller) at $160/1M (10x pricier).
// The ro-RO / ru-RU entries are deliberately attempted so the run PROVES,
// with Google's own answer, that no Romanian/Russian Studio voice exists.
const STUDIO = {
  de: ['de-DE-Studio-B'],
  en: ['en-US-Studio-Q', 'en-US-Studio-O'],
  ro: ['ro-RO-Studio-A', 'ro-RO-Studio-B', 'ro-RO-Studio-C', 'ro-RO-Studio-M'],
  ru: ['ru-RU-Studio-B'],
};

const LANG_CODE = { de: 'de-DE', en: 'en-US', ro: 'ro-RO', ru: 'ru-RU' };

function buildCandidates(lang) {
  const code = LANG_CODE[lang];
  const chirpNames = lang === 'ru' ? CHIRP3_MALE_RU : CHIRP3_MALE;
  const list = chirpNames.map(function (n) {
    return { name: code + '-Chirp3-HD-' + n, tier: 'Chirp3-HD' };
  });
  STUDIO[lang].forEach(function (s) {
    list.push({ name: s, tier: 'Studio' });
  });
  return list;
}

async function synth(key, langCode, v, text) {
  const body = {
    input: { text }, // Chirp3-HD and Studio do not accept SSML
    voice: { languageCode: langCode, name: v.name },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.9,
      volumeGainDb: 0.0,
      sampleRateHertz: 24000,
      effectsProfileId: ['handset-class-device'],
    },
  };
  const res = await fetch(
    'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error('HTTP ' + res.status + ': ' + (data.error ? data.error.message : 'unknown'));
  }
  return Buffer.from(data.audioContent, 'base64');
}

async function main() {
  const key = readKey();
  const args = process.argv.slice(2);
  const langs = args.length ? args : ['ro', 'de', 'en', 'ru'];

  let chars = 0;
  let ok = 0;
  let fail = 0;

  for (const lang of langs) {
    if (!LANG_CODE[lang]) { console.log('Unknown language "' + lang + '"'); continue; }

    const dir = path.join(ROOT, '_local', 'samples', lang);
    // Clean the folder so old samples never get mixed with the new ones.
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    const list = buildCandidates(lang);
    console.log('\n=== ' + lang.toUpperCase() + '  (' + list.length + ' voices) ===');

    let i = 0;
    for (const v of list) {
      i++;
      const num = String(i).padStart(2, '0');
      try {
        const buf = await synth(key, LANG_CODE[lang], v, TEXTS[lang]);
        fs.writeFileSync(path.join(dir, num + '-' + v.name + '.mp3'), buf);
        chars += TEXTS[lang].length;
        ok++;
        console.log('  OK    ' + num + '  ' + v.tier.padEnd(10) + ' ' + v.name);
      } catch (e) {
        fail++;
        console.log('  FAIL  ' + num + '  ' + v.tier.padEnd(10) + ' ' + v.name + '  -> ' + e.message);
      }
    }
  }

  console.log('\n' + ok + ' generated, ' + fail + ' failed.');
  console.log('~' + chars + ' characters used (free tier: 1.000.000 / month for Chirp3-HD).');
  console.log('Samples: _local\\samples\\<lang>\\');
}

main().catch(function (e) { console.error(e.message); process.exit(1); });
