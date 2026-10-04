import React from 'react';
import { Link } from 'react-router-dom';
import { TbArrowRight, TbClock } from 'react-icons/tb';
import Reveal from '../components/ui/Reveal';
import { getSeoForPath } from '../seo/routeSeo';

const POSTS = [
  {
    slug: 'nash-hotfilter',
    title: 'NashHotFilter & A Beautiful Mind',
    subtitle: 'From John Nash’s game theory to the equilibrium-inspired filter in BayanWin.',
    tag: 'Algorithms',
    readMins: 12,
    available: true,
  },
  {
    slug: 'miro-prediction',
    title: 'Miro prediction & the MiroFish wave',
    subtitle:
      'Multi-agent sandboxes, seed signals from the real world, and how BayanWin’s Miro layer echoes the same imagination.',
    tag: 'LLM · Swarm',
    readMins: 8,
    available: true,
  },
  {
    slug: 'pcso-658-results-analysis',
    title: 'PCSO 6/58 Results Analysis Philippines',
    subtitle:
      'A practical breakdown of Ultra Lotto 6/58 historical patterns, frequency ranges, and interpretation limits.',
    tag: 'Game Analysis',
    readMins: 9,
    available: true,
  },
  {
    slug: 'pcso-649-results-analysis',
    title: 'PCSO 6/49 Results Analysis Philippines',
    subtitle:
      'How to interpret Super Lotto 6/49 draw behavior using transition, gap, and error-distance context.',
    tag: 'Game Analysis',
    readMins: 9,
    available: true,
  },
  {
    slug: 'markov-chains-lottery',
    title: "The Fascinating World of Markov Chains: From Drunkard’s Walks to Google’s Algorithms",
    subtitle: "From drunkard's walks to Google's algorithms, and why memoryless systems matter.",
    tag: 'Algorithms',
    readMins: 10,
    available: true,
  },
  {
    slug: 'deep-reinforcement-learning',
    title: 'Deep Reinforcement Learning: Teaching Machines Through Trial and Triumph',
    subtitle: 'From Atari to AlphaGo: how agents learn through trial, reward, and adaptation.',
    tag: 'AI · DRL',
    readMins: 11,
    available: true,
  },
];

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
          {post.available ? (
            <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0 after:rounded-card">
              {post.title}
            </Link>
          ) : (
            post.title
          )}
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-silver-400">{post.subtitle}</p>
        {post.available ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-electric-300 group-hover:text-electric-200">
            Read article
            <TbArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        ) : (
          <span className="text-sm text-silver-500">Coming soon</span>
        )}
      </div>
    </article>
  );
}

export default BlogIndex;
