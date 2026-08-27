/**
 * Quick smoke test: verifies that each configured voice actually synthesizes.
 * Mirrors the request shape of src/app/api/tts/route.ts.
 *
 *   node scripts/test-tts-voices.js
 *
 * Writes .mp3 samples into _local/samples/ so you can listen and choose.
 * The API key is read from .env.local and never printed.
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

// Same profiles as the API route
const VOICES = [
  { id: 'de', languageCode: 'de-DE', name: 'de-DE-Neural2-H', ssmlGender: 'MALE', ssml: true,
    text: 'Der Herr ist mein Hirte, mir wird nichts mangeln. Er weidet mich auf einer grünen Aue.' },
  { id: 'en', languageCode: 'en-US', name: 'en-US-Neural2-D', ssmlGender: 'MALE', ssml: true,
    text: 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.' },
  { id: 'ro', languageCode: 'ro-RO', name: 'ro-RO-Chirp3-HD-Charon', ssmlGender: 'MALE', ssml: false,
    text: 'Domnul este Păstorul meu, nu voi duce lipsă de nimic. El mă paște în pășuni verzi.' },
  { id: 'ru', languageCode: 'ru-RU', name: 'ru-RU-Chirp3-HD-Charon', ssmlGender: 'MALE', ssml: false,
    text: 'Господь — Пастырь мой; я ни в чём не буду нуждаться. Он покоит меня на злачных пажитях.' },
];

function buildSSML(text) {
  let e = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  e = e.replace(/([.!?])\s+/g, '$1<break time="250ms"/> ');
  e = e.replace(/([,;:])\s+/g, '$1<break time="120ms"/> ');
  return `<speak>${e}</speak>`;
}

async function main() {
  const key = readKey();
  const outDir = path.join(ROOT, '_local', 'samples');
  fs.mkdirSync(outDir, { recursive: true });

  for (const v of VOICES) {
    const body = {
      input: v.ssml ? { ssml: buildSSML(v.text) } : { text: v.text },
      voice: { languageCode: v.languageCode, name: v.name, ssmlGender: v.ssmlGender },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9,
        ...(v.ssml && { pitch: 0.0 }),
        volumeGainDb: 0.0,
        sampleRateHertz: 24000,
        effectsProfileId: ['handset-class-device'],
      },
    };

    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.log(`[${v.id}] FAIL  ${v.name}  HTTP ${res.status}`);
      console.log(`        ${data && data.error ? data.error.message : 'unknown error'}`);
      continue;
    }

    const file = path.join(outDir, `${v.id}-${v.name}.mp3`);
    fs.writeFileSync(file, Buffer.from(data.audioContent, 'base64'));
    console.log(`[${v.id}] OK    ${v.name}  ->  _local/samples/${path.basename(file)}`);
  }

  console.log('\nDone. Open the _local\\samples folder and listen.');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
