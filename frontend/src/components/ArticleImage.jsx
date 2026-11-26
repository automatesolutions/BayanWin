import React from 'react';

/**
 * Header photo under an article's title. It's the first large image on the page,
 * so it loads eagerly with high priority. Fixed width and height stop layout shift.
 */
function ArticleImage({ src, alt }) {
  return (
    <figure className="overflow-hidden rounded-card border border-white/[0.07] bg-charcoal-800">
      <img
        src={src}
        alt={alt}
        width="1200"
        height="672"
        fetchpriority="high"
        decoding="async"
        className="aspect-[1200/672] h-auto w-full object-cover"
      />
    </figure>
  );
}

export default ArticleImage;
