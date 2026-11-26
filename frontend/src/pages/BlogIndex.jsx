import React from 'react';
import { Link } from '../components/SiteLink';
import { TbArrowRight, TbClock } from 'react-icons/tb';
import Reveal from '../components/ui/Reveal';
import { getSeoForPath } from '../seo/routeSeo';
import { POSTS } from '../content/posts';

function BlogIndex() {
  const [featured, ...rest] = POSTS;

  return (
    <main id="main" className="page max-w-6xl">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="link">
          Home
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <span className="text-silver-300">Blog</span>
      </nav>

      <header className="mb-12 max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
          The ideas behind the dashboard
        </h1>
        <p className="text-lg leading-relaxed text-silver-400">
          Long-form notes on the math and models BayanWin uses, the films that shaped how people talk about them, and
          how decades of PCSO draw history feed each one.
        </p>
      </header>

      <Reveal className="space-y-6">
        <PostCard post={featured} featured />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </Reveal>
    </main>
  );
}

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function PostCard({ post, featured = false }) {
  const modified = getSeoForPath(`/blog/${post.slug}`).article?.modified;
  return (
    <article
      data-reveal
      className={`group relative flex flex-col rounded-card border border-white/[0.07] bg-charcoal-800 p-6 transition-colors hover:border-white/[0.15] hover:bg-charcoal-700/70 ${
        featured ? 'sm:p-8 lg:p-10' : ''
      }`}
    >
      <div className="flex-1">
        <div className="mb-3 flex items-center gap-3">
          <span className="chip">{post.tag}</span>
          {post.readMins != null && (
            <span className="inline-flex items-center gap-1 text-xs text-silver-500">
              <TbClock className="h-3.5 w-3.5" aria-hidden />
              {post.readMins} min read
            </span>
          )}
          {modified && (
            <span className="text-xs text-silver-500">
              Updated <time dateTime={modified}>{formatDate(modified)}</time>
            </span>
          )}
        </div>
        <h2
          className={`mb-2 font-semibold leading-snug text-white ${
            featured ? 'max-w-3xl text-2xl sm:text-3xl' : 'text-lg'
          }`}
        >
          <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0 after:rounded-card">
            {post.title}
          </Link>
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-silver-400">{post.subtitle}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-electric-300 group-hover:text-electric-200">
          Read article
          <TbArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </article>
  );
}

export default BlogIndex;
