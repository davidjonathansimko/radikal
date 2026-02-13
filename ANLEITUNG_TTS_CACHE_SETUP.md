# 🎙️ RADIKAL — Google Cloud TTS mit Cache-System
## Komplette Schritt-für-Schritt Anleitung / Instrucțiuni complete pas cu pas

---

## 📋 Was wir erreichen wollen / Ce vrem să realizăm

**Problem:** Google Cloud TTS hat 1 Mio WaveNet-Zeichen / 4 Mio Standard-Zeichen pro Monat kostenlos.  
Wenn jeder Besucher auf "Anhören" klickt, werden jedes Mal neue Zeichen verbraucht → Limit schnell erreicht.

**Lösung:** 3-Schichten-Cache-System:
1. ✅ **Erster Besuch:** Audio wird von Google generiert und in 3 Caches gespeichert
2. ✅ **Jeder weitere Besuch:** Audio kommt aus dem Cache — KEINE Google-Zeichen verbraucht!
3. ✅ **Frau + Mann Stimme:** Beide Varianten werden separat gecacht

**Ergebnis:** Ein Blog-Artikel in 4 Sprachen × 2 Stimmen = 8 Audio-Versionen werden nur EINMAL generiert.  
Danach können 1.000, 10.000 oder 100.000 Besucher anhören — es kostet NULL zusätzliche Zeichen.

---

## 🏗️ Architektur des Cache-Systems

```
User klickt "Anhören" auf Blog
         │
         ▼
┌─────────────────────────┐
│  Layer 1: Client Cache  │  ⚡ Sofort (0ms)
│  (Browser Memory)       │  → Gleicher Tab, gleiche Session
│  TextToSpeech.tsx Map   │
└──────────┬──────────────┘
           │ MISS?
           ▼
┌─────────────────────────┐
│  Layer 2: Server Cache  │  ⚡ Schnell (~5ms)
│  (Node.js Memory)       │  → Gleiche Server-Instanz
│  API Route Map          │
└──────────┬──────────────┘
           │ MISS?
           ▼
┌─────────────────────────┐
│  Layer 3: Supabase DB   │  🔄 Mittel (~100ms)
│  (tts_cache Tabelle)    │  → Permanent gespeichert!
│  Überlebt Server-Restart│
└──────────┬──────────────┘
           │ MISS? (nur beim allerersten Mal!)
           ▼
┌─────────────────────────┐
│  Google Cloud TTS API   │  🌐 Langsam (~500ms)
│  Verbraucht Zeichen!    │  → Nur 1x pro Text+Sprache+Stimme
│  Ergebnis → alle Caches │
└─────────────────────────┘
```

---

## 📊 Zeichen-Verbrauch Kalkulation

| Was | Zeichen ca. |
|-----|-------------|
| 1 Blog-Artikel (Durchschnitt) | ~5.000 Zeichen |
| × 4 Sprachen (DE, EN, RO, RU) | ~20.000 Zeichen |
| × 2 Stimmen (Frau + Mann) | ~40.000 Zeichen |
| **Pro Blog total** | **~40.000 Zeichen** |
| **30 Blogs pro Monat** | **~1.200.000 Zeichen** |

**WaveNet (1 Mio kostenlos):** Reicht für ca. 25 Blogs/Monat  
**Standard (4 Mio kostenlos):** Reicht für ca. 100 Blogs/Monat  

> 💡 **Tipp:** Wenn du über 25 Blogs/Monat schreibst, könntest du für einige Sprachen Standard-Stimmen nutzen (auch sehr gut!) und WaveNet nur für DE+RO.

> 💡 **WICHTIG:** Dank Cache werden die Zeichen nur EINMAL verbraucht — egal wie viele Besucher den Blog anhören!

---

## 🚀 SCHRITT-FÜR-SCHRITT SETUP

### Schritt 1: Google Cloud TTS API Key (falls noch nicht vorhanden)

1. Gehe zu **https://console.cloud.google.com**
2. Erstelle ein neues Projekt (oder wähle dein bestehendes)
3. Suche nach **"Cloud Text-to-Speech API"** → **Aktivieren**
4. Gehe zu **APIs & Services → Credentials** 
5. Klicke **"+ CREATE CREDENTIALS" → "API Key"**
6. Kopiere den API Key
7. Öffne deine `.env.local` Datei im Radikal-Projekt:

```bash
GOOGLE_CLOUD_TTS_API_KEY=DEIN_KOPIIERTER_API_KEY
```

> ⚠️ **NIEMALS** den API Key in Git pushen! Die `.env.local` ist bereits in `.gitignore`.

---

### Schritt 2: Supabase `tts_cache` Tabelle erstellen

Das ist der wichtigste Schritt — hier wird das Audio permanent gespeichert.

1. Gehe zu **https://supabase.com/dashboard**
2. Wähle dein RADIKAL-Projekt
3. Klicke links auf **"SQL Editor"** (das Symbol mit `</>`)
4. Klicke **"New Query"**
5. Kopiere und füge folgenden SQL-Code ein:

```sql
-- ============================================================
-- TTS Cache Table für RADIKAL Blog
-- ============================================================

-- Tabelle erstellen
CREATE TABLE IF NOT EXISTS tts_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  audio_content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'de',
  voice_gender TEXT NOT NULL DEFAULT 'female',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für schnelle Suche
CREATE INDEX IF NOT EXISTS idx_tts_cache_key ON tts_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_tts_cache_created ON tts_cache(created_at);

-- Row Level Security aktivieren
ALTER TABLE tts_cache ENABLE ROW LEVEL SECURITY;

-- Policies: Server darf lesen, schreiben, aktualisieren
CREATE POLICY "Allow read tts_cache" ON tts_cache
  FOR SELECT USING (true);

CREATE POLICY "Allow insert tts_cache" ON tts_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update tts_cache" ON tts_cache
  FOR UPDATE USING (true);
```

6. Klicke **"Run"** (oder Ctrl+Enter)
7. Du solltest sehen: **"Success. No rows returned"** → Das ist korrekt!

**Überprüfung:** Gehe zu **Table Editor** links → Du solltest `tts_cache` als neue Tabelle sehen (noch leer).

---

### Schritt 3: Code ist bereits fertig! ✅

Die folgenden Dateien wurden bereits von uns aktualisiert:

| Datei | Was geändert |
|-------|-------------|
| `src/app/api/tts/route.ts` | 3-Layer Cache: Memory → Supabase DB → Google API |
| `src/components/TextToSpeech.tsx` | Client-Side Cache im Browser |

**Was der Code macht:**
- Bei jedem TTS-Request wird ein **SHA-256 Hash** aus `Text + Sprache + Stimme + Geschwindigkeit` erstellt
- Dieser Hash ist der **Cache-Key** — identischer Text = identischer Key
- Das Audio wird als Base64-String in Supabase gespeichert
- Nächstes Mal: Audio kommt sofort aus dem Cache, Google wird NICHT aufgerufen

---

### Schritt 4: Vercel Deployment

Nach dem Git-Push (siehe unten) wird Vercel automatisch deployen.  
Der Cache funktioniert sofort auf Vercel — keine extra Konfiguration nötig.

**Vercel Umgebungsvariablen prüfen:**
1. Gehe zu **vercel.com → dein Projekt → Settings → Environment Variables**
2. Stelle sicher dass diese vorhanden sind:
   - `GOOGLE_CLOUD_TTS_API_KEY` = dein Google API Key
   - `NEXT_PUBLIC_SUPABASE_URL` = deine Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = dein Supabase Anon Key

> 💡 Optional aber empfohlen: Auch `SUPABASE_SERVICE_ROLE_KEY` hinzufügen (findest du in Supabase → Settings → API → service_role key). Damit kann der Server sicher in die DB schreiben.

---

### Schritt 5: Testen

1. Öffne einen Blog-Artikel auf deiner Seite
2. Klicke auf **"Anhören"** (Text-to-Speech)
3. → Erster Aufruf: Audio wird von Google generiert (~1-2 Sek)
4. Stoppe und klicke nochmal **"Anhören"**
5. → Zweiter Aufruf: Audio kommt SOFORT aus dem Cache!

**In der Browser-Konsole (F12 → Console) siehst du:**
```
[TTS Client Cache] 💾 SAVED — 1 chunks cached     ← Erster Aufruf
[TTS Client Cache] ✅ HIT — using cached audio      ← Ab dem zweiten Mal
```

**Im Vercel/Server-Log siehst du:**
```
[TTS Cache] ❌ MISS — calling Google Cloud TTS API  ← Allererster Aufruf
[TTS Cache] 💾 SAVED to cache                       ← Gespeichert
[TTS Cache] ✅ HIT (supabase) — saved Google API call ← Alle weiteren
```

---

### Schritt 6: Cache-Statistiken prüfen

In **Supabase SQL Editor** kannst du jederzeit prüfen:

```sql
-- Wie viele Audio-Dateien sind gecacht?
SELECT 
  COUNT(*) as total_cached,
  COUNT(DISTINCT language) as languages,
  pg_size_pretty(pg_total_relation_size('tts_cache')) as total_size
FROM tts_cache;

-- Aufschlüsselung nach Sprache
SELECT 
  language, 
  voice_gender,
  COUNT(*) as cached_chunks
FROM tts_cache 
GROUP BY language, voice_gender
ORDER BY language;
```

---

## 🧹 Wartung / Întreținere

### Cache leeren (falls nötig)
Wenn du einen Blog-Text änderst, wird automatisch neues Audio generiert (anderer Hash).  
Das alte Audio bleibt im Cache, stört aber nicht.

**Alten Cache aufräumen (optional, alle 3 Monate):**
```sql
DELETE FROM tts_cache WHERE created_at < NOW() - INTERVAL '90 days';
```

**Gesamten Cache leeren:**
```sql
TRUNCATE tts_cache;
```

---

## 🔢 Zusammenfassung der Änderungen

### Pasul 1302006 — Alle 4 Aufgaben:

1. ✅ **Montserrat Font** für Blog-Content (normal + Reading Mode)
2. ✅ **Mobile Text größer** (17px Blog, 15px allgemein)
3. ✅ **PDF Download Icon größer** (von w-3/h-3 auf w-4/h-4 base, w-5/h-5 sm)
4. ✅ **Google Cloud TTS Caching** (3-Layer: Client → Server → Supabase)

### Geänderte Dateien für Git:
- `src/app/globals.css` — Montserrat + Mobile Text
- `src/components/PrintButton.tsx` — Icon größer
- `src/app/api/tts/route.ts` — TTS Caching komplett
- `src/components/TextToSpeech.tsx` — Client-Side Cache

### NICHT in Git pushen:
- `.env.local` (Secrets!)
- `.env.local.example` (optional, keine Code-Änderung)
- `ANLEITUNG_TTS_CACHE_SETUP.md` (diese Datei — nur für dich)
- `supabase_tts_cache_table.sql` (nur für dich, SQL direkt in Supabase ausführen)
