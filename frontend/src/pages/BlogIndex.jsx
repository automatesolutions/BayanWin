import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const POSTS = [
  {
    slug: 'nash-hotfilter',
    title: 'NashHotFilter & A Beautiful Mind',
    subtitle: 'From John Nash’s game theory to the equilibrium-inspired filter in BayanWin.',
    tag: 'Algorithms',
    readMins: 12,
    accent: 'from-amber-500/20 to-orange-600/10',
    border: 'border-amber-500/40',
    available: true,
  },
  {
    slug: 'miro-prediction',
    title: 'Miro prediction & the MiroFish wave',
    subtitle:
      'Multi-agent sandboxes, seed signals from the real world, and how BayanWin’s Miro layer echoes the same imagination.',
    tag: 'LLM · Swarm',
    readMins: 8,
    accent: 'from-cyan-500/15 to-violet-900/25',
    border: 'border-cyan-400/35',
    available: true,
  },
  {
    slug: 'pcso-658-results-analysis',
    title: 'PCSO 6/58 Results Analysis Philippines',
    subtitle:
      'A practical breakdown of Ultra Lotto 6/58 historical patterns, frequency ranges, and interpretation limits.',
    tag: 'Game Analysis',
    readMins: 9,
    accent: 'from-emerald-500/15 to-teal-900/25',
    border: 'border-emerald-400/35',
    available: true,
  },
  {
    slug: 'pcso-649-results-analysis',
    title: 'PCSO 6/49 Results Analysis Philippines',
    subtitle:
      'How to interpret Super Lotto 6/49 draw behavior using transition, gap, and error-distance context.',
    tag: 'Game Analysis',
    readMins: 9,
    accent: 'from-lime-500/15 to-green-900/20',
    border: 'border-lime-400/35',
    available: true,
  },
  {
    slug: 'markov-chains-lottery',
    title: "The Fascinating World of Markov Chains: From Drunkard’s Walks to Google’s Algorithms",
    subtitle: "From drunkard's walks to Google's algorithms, and why memoryless systems matter.",
    tag: 'Algorithms',
    readMins: 10,
    accent: 'from-slate-600/30 to-slate-800/20',
    border: 'border-slate-500/30',
    available: true,
  },
  {
    slug: 'deep-reinforcement-learning',
    title: '🤖 Deep Reinforcement Learning: Teaching Machines Through Trial and Triumph',
    subtitle: 'From Atari to AlphaGo: how agents learn through trial, reward, and adaptation.',
    tag: 'AI · DRL',
    readMins: 11,
    accent: 'from-electric-500/15 to-blue-900/20',
    border: 'border-electric-500/30',
    available: true,
  },
];

function BlogIndex() {
  useEffect(() => {
    document.title = 'BayanWin Blog — algorithms, film & lottery analytics';
    return () => {
      document.title = 'BayanWin - PCSO results & AI driven predictions';
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-10 flex-1 max-w-6xl">
      <nav className="mb-8 text-sm text-slate-400">
        <Link to="/" className="text-electric-400 hover:text-electric-300 underline">
          Home
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-300">Blog</span>
      </nav>

      <header className="relative mb-14 overflow-hidden rounded-2xl border border-slate-600/50 bg-gradient-to-br from-slate-900 via-charcoal-900 to-slate-950 px-6 py-10 sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.4) 48px, rgba(255,255,255,0.4) 52px)',
          }}
          aria-hidden
        />
        <p className="text-xs font-mono uppercase tracking-[0.35em] text-amber-400/90 mb-3">Editorial</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          BayanWin <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-400">Blog</span>
        </h1>
        <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed">
          Long-form notes on the ideas behind the dashboard: movies that shaped how we talk about math, algorithms that
          encode intuition, and how decades of draw history feed the models.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {POSTS.map((post, i) => (
          <article
            key={post.slug}
            className={`group relative flex flex-col rounded-2xl border ${post.border} bg-gradient-to-b ${post.accent} p-6 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-orange-500/10 ${
              i === 0 ? 'md:col-span-2 lg:col-span-3 lg:flex-row lg:items-stretch lg:gap-8' : ''
            }`}
          >
            <div className={`flex-1 ${i === 0 ? 'lg:max-w-xl' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                    post.available ? 'bg-amber-500/25 text-amber-200' : 'bg-slate-600/40 text-slate-400'
                  }`}
                >
                  {post.tag}
                </span>
                {post.readMins != null && (
                  <span className="text-[11px] text-slate-500">{post.readMins} min read</span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 group-hover:text-amber-100 transition-colors">
                {post.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{post.subtitle}</p>
              {post.available ? (
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300"
                >
                  Read article
                  <span aria-hidden>→</span>
                </Link>
              ) : (
                <span className="inline-flex text-sm text-slate-500 cursor-not-allowed">Coming soon</span>
              )}
            </div>
            {i === 0 && (
              <div className="hidden lg:flex flex-1 items-center justify-center min-h-[140px] rounded-xl border border-dashed border-amber-500/25 bg-black/20">
                <p className="text-center text-xs text-slate-500 max-w-xs font-mono leading-relaxed">
                  Featured · Nash equilibrium · Hot-number balance ·
                  <br />
                  A Beautiful Mind (2001)
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}

export default BlogIndex;
