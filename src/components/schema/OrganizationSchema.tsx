// Organization Schema Component for SEO / Organisation-Schema-Komponente für SEO / Componentă Schema Organizație pentru SEO
// Adds structured data about the organization to the website
// Fügt strukturierte Daten über die Organisation zur Website hinzu
// Adaugă date structurate despre organizație la website

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  email?: string;
  socialLinks?: string[];
}

export default function OrganizationSchema({
  name = 'RADIKAL Blog',
  url = 'https://radikal-blog.vercel.app',
  logo = '/radikal.logo.schwarz.hintergrund.png',
  description = 'Radikale Bibellehre Blog - Entdecke tiefgreifende geistliche Einsichten und authentische biblische Wahrheiten.',
  email = 'kontakt@radikal-blog.de',
  socialLinks = [],
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: name,
    url: url,
    logo: {
      '@type': 'ImageObject',
      url: logo.startsWith('http') ? logo : `${url}${logo}`,
      width: 512,
      height: 512,
    },
    description: description,
    email: email,
    ...(socialLinks.length > 0 && { sameAs: socialLinks }),
    contactPoint: {
      '@type': 'ContactPoint',
      email: email,
      contactType: 'customer service',
      availableLanguage: ['German', 'English', 'Romanian'],
    },
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'D.S.',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}

// Website Schema - for sitelinks searchbox
export function WebsiteSchema() {
  const baseUrl = 'https://radikal-blog.vercel.app';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RADIKAL Blog',
    url: baseUrl,
    description: 'Radikale Bibellehre Blog - Tiefgreifende geistliche Einsichten',
    inLanguage: 'de',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/blogs?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'RADIKAL Blog',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/radikal.logo.schwarz.hintergrund.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}
