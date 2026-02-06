// RSS Feed Route / RSS-Feed-Route / Rută Feed RSS
// Generates RSS 2.0 feed for blog posts
// Generiert RSS 2.0 Feed für Blog-Beiträge
// Generează feed RSS 2.0 pentru articolele de blog
// RSS Feed for readers

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Strip HTML tags for description
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').substring(0, 500);
}

export async function GET() {
  try {
    // Fetch published blog posts
    const { data: posts, error } = await supabase
      .from('blogs')
      .select('id, slug, title_de, title_en, title_ro, title_ru, excerpt_de, excerpt_en, excerpt_ro, excerpt_ru, content_de, created_at, updated_at, author, featured_image')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching posts for RSS:', error);
      return new NextResponse('Error generating RSS feed', { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://radikal-blog.vercel.app';
    const now = new Date().toUTCString();

    // Generate RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>RADIKAL - Christliche Gedanken</title>
    <link>${siteUrl}</link>
    <description>Christliche Gedanken und Reflexionen - Christian Thoughts and Reflections - Gânduri și Reflecții Creștine</description>
    <language>de</language>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/radikal.logo.schwarz.hintergrund.png</url>
      <title>RADIKAL</title>
      <link>${siteUrl}</link>
    </image>
    ${posts?.map(post => `
    <item>
      <title>${escapeXml(post.title_de || post.title_en || 'Untitled')}</title>
      <link>${siteUrl}/blogs/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blogs/${post.slug}</guid>
      <description>${escapeXml(stripHtml(post.excerpt_de || post.excerpt_en || post.content_de || ''))}</description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      <author>${escapeXml(post.author || "Don't lie to yourself")}</author>
      ${post.featured_image ? `<enclosure url="${post.featured_image}" type="image/jpeg"/>` : ''}
    </item>`).join('') || ''}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('RSS generation error:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
