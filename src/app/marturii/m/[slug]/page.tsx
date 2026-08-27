// Pagina unei marturii.
//
// Pasul 2708000: aceeasi pagina ca la bloguri - mod focus, cititor cu voce,
// vizualizari, distribuire, PDF, marirea textului, versete cu rosu, comentarii,
// marturia urmatoare/anterioara, marturii asemanatoare.
// Singura deosebire: se citeste din tabelul marturiilor.

'use client';

import ArticleDetail from '@/components/article/ArticleDetail';
import { TESTIMONY_SOURCE } from '@/components/article/articleSource';

export default function TestimonyPage() {
  return <ArticleDetail source={TESTIMONY_SOURCE} />;
}
