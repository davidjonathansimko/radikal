// Report Comment Email API Route / Kommentar-Meldungs-E-Mail-API-Route / Rută API email raportare comentariu
// Sends email when a comment is reported / Sendet E-Mail wenn ein Kommentar gemeldet wird / Trimite email când un comentariu este raportat

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend lazily to avoid build errors / Resend verzögert initialisieren um Build-Fehler zu vermeiden / Inițializează Resend leneș pentru a evita erorile de build
const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

export async function POST(request: NextRequest) {
  try {
    const resend = getResend();
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }
    
    const body = await request.json();
    const { commentId, commentContent, commentAuthor, reporterEmail, reason, blogSlug, language } = body;

    if (!commentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email subject based on language / E-Mail-Betreff basierend auf Sprache erstellen / Creează subiectul emailului bazat pe limbă
    const subject = language === 'de' ? '🚨 Kommentar gemeldet auf RADIKAL' :
                    language === 'en' ? '🚨 Comment Reported on RADIKAL' :
                    language === 'ro' ? '🚨 Comentariu raportat pe RADIKAL' :
                    '🚨 Комментарий отправлен на RADIKAL';

    // Create email content / E-Mail-Inhalt erstellen / Creează conținutul emailului
    const emailContent = `
      <h2>🚨 ${language === 'de' ? 'Neue Kommentar-Meldung' : 
                language === 'en' ? 'New Comment Report' : 
                language === 'ro' ? 'Raportare nouă comentariu' : 
                'Новая жалоба на комментарий'}</h2>
      
      <h3>${language === 'de' ? 'Details:' : 
            language === 'en' ? 'Details:' : 
            language === 'ro' ? 'Detalii:' : 
            'Детали:'}</h3>
      
      <ul>
        <li><strong>${language === 'de' ? 'Blog:' : 
                      language === 'en' ? 'Blog:' : 
                      language === 'ro' ? 'Blog:' : 
                      'Блог:'}</strong> ${blogSlug}</li>
        <li><strong>${language === 'de' ? 'Kommentar ID:' : 
                      language === 'en' ? 'Comment ID:' : 
                      language === 'ro' ? 'ID Comentariu:' : 
                      'ID Комментария:'}</strong> ${commentId}</li>
        <li><strong>${language === 'de' ? 'Kommentar Autor:' : 
                      language === 'en' ? 'Comment Author:' : 
                      language === 'ro' ? 'Autor comentariu:' : 
                      'Автор комментария:'}</strong> ${commentAuthor || 'Unknown'}</li>
        <li><strong>${language === 'de' ? 'Gemeldet von:' : 
                      language === 'en' ? 'Reported by:' : 
                      language === 'ro' ? 'Raportat de:' : 
                      'Отправлено:'}</strong> ${reporterEmail}</li>
      </ul>
      
      <h3>${language === 'de' ? 'Gemeldeter Kommentar:' : 
            language === 'en' ? 'Reported Comment:' : 
            language === 'ro' ? 'Comentariu raportat:' : 
            'Содержание комментария:'}</h3>
      <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #e74c3c;">
        ${commentContent || 'Content not available'}
      </blockquote>
      
      <h3>${language === 'de' ? 'Grund der Meldung:' : 
            language === 'en' ? 'Reason for Report:' : 
            language === 'ro' ? 'Motivul raportării:' : 
            'Причина жалобы:'}</h3>
      <blockquote style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">
        ${reason}
      </blockquote>
      
      <p style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.radikal.blog'}/blogs/${blogSlug}" 
           style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          ${language === 'de' ? 'Zum Blogbeitrag' : 
            language === 'en' ? 'View Blog Post' : 
            language === 'ro' ? 'Vezi postarea' : 
            'Перейти к посту'}
        </a>
      </p>
    `;

    // Send email / E-Mail senden / Trimite emailul
    const { data, error } = await resend.emails.send({
      from: 'RADIKAL Blog <onboarding@resend.dev>',
      to: ['radikalblog@gmx.de'],
      subject: subject,
      html: emailContent,
      replyTo: reporterEmail,
    });

    if (error) {
      console.error('Error sending report email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    console.log('✅ Report email sent successfully:', data);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in report email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
