// Breadcrumb Schema Component for SEO / Breadcrumb-Schema-Komponente für SEO / Componentă Schema Breadcrumb pentru SEO
// Adds structured breadcrumb data for better navigation display in search results
// Fügt strukturierte Breadcrumb-Daten für bessere Navigationsanzeige in Suchergebnissen hinzu
// Adaugă date structurate breadcrumb pentru afișare mai bună a navigării în rezultatele căutării

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export default function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const baseUrl = 'https://radikal-blog.vercel.app';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}

// Visual Breadcrumb Component with Schema
interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className = '' }: BreadcrumbNavProps) {
  return (
    <>
      <BreadcrumbSchema items={items} />
      <nav 
        aria-label="Breadcrumb" 
        className={`text-sm text-gray-400 ${className}`}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-600">/</span>
              )}
              {index === items.length - 1 ? (
                <span className="text-gray-300" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <a 
                  href={item.url}
                  className="hover:text-white transition-colors"
                >
                  {item.name}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Helper function to generate common breadcrumbs
export function generateBlogBreadcrumbs(
  postTitle: string,
  postSlug: string,
  category?: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Startseite', url: '/' },
    { name: 'Blog', url: '/blogs' },
  ];

  if (category) {
    breadcrumbs.push({
      name: category,
      url: `/blogs?category=${encodeURIComponent(category)}`,
    });
  }

  breadcrumbs.push({
    name: postTitle,
    url: `/blogs/${postSlug}`,
  });

  return breadcrumbs;
}
