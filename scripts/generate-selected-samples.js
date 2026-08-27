/**
 * FINAL SHORTLIST — generates longer samples for the voices you preselected,
 * so you can judge them on a real paragraph instead of a single sentence.
 *
 *   node scripts/generate-selected-samples.js
 *   node scripts/generate-selected-samples.js ro
 *
 * Output: _local/samples_select/<lang>/<NN>-<voice>.mp3
 *
 * Tier: Chirp3-HD only (decision made — Studio dropped: it does not exist for
 * ro-RO / ru-RU and costs 10x more with a 10x smaller free tier).
 *
 * Cost: ~1.100 characters per sample x 15 samples = ~16.500 characters,
 *       i.e. 1,6% of the free monthly tier (1.000.000). Effectively free.
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

// Nehemiah 6:3 devotional paragraph.
// IMPORTANT: correct diacritics / native script are essential — stripping them
// makes ANY voice mispronounce words ("pastorul" instead of "păstorul").
const TEXTS = {
  ro: 'Am o mare lucrare de făcut. Sunt ocupat. Dacă aș lăsa lucrul acum, acesta ar înceta. Zidurile au fost zdrobite, zidul a fost zdrobit, toate spărturile au fost astupate, iar acum vrăjmașii caută să-i facă rău lui Neemia. Dar de ce? Aceștia doreau să îl oprească, să îl saboteze, să îl aducă în punctul în care lucrul pe care îl avea de făcut să fie lăsat nefăcut și încetat! Dar oare nu este și la noi la fel, pe plan spiritual? Când lucrăm cu spor și cu har să zidim zidurile cetății, să zidim spărturile, oare nu și la noi, de asemenea, încearcă vrăjmașul să ne facă rău, să ne oprească din lucru? Depinde însă de noi, de cum reacționăm în fața atacurilor vrăjmașului și de felul în care ne comportăm. Neemia a fost înțelept în răspunsul și în acțiunile sale în fața încercărilor vrăjmașilor de a-l opri din lucrul lui. Dar noi?',

  de: 'Ich habe ein großes Werk zu tun. Ich bin beschäftigt. Wenn ich die Arbeit jetzt ruhen ließe, würde sie aufhören. Die Mauern waren zerstört, die Mauer war zerbrochen, alle Lücken wurden geschlossen, und nun suchen die Feinde, Nehemia Schaden zuzufügen. Aber warum? Sie wollten ihn aufhalten, ihn sabotieren, ihn an den Punkt bringen, an dem das Werk, das er zu tun hatte, ungetan bleiben und aufhören würde! Aber ist es nicht auch bei uns so, im geistlichen Bereich? Wenn wir mit Eifer und mit Gnade arbeiten, um die Mauern der Stadt zu bauen, um die Lücken zu schließen, versucht dann nicht auch bei uns der Feind, uns Schaden zuzufügen, uns von der Arbeit abzuhalten? Es hängt jedoch von uns ab, wie wir auf die Angriffe des Feindes reagieren und wie wir uns verhalten. Nehemia war weise in seiner Antwort und in seinem Handeln angesichts der Versuche der Feinde, ihn von seiner Arbeit abzuhalten. Aber wir?',

  en: 'I am doing a great work. I am busy. If I were to leave the work now, it would cease. The walls had been broken down, the wall was shattered, all the gaps were closed, and now the enemies seek to harm Nehemiah. But why? They wanted to stop him, to sabotage him, to bring him to the point where the work he had to do would be left undone and would cease! But is it not the same with us, on a spiritual level? When we labour with diligence and with grace to build the walls of the city, to rebuild the gaps, does not the enemy also try to harm us, to stop us from working? It depends, however, on us, on how we react in the face of the enemy attacks and on the way we conduct ourselves. Nehemiah was wise in his answer and in his actions in the face of the attempts of the enemies to stop him from his work. But what about us?',

  ru: 'Я занят большим делом. Я не могу сойти. Если бы я оставил работу сейчас, она бы прекратилась. Стены были разрушены, стена была разбита, все проломы были заделаны, и теперь враги ищут причинить зло Неемии. Но почему? Они хотели остановить его, саботировать его, довести его до того, чтобы дело, которое ему надлежало совершить, осталось несделанным и прекратилось! Но разве не так же и у нас, в духовной области? Когда мы трудимся усердно и с благодатью, чтобы строить стены города, чтобы заделывать проломы, разве враг не пытается и нам причинить зло, остановить нас от работы? Однако это зависит от нас, от того, как мы реагируем перед лицом нападений врага и как мы себя ведём. Неемия был мудр в своём ответе и в своих действиях перед лицом попыток врагов остановить его от его работы. А мы?',
};

// Your shortlist, per language.
const SELECTED = {
  en: ['Algenib', 'Charon', 'Enceladus', 'Iapetus', 'Rasalgethi'],
  ro: ['Algieba', 'Charon', 'Enceladus', 'Iapetus', 'Algenib'],
  de: ['Alnilam', 'Charon', 'Iapetus', 'Schedar'],
  ru: ['Charon'],
};

const LANG_CODE = { de: 'de-DE', en: 'en-US', ro: 'ro-RO', ru: 'ru-RU' };

async function synthOnce(key, langCode, voiceName, text, timeoutMs) {
  const body = {
    input: { text }, // Chirp3-HD does not accept SSML
    voice: { languageCode: langCode, name: voiceName },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.9,
      volumeGainDb: 0.0,
      sampleRateHertz: 24000,
      effectsProfileId: ['handset-class-device'],
    },
  };

  // Long Chirp3-HD requests can hang indefinitely -> always bound them.
  const ac = new AbortController();
  const timer = setTimeout(function () { ac.abort(); }, timeoutMs);
  try {
    const res = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ac.signal,
      }
    );
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      throw new Error('HTTP ' + res.status + ': ' + (data.error ? data.error.message : 'unknown'));
    }
    return Buffer.from(data.audioContent, 'base64');
  } finally {
    clearTimeout(timer);
  }
}

// Retry a few times: transient hangs/timeouts are common on long syntheses.
async function synth(key, langCode, voiceName, text) {
  const attempts = 3;
  for (let n = 1; n <= attempts; n++) {
    try {
      return await synthOnce(key, langCode, voiceName, text, 60000);
    } catch (e) {
      const isLast = n === attempts;
      const aborted = e.name === 'AbortError';
      // A 400 means the voice truly does not exist -> no point retrying.
      if (isLast || /HTTP 4(00|04)/.test(e.message)) {
        throw new Error(aborted ? 'timeout after 60s' : e.message);
      }
      console.log('        retry ' + n + '/' + (attempts - 1) + ' (' + (aborted ? 'timeout' : e.message) + ')');
      await new Promise(function (r) { setTimeout(r, 2000); });
    }
  }
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

    const dir = path.join(ROOT, '_local', 'samples_select', lang);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    const names = SELECTED[lang];
    const text = TEXTS[lang];
    console.log('\n=== ' + lang.toUpperCase() + '  (' + names.length + ' voices, ' + text.length + ' chars each) ===');

    let i = 0;
    for (const shortName of names) {
      i++;
      const num = String(i).padStart(2, '0');
      const voiceName = LANG_CODE[lang] + '-Chirp3-HD-' + shortName;
      try {
        const buf = await synth(key, LANG_CODE[lang], voiceName, text);
        fs.writeFileSync(path.join(dir, num + '-' + shortName + '.mp3'), buf);
        chars += text.length;
        ok++;
        console.log('  OK    ' + num + '  ' + shortName.padEnd(12) + ' -> ' + num + '-' + shortName + '.mp3');
      } catch (e) {
        fail++;
        console.log('  FAIL  ' + num + '  ' + shortName.padEnd(12) + ' -> ' + e.message);
      }
    }
  }

  console.log('\n' + ok + ' generated, ' + fail + ' failed.');
  console.log('~' + chars + ' characters used (free tier: 1.000.000 / month for Chirp3-HD).');
  console.log('Samples: _local\\samples_select\\<lang>\\');
}

main().catch(function (e) { console.error(e.message); process.exit(1); });
