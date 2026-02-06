# RADIKAL. - Radikale Bibellehre Blog

Ein moderner, mehrsprachiger Blog (Deutsch, Englisch, Rumänisch, Russisch) für authentische Bibellehre und geistliche Transformation, gebaut mit Next.js, TypeScript und Supabase.

## 🌟 Features / Funktionen

### Deutsch:
- **Zweisprachig**: Vollständige Unterstützung für Deutsch und Englisch
- **Responsives Design**: Perfekt angepasst für Desktop, Tablet und Mobile
- **Authentifizierung**: Anmeldung mit E-Mail oder GitHub
- **Admin-Dashboard**: Vollständige CRUD-Operationen für Blog-Posts
- **Interaktive Funktionen**: Likes, Kommentare, Teilen (WhatsApp, Telegram, E-Mail, etc.)
- **Bibelzitate**: Rotirende inspirirende Bibelverse mit Symbolen
- **Schöne Animationen**: Partikel-Effekte und Hintergrundbilder-Rotation
- **SEO-optimiert**: Meta-Tags, Open Graph, strukturierte Daten

### English:
- **Bilingual**: Full support for German and English
- **Responsive Design**: Perfectly adapted for desktop, tablet and mobile
- **Authentication**: Login with email or GitHub
- **Admin Dashboard**: Full CRUD operations for blog posts
- **Interactive Features**: Likes, comments, sharing (WhatsApp, Telegram, email, etc.)
- **Bible Quotes**: Rotating inspirational Bible verses with symbols
- **Beautiful Animations**: Particle effects and background image rotation
- **SEO Optimized**: Meta tags, Open Graph, structured data

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Custom CSS animations
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Deployment**: Vercel (recommended)
- **Icons**: React Icons (Font Awesome)
- **Animations**: Framer Motion, CSS animations
- **Date Formatting**: date-fns with localization

## 🚀 Setup Instructions / Einrichtungsanleitung

### 1. Projekt klonen / Clone the project
```bash
git clone <repository-url>
cd radikal
```

### 2. Dependencies installieren / Install dependencies
```bash
npm install
```

### 3. Supabase Setup / Supabase einrichten

1. Erstelle ein neues Projekt auf [supabase.com](https://supabase.com)
2. Kopiere die Supabase URL und den API Key
3. Führe das SQL-Schema aus der Datei `database_schema.sql` in deinem Supabase SQL Editor aus
4. Aktiviere GitHub OAuth in den Supabase Auth-Einstellungen (optional)

### 4. Umgebungsvariablen / Environment Variables

Erstelle eine `.env.local` Datei im Projektroot:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_EMAIL=your_admin_email@example.com
```

### 5. Bilder hinzufügen / Add Images

Füge die folgenden Bilder in den `public/` Ordner hinzu:
- `1.jpg` bis `12.jpg` - Hintergrundbilder (Natur/Landschaften empfohlen)
- `radikal.logo.png` - Das Logo der Website
- `exampleblog002.jpg` - Referenzbild für das Design

### 6. Entwicklungsserver starten / Start development server
```bash
npm run dev
```

Die Anwendung ist jetzt unter `http://localhost:3000` verfügbar.

## 📁 Projektstruktur / Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # Über uns Seite
│   ├── admin/             # Admin Dashboard
│   ├── auth/              # Authentifizierung (Login/Signup)
│   ├── blogs/             # Blog-Posts Seiten
│   ├── contact/           # Kontaktseite
│   ├── quotes/            # Zitate-Seite
│   ├── globals.css        # Globale Stile
│   ├── layout.tsx         # Root Layout
│   └── page.tsx           # Homepage
├── components/            # Wiederverwendbare Komponenten
│   ├── BackgroundAnimation.tsx
│   ├── BibleQuotes.tsx
│   ├── BlogList.tsx
│   └── Navigation.tsx
├── hooks/                 # Custom React Hooks
│   └── useLanguage.tsx    # Sprachkontext und Übersetzungen
├── lib/                   # Utility Libraries
│   └── supabase.ts        # Supabase Client Konfiguration
└── types/                 # TypeScript Type Definitionen
    └── index.ts
```

## 🔑 Admin-Funktionen / Admin Features

Der Admin-Zugang wird über die `ADMIN_EMAIL` Umgebungsvariable konfiguriert. Als Admin kannst du:

- Neue Blog-Posts erstellen (deutsch und englisch)
- Bestehende Posts bearbeiten und löschen
- Posts veröffentlichen oder als Entwurf speichern
- Bilder und Tags hinzufügen
- Kommentare moderieren
- Kontaktnachrichten einsehen

## 🎨 Design-Features / Design Features

### Hintergrund-Animation:
- Wechselnde Hintergrundbilder alle 4 Sekunden
- Schwebende Partikel mit sanften Bewegungen
- Blur-Effekte und Schatten für Tiefe
- Responsive Anpassungen für alle Bildschirmgrößen

### Bibelzitate-Karte:
- Zufällige Bibelverse über Hoffnung
- Automatischer Wechsel alle 4 Sekunden
- Symbole für jeden Vers
- Fade-Animationen zwischen den Zitaten
- Zweisprachige Unterstützung

### Glasmorphismus-Effekte:
- Transparente Karten mit Blur-Effekt
- Sanfte Schatten und Ränder
- Hover-Animationen
- Konsistente Farbpalette

## 🌐 Internationalisierung / Internationalization

Das Projekt unterstützt vollständig Deutsch und Englisch:

- Automatische Spracherkennung
- Persistente Sprachauswahl im localStorage
- Übersetzungen für alle UI-Elemente
- Datum-/Zeitformatierung entsprechend der Sprache
- Separate Inhaltsfelder für beide Sprachen in der Datenbank

## 📱 Responsive Design

- **Mobile First**: Optimiert für kleine Bildschirme
- **Tablet-freundlich**: Angepasste Layouts für mittlere Bildschirmgrößen
- **Desktop-erweitert**: Vollständige Feature-Nutzung auf großen Bildschirmen
- **Touch-optimiert**: Große Touch-Targets und Gesten-Unterstützung

## 🔐 Sicherheit / Security

- Row Level Security (RLS) in Supabase
- Admin-spezifische Berechtigungen
- Sichere Authentifizierung mit JWTs
- CSRF-Schutz durch Supabase
- Input-Validierung auf Client- und Server-Seite

## 🚀 Deployment

### Vercel (Empfohlen):
1. Verbinde dein GitHub Repository mit Vercel
2. Füge die Umgebungsvariablen hinzu
3. Deploy automatisch bei jedem Push

### Andere Plattformen:
- Netlify
- Railway
- AWS Amplify
- Jede andere Next.js-kompatible Plattform

## 📖 Verwendung / Usage

### Für Besucher:
1. Browse Blog-Posts auf der Startseite oder `/blogs`
2. Lese vollständige Artikel mit Kommentar-Funktionalität
3. Like und teile interessante Posts
4. Wechsle zwischen Deutsch und Englisch
5. Kontaktiere den Autor über das Kontaktformular
6. Entdecke inspirierende Bibelzitate auf `/quotes`

### Für Administratoren:
1. Melde dich mit der Admin-E-Mail an
2. Zugriff auf `/admin` für das Dashboard
3. Erstelle neue Posts mit deutschen und englischen Versionen
4. Verwalte Kommentare und Kontaktnachrichten
5. Moderiere Inhalte und aktualisiere bestehende Posts

## 🤝 Mitwirken / Contributing

Beiträge sind willkommen! Bitte:

1. Forke das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Pushe zum Branch
5. Öffne eine Pull Request

## 📄 Lizenz / License

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe die LICENSE-Datei für Details.

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues: Erstelle ein Issue in diesem Repository

---

**RADIKAL.** - Transforming lives through radical Bible teaching / Leben durch radikale Bibellehre transformieren
