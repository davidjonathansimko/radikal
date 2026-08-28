'use client';

import { useParams } from 'next/navigation';
import ContentListPage from '@/components/content/ContentListPage';

export default function AndachtSectionPage() {
  const params = useParams<{ slug: string }>();
  return <ContentListPage kind="andacht" sectionSlug={String(params?.slug || '')} />;
}
