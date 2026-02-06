// FAQ Schema Component for SEO / FAQ-Schema-Komponente für SEO / Componentă Schema FAQ pentru SEO
// Adds structured FAQ data for rich snippets in search results
// Fügt strukturierte FAQ-Daten für Rich Snippets in Suchergebnissen hinzu
// Adaugă date structurate FAQ pentru rich snippets în rezultatele căutării

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export default function FAQSchema({ items }: FAQSchemaProps) {
  if (!items || items.length === 0) return null;
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}

// Visual FAQ Component with Schema
interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export function FAQAccordion({ items, className = '' }: FAQAccordionProps) {
  return (
    <>
      <FAQSchema items={items} />
      <div className={`space-y-4 ${className}`}>
        {items.map((item, index) => (
          <details
            key={index}
            className="group bg-gray-800 rounded-lg overflow-hidden"
          >
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750 transition-colors">
              <span className="font-medium text-white pr-4">{item.question}</span>
              <span className="text-gray-400 transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="p-4 pt-0 text-gray-300 leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
