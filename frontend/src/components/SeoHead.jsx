import React from 'react';
import { Helmet } from 'react-helmet-async';

function SeoHead({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = 'https://bayanwin.net/favicon.png',
  jsonLd = null,
  robots = null,
  article = null,
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {robots ? <meta name="robots" content={robots} /> : null}

      <meta property="og:site_name" content="BayanWin" />
      <meta property="og:locale" content="en_PH" />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      {article ? <meta property="article:published_time" content={article.published} /> : null}
      {article ? <meta property="article:modified_time" content={article.modified} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd ? <script type="application/ld+json">{JSON.stringify(jsonLd)}</script> : null}
    </Helmet>
  );
}

export default SeoHead;
