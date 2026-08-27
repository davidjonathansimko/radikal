// Pagina unui articol de blog.
//
// Pasul 2708000: tot ce se vede aici vine din `ArticleDetail`, aceeași
// componentă folosită și de mărturii. Diferența e doar „de unde citim".

'use client';

import ArticleDetail from '@/components/article/ArticleDetail';
import { BLOG_SOURCE } from '@/components/article/articleSource';

export default function BlogPostPage() {
  return <ArticleDetail source={BLOG_SOURCE} />;
}
