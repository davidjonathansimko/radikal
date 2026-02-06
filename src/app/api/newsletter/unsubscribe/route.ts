// ============================================================================
// API Route pentru dezabonarea de la newsletter
// API Route für Newsletter-Abmeldung
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse(renderPage('error', 'Invalid unsubscribe link'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Găsește și dezactivează abonatul / Abonnenten finden und deaktivieren
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ is_active: false })
    .eq('unsubscribe_token', token)
    .select('email')
    .single();

  if (error || !data) {
    return new NextResponse(renderPage('error', 'Invalid or expired link'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new NextResponse(renderPage('success', data.email), {
    headers: { 'Content-Type': 'text/html' },
  });
}

function renderPage(status: 'success' | 'error', info: string): string {
  const isSuccess = status === 'success';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isSuccess ? 'Unsubscribed' : 'Error'} - Radikal</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          background: #1a1a1a;
          color: #fff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          padding: 40px;
          max-width: 500px;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          color: ${isSuccess ? '#4CAF50' : '#e74c3c'};
          margin-bottom: 15px;
        }
        p {
          color: #999;
          margin-bottom: 30px;
        }
        .email {
          color: #fff;
          font-weight: bold;
        }
        a {
          color: #e74c3c;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${isSuccess ? '✓' : '✗'}</div>
        <h1>${isSuccess ? 'Successfully Unsubscribed' : 'Error'}</h1>
        <p>
          ${isSuccess 
            ? `You have been unsubscribed from the Radikal newsletter.<br><span class="email">${info}</span> will no longer receive notifications.`
            : info
          }
        </p>
        <a href="https://www.radikal.blog">← Back to Radikal</a>
      </div>
    </body>
    </html>
  `;
}
