// ============================================================================
// API Route pentru abonarea la newsletter
// API Route für Newsletter-Anmeldung
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, language } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Verifică dacă emailul există deja / Prüfen ob E-Mail bereits existiert
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json({ 
          error: 'already_subscribed',
          message: 'This email is already subscribed' 
        }, { status: 400 });
      } else {
        // Reactivează abonamentul / Abonnement reaktivieren
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ is_active: true, language: language || 'en' })
          .eq('id', existing.id);

        if (updateError) {
          return NextResponse.json({ error: 'Failed to resubscribe' }, { status: 500 });
        }

        return NextResponse.json({ success: true, resubscribed: true });
      }
    }

    // Creează abonat nou / Neuen Abonnenten erstellen
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([{
        email: email.toLowerCase(),
        language: language || 'en',
        unsubscribe_token: uuidv4(),
        is_active: true,
      }]);

    if (insertError) {
      console.error('Newsletter subscribe error:', insertError);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
