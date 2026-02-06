// Blog Post Schema Component for SEO Rich Snippets / Blog-Post-Schema-Komponente für SEO Rich Snippets / Componentă Schema Post Blog pentru Rich Snippets SEO
// Adds structured data (JSON-LD) to blog posts for better Google search results
// Fügt strukturierte Daten (JSON-LD) zu Blogposts für bessere Google-Suchergebnisse hinzu
// Adaugă date structurate (JSON-LD) la postările de blog pentru rezultate Google mai bune

interface BlogPostSchemaProps {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl?: string;
  url: string;
  keywords?: string[];
  wordCount?: number;
  readingTime?: number; // in minutes
  language?: string;
  category?: string;
}

export default function BlogPostSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  url,
  keywords = [],
  wordCount,
  readingTime,
  language = 'de',
  category,
}: BlogPostSchemaProps) {
  const baseUrl = 'https://radikal-blog.vercel.app';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    image: {
      '@type': 'ImageObject',
      url: image.startsWith('http') ? image : `${baseUrl}${image}`,
      width: 1200,
      height: 630,
    },
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl || baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'RADIKAL Blog',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/radikal.logo.schwarz.hintergrund.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url.startsWith('http') ? url : `${baseUrl}${url}`,
    },
    inLanguage: language,
    ...(keywords.length > 0 && { keywords: keywords.join(', ') }),
    ...(wordCount && { wordCount }),
    ...(readingTime && { timeRequired: `PT${readingTime}M` }),
    ...(category && { 
      articleSection: category,
      about: {
        '@type': 'Thing',
        name: category,
      }
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}
