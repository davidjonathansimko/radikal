// ============================================================================
// API Route pentru trimiterea notificărilor newsletter când apare un blog nou
// API Route für Newsletter-Benachrichtigungen bei neuen Blog-Posts
// Cu traducere automată în limba fiecărui abonat / Mit automatischer Übersetzung
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Inițializare Supabase client / Supabase Client initialisieren
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// DeepL API configuration / DeepL API Konfiguration
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api.deepl.com/v2/translate';

// Language code mapping for DeepL
const languageMap: Record<string, string> = {
  de: 'DE',
  en: 'EN',
  ro: 'RO',
  ru: 'RU',
};

// Generate hash for text (for cache lookup)
function generateTextHash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

// Get cached translation from Supabase
async function getCachedTranslation(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  try {
    const hash = generateTextHash(text);
    const { data, error } = await supabase
      .from('translation_cache')
      .select('translated_text')
      .eq('original_text_hash', hash)
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
      .single();
    
    if (error || !data) return null;
    console.log('📦 Newsletter: Cache HIT for translation');
    return data.translated_text;
  } catch {
    return null;
  }
}

// Save translation to cache
async function cacheTranslation(originalText: string, translatedText: string, sourceLang: string, targetLang: string): Promise<void> {
  try {
    const hash = generateTextHash(originalText);
    await supabase
      .from('translation_cache')
      .upsert({
        original_text_hash: hash,
        source_lang: sourceLang,
        target_lang: targetLang,
        original_text: originalText.substring(0, 1000),
        translated_text: translatedText,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'original_text_hash,source_lang,target_lang'
      });
  } catch (error) {
    console.warn('Failed to cache translation:', error);
  }
}

// Translate text using DeepL with caching
async function translateText(text: string, targetLang: string, sourceLang: string = 'ro'): Promise<string> {
  // Return original if same language or empty
  if (!text || text.trim() === '' || targetLang === sourceLang) {
    return text;
  }

  // Check cache first
  const cached = await getCachedTranslation(text, sourceLang, targetLang);
  if (cached) return cached;

  // If no DeepL API key, return original
  if (!DEEPL_API_KEY) {
    console.warn('Newsletter: DeepL API key not configured');
    return text;
  }

  try {
    const deepLTargetLang = languageMap[targetLang] || targetLang.toUpperCase();
    const deepLSourceLang = languageMap[sourceLang] || sourceLang.toUpperCase();

    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: deepLTargetLang,
        source_lang: deepLSourceLang,
      }),
    });

    if (!response.ok) {
      console.error('Newsletter: DeepL API error:', response.status);
      return text;
    }

    const data = await response.json();
    const translatedText = data.translations[0]?.text || text;
    
    // Cache the translation for future use
    await cacheTranslation(text, translatedText, sourceLang, targetLang);
    console.log(`✅ Newsletter: Translated to ${targetLang}`);
    
    return translatedText;
  } catch (error) {
    console.error('Newsletter: Translation error:', error);
    return text;
  }
}

// Configurare transporter SMTP pentru Checkdomain
// SMTP Transporter Konfiguration für Checkdomain
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Traduceri pentru email / Übersetzungen für E-Mail
const translations = {
  de: {
    subject: 'Neuer Blog-Beitrag auf Radikal',
    greeting: 'Hallo!',
    newPost: 'Ein neuer Beitrag wurde veröffentlicht:',
    readMore: 'Weiterlesen',
    unsubscribe: 'Abmelden',
    footer: 'Du erhältst diese E-Mail, weil du den Radikal Newsletter abonniert hast.',
  },
  en: {
    subject: 'New Blog Post on Radikal',
    greeting: 'Hello!',
    newPost: 'A new post has been published:',
    readMore: 'Read More',
    unsubscribe: 'Unsubscribe',
    footer: 'You are receiving this email because you subscribed to the Radikal newsletter.',
  },
  ro: {
    subject: 'Articol nou pe Radikal',
    greeting: 'Salut!',
    newPost: 'Un articol nou a fost publicat:',
    readMore: 'Citește mai mult',
    unsubscribe: 'Dezabonare',
    footer: 'Primești acest email pentru că te-ai abonat la newsletter-ul Radikal.',
  },
  ru: {
    subject: 'Новая статья на Radikal',
    greeting: 'Привет!',
    newPost: 'Опубликована новая статья:',
    readMore: 'Читать далее',
    unsubscribe: 'Отписаться',
    footer: 'Вы получаете это письмо, потому что подписались на рассылку Radikal.',
  },
};

export async function POST(request: NextRequest) {
  try {
    // Verifică autorizarea (API key simplu pentru securitate)
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.NEWSLETTER_API_KEY || 'radikal-newsletter-secret';
    
    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postTitle, postTitleEn, postSlug, postExcerpt, postExcerptEn } = await request.json();

    if (!postTitle || !postSlug) {
      return NextResponse.json({ error: 'Missing post data' }, { status: 400 });
    }

    // Obține toți abonații activi / Alle aktiven Abonnenten abrufen
    const { data: subscribers, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('email, language, unsubscribe_token')
      .eq('is_active', true);

    if (subError) {
      console.error('Error fetching subscribers:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers', sent: 0 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.radikal.blog';
    let successCount = 0;
    let failCount = 0;

    // Pre-translate content for each language to avoid duplicate API calls
    // Vorab-Übersetzen des Inhalts für jede Sprache / Pre-traducere conținut pentru fiecare limbă
    const translatedContent: Record<string, { title: string; excerpt: string }> = {
      ro: { title: postTitle, excerpt: postExcerpt || '' }, // Original language
    };

    // Get unique languages from subscribers (excluding Romanian - original language)
    const allLanguages = subscribers.map(s => s.language || 'en');
    const uniqueLanguages = Array.from(new Set(allLanguages)).filter(l => l !== 'ro');
    
    console.log(`📧 Newsletter: Preparing translations for languages: ${uniqueLanguages.join(', ')}`);
    
    // Pre-translate for each unique language
    for (const lang of uniqueLanguages) {
      try {
        const [translatedTitle, translatedExcerpt] = await Promise.all([
          translateText(postTitle, lang, 'ro'),
          postExcerpt ? translateText(postExcerpt, lang, 'ro') : Promise.resolve('')
        ]);
        translatedContent[lang] = { title: translatedTitle, excerpt: translatedExcerpt };
        console.log(`✅ Newsletter: Content translated to ${lang}`);
      } catch (error) {
        console.error(`Failed to translate to ${lang}:`, error);
        // Fallback to original if translation fails
        translatedContent[lang] = { title: postTitle, excerpt: postExcerpt || '' };
      }
    }

    // Trimite email fiecărui abonat / E-Mail an jeden Abonnenten senden
    for (const subscriber of subscribers) {
      const lang = (subscriber.language as 'de' | 'en' | 'ro' | 'ru') || 'en';
      const t = translations[lang] || translations.en;
      
      // Get translated title and excerpt for this subscriber's language
      // Übersetzte Titel und Auszug für die Sprache des Abonnenten abrufen
      // Obține titlul și excerptul tradus pentru limba abonatului
      const content = translatedContent[lang] || translatedContent.ro;
      const title = content.title;
      const excerpt = content.excerpt;
      
      const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
      const postUrl = `${siteUrl}/blogs/${postSlug}`;

      // Generate unique Message-ID for better deliverability
      const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@radikal.blog>`;

      const mailOptions = {
        from: `"Radikal Blog" <${process.env.SMTP_USER}>`,
        to: subscriber.email,
        replyTo: process.env.SMTP_USER, // Important for spam filters
        subject: `${t.subject}: ${title}`,
        // Headers for better deliverability / Headers für bessere Zustellbarkeit
        headers: {
          'X-Mailer': 'Radikal Blog Newsletter',
          'X-Priority': '3', // Normal priority
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Precedence': 'bulk',
          'Message-ID': messageId,
        },
        text: `
${t.greeting}

${t.newPost}

${title}
${excerpt || ''}

${t.readMore}: ${postUrl}

---
${t.footer}
${t.unsubscribe}: ${unsubscribeUrl}
        `.trim(),
        html: `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${t.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #1a1a1a; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px 20px; border-bottom: 1px solid #333;">
              <h1 style="color: #e74c3c; margin: 0; font-size: 28px; font-weight: bold;">RADIKAL</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 30px;">
              <p style="color: #cccccc; font-size: 16px; margin: 0 0 15px 0;">${t.greeting}</p>
              <p style="color: #cccccc; font-size: 16px; margin: 0 0 20px 0;">${t.newPost}</p>
              
              <!-- Post Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #2a2a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 20px;">${title}</h2>
                    ${excerpt ? `<p style="color: #999999; margin: 0; font-size: 14px; line-height: 1.5;">${excerpt}</p>` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="${postUrl}" style="background-color: #e74c3c; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                      ${t.readMore} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #333; background-color: #111111;">
              <p style="color: #666666; font-size: 12px; margin: 0 0 10px 0; text-align: center;">${t.footer}</p>
              <p style="text-align: center; margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #888888; font-size: 12px; text-decoration: underline;">${t.unsubscribe}</a>
              </p>
              <p style="color: #444444; font-size: 10px; margin: 15px 0 0 0; text-align: center;">
                &copy; ${new Date().getFullYear()} Radikal Blog. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      };

      try {
        await transporter.sendMail(mailOptions);
        successCount++;
        console.log(`Newsletter sent to: ${subscriber.email}`);
      } catch (emailError) {
        failCount++;
        console.error(`Failed to send to ${subscriber.email}:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      total: subscribers.length,
    });

  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}
