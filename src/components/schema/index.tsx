// Schema Components Index / Schema-Komponenten-Index / Index Componente Schema
// Export all schema components from a single location
// Exportiert alle Schema-Komponenten von einem einzigen Ort
// Exportă toate componentele schema dintr-o singură locație

export { default as BlogPostSchema } from './BlogPostSchema';
export { default as OrganizationSchema, WebsiteSchema } from './OrganizationSchema';
export { default as BreadcrumbSchema, BreadcrumbNav, generateBlogBreadcrumbs } from './BreadcrumbSchema';
export { default as FAQSchema, FAQAccordion } from './FAQSchema';

// Article Schema for generic articles
interface ArticleSchemaProps {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  url: string;
}

export function ArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  url,
}: ArticleSchemaProps) {
  const baseUrl = 'https://radikal-blog.vercel.app';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image.startsWith('http') ? image : `${baseUrl}${image}`,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'RADIKAL Blog',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/radikal.logo.schwarz.hintergrund.png`,
      },
    },
    mainEntityOfPage: url.startsWith('http') ? url : `${baseUrl}${url}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}

// Person Schema for author pages
interface PersonSchemaProps {
  name: string;
  description?: string;
  image?: string;
  url?: string;
  jobTitle?: string;
  sameAs?: string[];
}

export function PersonSchema({
  name,
  description,
  image,
  url,
  jobTitle,
  sameAs = [],
}: PersonSchemaProps) {
  const baseUrl = 'https://radikal-blog.vercel.app';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: name,
    ...(description && { description }),
    ...(image && { image: image.startsWith('http') ? image : `${baseUrl}${image}` }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    ...(jobTitle && { jobTitle }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}

// Collection Page Schema for blog listing
interface CollectionPageSchemaProps {
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
}

export function CollectionPageSchema({
  name,
  description,
  url,
  numberOfItems,
}: CollectionPageSchemaProps) {
  const baseUrl = 'https://radikal-blog.vercel.app';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: name,
    description: description,
    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
    numberOfItems: numberOfItems,
    provider: {
      '@type': 'Organization',
      name: 'RADIKAL Blog',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}
