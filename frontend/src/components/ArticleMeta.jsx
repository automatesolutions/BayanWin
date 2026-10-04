import React from 'react';
import { useLocation } from 'react-router-dom';
import { getSeoForPath } from '../seo/routeSeo';

// Fixed locale and UTC so the prerendered HTML matches the client on hydration.
const fmt = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

/** Byline with publish and update dates. Same dates as the page's Article schema. */
function ArticleMeta({ className = 'mt-3' }) {
  const { pathname } = useLocation();
  const { article } = getSeoForPath(pathname);
  if (!article) return null;

  return (
    <p className={`text-xs text-silver-500 ${className}`}>
      By the BayanWin team · Published <time dateTime={article.published}>{fmt(article.published)}</time>
      {article.modified !== article.published && (
        <>
          {' '}
          · Updated <time dateTime={article.modified}>{fmt(article.modified)}</time>
        </>
      )}
    </p>
  );
}

export default ArticleMeta;
