'use client';

import { useParams } from 'next/navigation';
import ContentListPage from '@/components/content/ContentListPage';

export default function CopiiSectionPage() {
  const params = useParams<{ slug: string }>();
  return <ContentListPage kind="copii" sectionSlug={String(params?.slug || '')} />;
}
