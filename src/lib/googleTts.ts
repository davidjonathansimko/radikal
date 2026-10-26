// Voce Google (PCM) pentru generarea audio-ului pregenerat. Aceleasi voci ca in /api/tts.

interface Voice {
  languageCode: string;
  name: string;
  ssmlGender: string;
  ssml: boolean;
}

const PROFILES: Record<string, { main: Voice; fallback: Voice }> = {
  de: {
    main: { languageCode: 'de-DE', name: 'de-DE-Chirp3-HD-Iapetus', ssmlGender: 'MALE', ssml: false },
    fallback: { languageCode: 'de-DE', name: 'de-DE-Neural2-H', ssmlGender: 'MALE', ssml: true },
  },
  en: {
    main: { languageCode: 'en-US', name: 'en-US-Chirp3-HD-Enceladus', ssmlGender: 'MALE', ssml: false },
    fallback: { languageCode: 'en-US', name: 'en-US-Neural2-D', ssmlGender: 'MALE', ssml: true },
  },
  ro: {
    main: { languageCode: 'ro-RO', name: 'ro-RO-Chirp3-HD-Enceladus', ssmlGender: 'MALE', ssml: false },
    fallback: { languageCode: 'ro-RO', name: 'ro-RO-Wavenet-B', ssmlGender: 'FEMALE', ssml: true },
  },
  ru: {
    main: { languageCode: 'ru-RU', name: 'ru-RU-Chirp3-HD-Charon', ssmlGender: 'MALE', ssml: false },
    fallback: { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-D', ssmlGender: 'MALE', ssml: true },
  },
};

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function call(voice: Voice, text: string, speakingRate: number, apiKey: string): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 25000);
  try {
    return await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      signal: ac.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: voice.ssml ? { ssml: `<speak>${escapeXml(text)}</speak>` } : { text },
        voice: { languageCode: voice.languageCode, name: voice.name, ssmlGender: voice.ssmlGender },
        audioConfig: {
          audioEncoding: 'LINEAR16',
          sampleRateHertz: 24000,
          speakingRate: Math.max(0.25, Math.min(4, speakingRate)),
          ...(voice.ssml && { pitch: 0.0 }),
          effectsProfileId: ['headphone-class-device'],
        },
      }),
    });
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** WAV (LINEAR16, 24 kHz) pentru un text scurt. Reincearca la cota depasita sau eroare de retea. */
export async function synthesizeWav(text: string, language: string, speakingRate: number, apiKey: string): Promise<Buffer> {
  const profile = PROFILES[language] ?? PROFILES.de;
  let voice = profile.main;
  let lastError = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await call(voice, text, speakingRate, apiKey);
      if (res.ok) {
        const data = (await res.json()) as { audioContent?: string };
        if (data.audioContent) return Buffer.from(data.audioContent, 'base64');
        lastError = 'raspuns gol';
      } else if ((res.status === 400 || res.status === 404) && voice !== profile.fallback) {
        voice = profile.fallback;
        continue;
      } else {
        lastError = `Google ${res.status}`;
        if (res.status !== 429 && res.status < 500) break;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'retea';
    }
    await sleep(800 * (attempt + 1) ** 2);
  }
  throw new Error(lastError || 'sinteza a esuat');
}
