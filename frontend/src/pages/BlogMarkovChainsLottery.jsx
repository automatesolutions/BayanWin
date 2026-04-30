import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function BlogMarkovChainsLottery() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "The Fascinating World of Markov Chains: From Drunkard’s Walks to Google’s Algorithms";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <nav className="mb-6 text-sm text-slate-400">
        <Link to="/" className="text-electric-400 hover:text-electric-300 underline">
          Home
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <Link to="/blog" className="text-electric-400 hover:text-electric-300 underline">
          Blog
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-300">The Fascinating World of Markov Chains: From Drunkard’s Walks to Google’s Algorithms</span>
      </nav>

      <article className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-5 py-8 text-slate-200 shadow-sm space-y-6">
        <header>
          <p className="text-xs font-mono uppercase tracking-wider text-electric-300 mb-2">Algorithm Notes</p>
          <h1 className="text-3xl font-bold text-white mb-2">
            The Fascinating World of Markov Chains: From Drunkard’s Walks to Google’s Algorithms
          </h1>
          <p className="text-slate-400 text-sm">
            Imagine a drunk man stumbling down a street. At each step, he can either move one step forward or one step
            back, with equal probability. He doesn&apos;t remember where he came from-he only knows where he is right now.
            This simple, quirky scenario is actually one of the most famous illustrations of a Markov chain.
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">📖 A Story Rooted in History</h2>
          <p>
            In 1906, Russian mathematician Andrey Markov challenged the idea that randomness always required
            independence. He showed that even when events depend on the immediate past, powerful mathematical laws still
            hold. To prove it, he analyzed the distribution of vowels and consonants in Pushkin&apos;s Eugene Onegin. Yes,
            poetry helped launch one of the most important concepts in probability theory.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">🔄 What Makes a Markov Chain Special?</h2>
          <p>At its heart, a Markov chain is about memorylessness:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The future depends only on the present.</li>
            <li>The past doesn&apos;t matter once you know the current state.</li>
          </ul>
          <p>
            Think of it like playing a board game where the dice roll determines your next move. It doesn&apos;t matter how
            you got to your current square-only where you are now.
          </p>
          <figure className="rounded-lg overflow-hidden border border-slate-600/60 bg-black/20">
            <img
              src="/markov_chain/markov-chain-detected-markov.gif"
              alt="Animated visualization of Markov chain state transitions"
              className="w-full h-auto"
              loading="lazy"
            />
            <figcaption className="text-xs text-slate-400 px-3 py-2">
              Visual intuition: each move depends on the current state, not full history.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">🌍 Real-World Adventures of Markov Chains</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-slate-100">Card Shuffling:</strong> Henri Poincare studied them to understand how
              many shuffles it takes before a deck of cards is random enough.
            </li>
            <li>
              <strong className="text-slate-100">Economics &amp; Finance:</strong> Stock market fluctuations often rely on
              Markov models to predict trends.
            </li>
            <li>
              <strong className="text-slate-100">Speech Recognition:</strong> Your phone&apos;s voice assistant uses hidden
              Markov models to guess what word you&apos;re saying.
            </li>
            <li>
              <strong className="text-slate-100">Google&apos;s PageRank:</strong> The algorithm that made Google famous is
              essentially a giant Markov chain, deciding which websites you&apos;re most likely to walk to next.
            </li>
          </ul>
          <figure className="rounded-lg overflow-hidden border border-slate-600/60 bg-black/20">
            <video
              src="/markov_chain/Markov_chains.mp4"
              className="w-full h-auto"
              controls
              preload="metadata"
            />
            <figcaption className="text-xs text-slate-400 px-3 py-2">
              Markov chains in motion: transition behavior across states over time.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">🎮 Fun Examples You Can Picture</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-slate-100">The Drunkard&apos;s Walk:</strong> Each step is random, but over time,
              patterns emerge.
            </li>
            <li>
              <strong className="text-slate-100">Gambler&apos;s Ruin:</strong> A casino player keeps betting until they either
              win big or lose everything. The probabilities of ruin can be modeled with Markov chains.
            </li>
            <li>
              <strong className="text-slate-100">Mark V. Shaney:</strong> A quirky text generator from the 1980s that
              stitched together Usenet posts using Markov chains, producing hilarious nonsense sentences.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">🚀 Why Should You Care?</h2>
          <p>
            Markov chains are the backbone of simulation, prediction, and AI. From weather forecasting to DNA sequencing,
            they help us make sense of uncertainty. They show us that even in randomness, there&apos;s structure-and that
            structure can be harnessed to solve real problems.
          </p>
          <h3 className="text-lg font-semibold text-white pt-2">How BayanWin uses it</h3>
          <p>
            In BayanWin, MarkovChain is one of multiple models. We compare it with tree-based and frequency-driven models
            and surface differences so users can inspect model behavior rather than rely on a single output.
          </p>
          <p>
            For broader context, read{' '}
            <Link to="/about" className="text-electric-400 hover:text-electric-300 underline">
              About BayanWin
            </Link>{' '}
            and our{' '}
            <Link to="/responsible-play" className="text-electric-400 hover:text-electric-300 underline">
              Responsible Play
            </Link>{' '}
            guidance.
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-600/50 pt-6" aria-labelledby="related-articles">
          <h2 id="related-articles" className="text-lg font-semibold text-white">
            Related Articles
          </h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
            <li>
              <Link to="/blog/nash-hotfilter" className="text-electric-400 hover:text-electric-300 underline">
                Game theory lottery analysis in the Philippines
              </Link>
            </li>
            <li>
              <Link to="/blog/deep-reinforcement-learning" className="text-electric-400 hover:text-electric-300 underline">
                AI lottery prediction methods (Deep RL)
              </Link>
            </li>
            <li>
              <Link to="/methodology" className="text-electric-400 hover:text-electric-300 underline">
                PCSO data sources and model methodology
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </main>
  );
}

export default BlogMarkovChainsLottery;
