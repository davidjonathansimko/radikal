// ============================================================================
// API Route pentru trimiterea emailurilor de contact
// API Route für das Senden von Kontakt-E-Mails
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configurare transporter SMTP pentru Checkdomain
// SMTP Transporter Konfiguration für Checkdomain
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true pentru port 465 (SSL)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validare date / Datenvalidierung
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Configurare email / E-Mail Konfiguration
    const mailOptions = {
      from: `"Radikal Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Trimite la tine însuți / An dich selbst senden
      replyTo: email, // Răspunsul merge la expeditor / Antwort geht an Absender
      subject: `[Radikal Contact] ${subject}`,
      text: `
Nou mesaj de contact de pe radikal.blog
Neue Kontaktnachricht von radikal.blog
========================================

Nume / Name: ${name}
Email: ${email}
Subiect / Betreff: ${subject}

Mesaj / Nachricht:
${message}

========================================
Acest email a fost trimis automat de pe radikal.blog
Diese E-Mail wurde automatisch von radikal.blog gesendet
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
            📬 Nou mesaj de contact
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; background: #f5f5f5; font-weight: bold; width: 120px;">Nume:</td>
              <td style="padding: 10px; background: #fafafa;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f5f5f5; font-weight: bold;">Email:</td>
              <td style="padding: 10px; background: #fafafa;">
                <a href="mailto:${email}">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f5f5f5; font-weight: bold;">Subiect:</td>
              <td style="padding: 10px; background: #fafafa;">${subject}</td>
            </tr>
          </table>
          
          <div style="background: #f9f9f9; padding: 20px; border-left: 4px solid #e74c3c; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Mesaj:</h3>
            <p style="white-space: pre-wrap; color: #333;">${message}</p>
          </div>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
            Acest email a fost trimis automat de pe <a href="https://www.radikal.blog">radikal.blog</a>
          </p>
        </div>
      `,
    };

    // Trimite emailul / E-Mail senden
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
