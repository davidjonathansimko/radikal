'use client';

import ArticleDetail from '@/components/article/ArticleDetail';
import { COPII_SOURCE } from '@/components/article/articleSource';

export default function CopiiArticlePage() {
  return <ArticleDetail source={COPII_SOURCE} />;
}
