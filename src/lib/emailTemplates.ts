// Email Templates System / E-Mail-Vorlagen-System / Sistem Șabloane Email
// Professional HTML email templates for all communications
// Professionelle HTML-E-Mail-Vorlagen für alle Kommunikation
// Șabloane email HTML profesionale pentru toată comunicarea

// Base email template wrapper
export function getEmailWrapper(content: string, options: {
  title?: string;
  previewText?: string;
  unsubscribeUrl?: string;
} = {}): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${options.title || 'RADIKAL'}</title>
  ${options.previewText ? `<!--[if !mso]><!-->
  <span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${options.previewText}
  </span>
  <!--<![endif]-->` : ''}
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 20px !important;
      }
      .content {
        padding: 20px !important;
      }
      .button {
        width: 100% !important;
        display: block !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  
  <!-- Main Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; background-color: #171717; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 2px;">
                RADIKAL
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #0f0f0f; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #666666;">
                RADIKAL - Christlicher Blog
              </p>
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #666666;">
                <a href="https://radikal-magazin.de" style="color: #dc2626; text-decoration: none;">Website</a> · 
                <a href="https://radikal-magazin.de/datenschutz" style="color: #dc2626; text-decoration: none;">Datenschutz</a> · 
                <a href="https://radikal-magazin.de/impressum" style="color: #dc2626; text-decoration: none;">Impressum</a>
              </p>
              ${options.unsubscribeUrl ? `
              <p style="margin: 15px 0 0 0; font-size: 11px; color: #666666;">
                <a href="${options.unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Newsletter abbestellen</a>
              </p>
              ` : ''}
              <p style="margin: 15px 0 0 0; font-size: 11px; color: #444444;">
                © ${new Date().getFullYear()} RADIKAL. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();
}

// Button component
export function getEmailButton(text: string, url: string, color: string = '#dc2626'): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 25px auto;">
      <tr>
        <td class="button" style="border-radius: 8px; background-color: ${color};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 8px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// =====================================================
// EMAIL TEMPLATES
// =====================================================

/**
 * Welcome Email for Newsletter Subscribers
 */
export function getWelcomeEmail(name: string, unsubscribeUrl: string): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
      Willkommen bei RADIKAL, ${name}! 🎉
    </h2>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
      Vielen Dank, dass du dich für unseren Newsletter angemeldet hast. Du bist jetzt Teil unserer Community und wirst regelmäßig Updates zu neuen Artikeln, Events und exklusiven Inhalten erhalten.
    </p>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
      Was dich erwartet:
    </p>
    
    <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #a3a3a3; font-size: 16px; line-height: 1.8;">
      <li>Inspirierende Artikel zu Glaube und Leben</li>
      <li>Exklusive Einblicke und Hintergrundgeschichten</li>
      <li>Neuigkeiten aus unserer Community</li>
      <li>Einladungen zu besonderen Events</li>
    </ul>
    
    ${getEmailButton('Zum Blog', 'https://radikal-magazin.de/blog')}
    
    <p style="margin: 25px 0 0 0; font-size: 14px; color: #666666;">
      Hast du Fragen oder Anregungen? Antworte einfach auf diese E-Mail oder schreibe uns an 
      <a href="mailto:info@radikal-magazin.de" style="color: #dc2626;">info@radikal-magazin.de</a>.
    </p>
    
    <p style="margin: 20px 0 0 0; font-size: 16px; color: #a3a3a3;">
      Bleib radikal! 🔥<br>
      <strong style="color: #ffffff;">Das RADIKAL Team</strong>
    </p>
  `;
  
  return getEmailWrapper(content, {
    title: 'Willkommen bei RADIKAL!',
    previewText: 'Vielen Dank für deine Anmeldung zum RADIKAL Newsletter.',
    unsubscribeUrl,
  });
}

/**
 * Newsletter Email
 */
export function getNewsletterEmail(
  subject: string,
  intro: string,
  articles: Array<{
    title: string;
    excerpt: string;
    url: string;
    imageUrl?: string;
    category?: string;
  }>,
  unsubscribeUrl: string
): string {
  const articleCards = articles.map(article => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr>
        <td style="background-color: #262626; border-radius: 8px; overflow: hidden;">
          ${article.imageUrl ? `
          <a href="${article.url}" target="_blank">
            <img src="${article.imageUrl}" alt="${article.title}" width="100%" style="display: block; width: 100%; height: auto; max-height: 200px; object-fit: cover;">
          </a>
          ` : ''}
          <div style="padding: 20px;">
            ${article.category ? `
            <span style="display: inline-block; padding: 4px 12px; background-color: #dc2626; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 20px; margin-bottom: 10px;">
              ${article.category}
            </span>
            ` : ''}
            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #ffffff;">
              <a href="${article.url}" style="color: #ffffff; text-decoration: none;">${article.title}</a>
            </h3>
            <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5; color: #a3a3a3;">
              ${article.excerpt}
            </p>
            <a href="${article.url}" style="font-size: 14px; font-weight: 600; color: #dc2626; text-decoration: none;">
              Weiterlesen →
            </a>
          </div>
        </td>
      </tr>
    </table>
  `).join('');
  
  const content = `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
      ${subject}
    </h2>
    
    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
      ${intro}
    </p>
    
    ${articleCards}
    
    ${getEmailButton('Alle Artikel ansehen', 'https://radikal-magazin.de/blog')}
    
    <p style="margin: 30px 0 0 0; font-size: 16px; color: #a3a3a3;">
      Bleib radikal! 🔥<br>
      <strong style="color: #ffffff;">Das RADIKAL Team</strong>
    </p>
  `;
  
  return getEmailWrapper(content, {
    title: subject,
    previewText: intro,
    unsubscribeUrl,
  });
}

/**
 * Contact Form Confirmation Email
 */
export function getContactConfirmationEmail(name: string, message: string): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
      Danke für deine Nachricht, ${name}!
    </h2>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
      Wir haben deine Nachricht erhalten und werden uns so schnell wie möglich bei dir melden. 
      In der Regel antworten wir innerhalb von 24-48 Stunden.
    </p>
    
    <div style="background-color: #262626; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
        Deine Nachricht:
      </p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #a3a3a3; font-style: italic;">
        "${message}"
      </p>
    </div>
    
    <p style="margin: 20px 0 0 0; font-size: 16px; color: #a3a3a3;">
      Liebe Grüße,<br>
      <strong style="color: #ffffff;">Das RADIKAL Team</strong>
    </p>
  `;
  
  return getEmailWrapper(content, {
    title: 'Danke für deine Nachricht!',
    previewText: 'Wir haben deine Nachricht erhalten und melden uns bald.',
  });
}

/**
 * Comment Notification Email
 */
export function getCommentNotificationEmail(
  recipientName: string,
  commenterName: string,
  postTitle: string,
  postUrl: string,
  commentExcerpt: string,
  isReply: boolean = false
): string {
  const title = isReply 
    ? `${commenterName} hat auf deinen Kommentar geantwortet`
    : `Neuer Kommentar auf "${postTitle}"`;
  
  const content = `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
      ${isReply ? 'Neue Antwort!' : 'Neuer Kommentar!'} 💬
    </h2>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
      Hallo ${recipientName},<br><br>
      ${isReply 
        ? `<strong style="color: #ffffff;">${commenterName}</strong> hat auf deinen Kommentar geantwortet.`
        : `<strong style="color: #ffffff;">${commenterName}</strong> hat einen neuen Kommentar zu <strong style="color: #ffffff;">"${postTitle}"</strong> hinterlassen.`
      }
    </p>
    
    <div style="background-color: #262626; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0;">
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
        "${commentExcerpt}"
      </p>
    </div>
    
    ${getEmailButton('Kommentar ansehen', postUrl)}
    
    <p style="margin: 25px 0 0 0; font-size: 14px; color: #666666;">
      Du erhältst diese E-Mail, weil du Benachrichtigungen für Kommentare aktiviert hast.
    </p>
  `;
  
  return getEmailWrapper(content, {
    title,
    previewText: `${commenterName}: "${commentExcerpt.slice(0, 50)}..."`,
  });
}

/**
 * Password Reset Email
 */
export function getPasswordResetEmail(name: string, resetUrl: string): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
      Passwort zurücksetzen
    </h2>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
      Hallo ${name},<br><br>
      wir haben eine Anfrage erhalten, dein Passwort zurückzusetzen. 
      Klicke auf den Button unten, um ein neues Passwort zu erstellen.
    </p>
    
    ${getEmailButton('Passwort zurücksetzen', resetUrl)}
    
    <p style="margin: 25px 0 0 0; font-size: 14px; color: #666666;">
      Dieser Link ist 24 Stunden gültig. Wenn du diese Anfrage nicht gestellt hast, 
      kannst du diese E-Mail ignorieren.
    </p>
    
    <p style="margin: 20px 0 0 0; font-size: 14px; color: #666666;">
      Aus Sicherheitsgründen: Wenn du den Link nicht angefordert hast, 
      <a href="mailto:info@radikal-magazin.de" style="color: #dc2626;">kontaktiere uns bitte</a>.
    </p>
  `;
  
  return getEmailWrapper(content, {
    title: 'Passwort zurücksetzen',
    previewText: 'Klicke hier, um dein Passwort zurückzusetzen.',
  });
}

/**
 * New Post Notification Email
 */
export function getNewPostEmail(
  post: {
    title: string;
    excerpt: string;
    url: string;
    imageUrl?: string;
    category: string;
    author: string;
    readTime: string;
  },
  unsubscribeUrl: string
): string {
  const content = `
    <h2 style="margin: 0 0 5px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
      Neuer Artikel! 📖
    </h2>
    
    <p style="margin: 0 0 25px 0; font-size: 14px; color: #666666;">
      ${post.author} · ${post.readTime} Lesezeit
    </p>
    
    ${post.imageUrl ? `
    <a href="${post.url}" target="_blank">
      <img src="${post.imageUrl}" alt="${post.title}" width="100%" style="display: block; width: 100%; height: auto; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">
    </a>
    ` : ''}
    
    <span style="display: inline-block; padding: 4px 12px; background-color: #dc2626; color: #ffffff; font-size: 12px; font-weight: 600; border-radius: 20px; margin-bottom: 15px;">
      ${post.category}
    </span>
    
    <h3 style="margin: 0 0 15px 0; font-size: 22px; color: #ffffff; font-weight: 600;">
      <a href="${post.url}" style="color: #ffffff; text-decoration: none;">${post.title}</a>
    </h3>
    
    <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
      ${post.excerpt}
    </p>
    
    ${getEmailButton('Jetzt lesen', post.url)}
    
    <p style="margin: 30px 0 0 0; font-size: 16px; color: #a3a3a3;">
      Bleib radikal! 🔥<br>
      <strong style="color: #ffffff;">Das RADIKAL Team</strong>
    </p>
  `;
  
  return getEmailWrapper(content, {
    title: `Neuer Artikel: ${post.title}`,
    previewText: post.excerpt.slice(0, 100) + '...',
    unsubscribeUrl,
  });
}

/**
 * Email for Admin: Contact Form Submission
 */
export function getAdminContactEmail(
  contact: {
    name: string;
    email: string;
    subject: string;
    message: string;
    timestamp: string;
  }
): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
      Neue Kontaktanfrage 📩
    </h2>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #333333;">
          <strong style="color: #a3a3a3;">Name:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #333333; color: #ffffff;">
          ${contact.name}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #333333;">
          <strong style="color: #a3a3a3;">E-Mail:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #333333;">
          <a href="mailto:${contact.email}" style="color: #dc2626;">${contact.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #333333;">
          <strong style="color: #a3a3a3;">Betreff:</strong>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #333333; color: #ffffff;">
          ${contact.subject}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0;">
          <strong style="color: #a3a3a3;">Zeit:</strong>
        </td>
        <td style="padding: 10px 0; color: #a3a3a3;">
          ${contact.timestamp}
        </td>
      </tr>
    </table>
    
    <div style="background-color: #262626; border-radius: 8px; padding: 20px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
        Nachricht:
      </p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #a3a3a3; white-space: pre-wrap;">
${contact.message}
      </p>
    </div>
    
    ${getEmailButton('Antworten', `mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject)}`)}
  `;
  
  return getEmailWrapper(content, {
    title: `Neue Kontaktanfrage: ${contact.subject}`,
    previewText: `Von ${contact.name}: ${contact.message.slice(0, 50)}...`,
  });
}

export default {
  getEmailWrapper,
  getEmailButton,
  getWelcomeEmail,
  getNewsletterEmail,
  getContactConfirmationEmail,
  getCommentNotificationEmail,
  getPasswordResetEmail,
  getNewPostEmail,
  getAdminContactEmail,
};
