// Pasul 261026 — „Șterge-mi contul": șterge datele și contul utilizatorului
// care apasă butonul. Se cere antetul „Authorization: Bearer <token>"; ID-ul
// se ia din token, niciodată din cerere, deci nimeni nu poate șterge alt cont.
//
// Adminul nu se poate șterge de aici (ca să nu-și piardă accidental accesul).

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getAdminClient, getUserFromRequest } from '@/lib/serverSupabase';

export const dynamic = 'force-dynamic';

// Tabele cu coloana de utilizator. Cele care lipsesc din baza de date sunt ignorate.
const BY_USER_ID: [string, string][] = [
  ['bookmarks', 'user_id'],
  ['reading_history', 'user_id'],
  ['comment_likes', 'user_id'],
  ['comment_reports', 'reporter_id'],
  ['reel_likes', 'user_id'],
  ['push_subscriptions', 'user_id'],
  ['admin_preferences', 'user_id'],
  ['newsletter_subscribers', 'user_id'],
];

export async function POST(req: NextRequest) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const user = await getUserFromRequest(admin, req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (user.isAdmin) return NextResponse.json({ error: 'admin_not_allowed' }, { status: 403 });

  for (const [table, column] of BY_USER_ID) {
    try {
      await admin.from(table).delete().eq(column, user.id);
    } catch {
      /* tabel inexistent sau fara coloana — mergem mai departe */
    }
  }
  if (user.email) {
    try {
      await admin.from('newsletter_subscribers').delete().eq('email', user.email.toLowerCase());
    } catch {
      /* ignorat */
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });

  // Notificare pentru admin: jurnal + email (fiecare optional, niciunul nu opreste stergerea)
  try {
    await admin.from('account_deletions').insert({ email: user.email });
  } catch {
    /* tabelul se creeaza cu STEP_261026A_PUSH.sql */
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"Radikal" <${process.env.SMTP_USER}>`,
        to: process.env.SMTP_USER,
        subject: '[Radikal] Cont sters de utilizator',
        text: `Un utilizator si-a sters contul si datele.\nEmail: ${user.email ?? '(necunoscut)'}\nData: ${new Date().toISOString()}`,
      });
    } catch {
      /* emailul e doar o informare */
    }
  }

  return NextResponse.json({ ok: true });
}
