'use client';

import ArticleDetail from '@/components/article/ArticleDetail';
import { ANDACHT_SOURCE } from '@/components/article/articleSource';

export default function AndachtArticlePage() {
  return <ArticleDetail source={ANDACHT_SOURCE} />;
}
