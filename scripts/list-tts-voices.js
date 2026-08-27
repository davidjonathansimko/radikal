/**
 * List every Google Cloud TTS voice available to YOUR API key.
 *
 * Why this exists: voice availability changes over time and differs per
 * language. Instead of hardcoding guesses, ask Google directly.
 *
 * Usage:
 *   node scripts/list-tts-voices.js            -> languages we care about
 *   node scripts/list-tts-voices.js all        -> every language
 *   node scripts/list-tts-voices.js de ro      -> only these
 *
 * Reads GOOGLE_CLOUD_TTS_API_KEY from .env.local (never printed).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ---- Load API key from .env.local without extra dependencies ----
function readApiKey() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local not found at', envPath);
    process.exit(1);
  }
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith('GOOGLE_CLOUD_TTS_API_KEY='));
  if (!line) {
    console.error('ERROR: GOOGLE_CLOUD_TTS_API_KEY not found in .env.local');
    process.exit(1);
  }
  return line.split('=').slice(1).join('=').trim();
}

function fetchVoices(apiKey) {
  return new Promise((resolve, reject) => {
    https
      .get(
        `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`,
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch {
              reject(new Error('Invalid JSON from Google: ' + data.slice(0, 300)));
            }
          });
        }
      )
      .on('error', reject);
  });
}

// Quality ranking: higher number = more human-sounding.
function tierOf(name) {
  if (/Chirp3-HD|Chirp-3-HD/i.test(name)) return { tier: 'Chirp3-HD', rank: 5 };
  if (/Chirp/i.test(name)) return { tier: 'Chirp-HD', rank: 4 };
  if (/Studio/i.test(name)) return { tier: 'Studio', rank: 6 };
  if (/Polyglot/i.test(name)) return { tier: 'Polyglot', rank: 3 };
  if (/Neural2/i.test(name)) return { tier: 'Neural2', rank: 3 };
  if (/Wavenet/i.test(name)) return { tier: 'WaveNet', rank: 2 };
  if (/News/i.test(name)) return { tier: 'News', rank: 2 };
  if (/Standard/i.test(name)) return { tier: 'Standard', rank: 1 };
  return { tier: 'Other', rank: 0 };
}

// Languages the blog actually uses.
const DEFAULT_LANGS = ['de', 'en', 'ro', 'ru'];

(async () => {
  const args = process.argv.slice(2);
  const showAll = args.includes('all');
  const langs = args.filter((a) => a !== 'all');
  const wanted = showAll ? null : (langs.length ? langs : DEFAULT_LANGS);

  const apiKey = readApiKey();
  const { status, body } = await fetchVoices(apiKey);

  if (status !== 200) {
    console.error(`\nGoogle returned HTTP ${status}`);
    console.error('Message :', body?.error?.message || '(none)');
    console.error('Reason  :', body?.error?.details?.[0]?.reason || '(none)');
    console.error('\nIf reason is BILLING_DISABLED -> activate billing first.\n');
    process.exit(1);
  }

  const voices = body.voices || [];
  console.log(`\nTotal voices available to your key: ${voices.length}\n`);

  // Group by base language code (de, en, ro, ru, ...)
  const byLang = new Map();
  for (const v of voices) {
    for (const code of v.languageCodes) {
      const base = code.split('-')[0];
      if (wanted && !wanted.includes(base)) continue;
      if (!byLang.has(code)) byLang.set(code, []);
      byLang.get(code).push(v);
    }
  }

  const sortedCodes = [...byLang.keys()].sort();
  for (const code of sortedCodes) {
    const list = byLang
      .get(code)
      .map((v) => ({ ...v, ...tierOf(v.name) }))
      .sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));

    console.log('='.repeat(70));
    console.log(`  ${code}   (${list.length} voices)`);
    console.log('='.repeat(70));

    for (const v of list) {
      const star = v.rank >= 4 ? ' <-- HIGH QUALITY' : '';
      console.log(
        `  ${v.tier.padEnd(10)} ${v.ssmlGender.padEnd(7)} ${v.name}${star}`
      );
    }

    // Best MALE voice suggestion (site currently uses male voices)
    const bestMale = list.find((v) => v.ssmlGender === 'MALE');
    if (bestMale) {
      console.log(`\n  >> Best MALE for ${code}: ${bestMale.name} (${bestMale.tier})`);
    }
    console.log('');
  }

  console.log('NOTE ON SSML SUPPORT:');
  console.log('  Studio / Chirp voices have limited or no SSML + pitch support.');
  console.log('  The /api/tts route must send plain text (not SSML) for those.\n');
})().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
