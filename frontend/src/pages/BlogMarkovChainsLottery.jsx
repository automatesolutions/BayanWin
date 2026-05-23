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
            In BayanWin, the Markov-style model is one member of a six-model ensemble that also includes XGBoost,
            Decision Tree, NashHotFilter, Deep Reinforcement Learning, and the Miro LLM synthesis layer. For PCSO
            lottery games (6/42, 6/45, 6/49, 6/55, and 6/58), the model builds a transition matrix from years of
            draw history and identifies which numbers tend to follow which sequences. Because lottery draws are
            statistically independent events, the model does not claim causal power — instead it surfaces
            <strong className="text-slate-200"> sequence patterns in the historical record</strong> that you can
            compare against other model outputs.
          </p>
          <p>
            We surface all model outputs simultaneously in the Council Panel, so you can see where the Markov
            model agrees with tree-based or frequency-driven models (potentially higher-confidence signals for
            exploration) and where it diverges (a reminder to be cautious). This multi-model approach is more
            transparent than relying on a single black-box algorithm.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="markov-philippines">
          <h2 id="markov-philippines" className="text-xl font-semibold text-white">
            Markov chains and Philippine lottery analysis
          </h2>
          <p>
            The Philippines Charity Sweepstakes Office (PCSO) has been running six-ball lottery draws for decades,
            which means there are thousands of historical results available for analysis. This depth of data is what
            makes transition-based models like Markov chains meaningful: with only a few dozen results, transition
            estimates are noisy; with thousands, the statistical regularities become clearer (while still not
            predictive of any individual future draw).
          </p>
          <p>
            For each PCSO game, BayanWin maintains a separate transition model calibrated to that game's number
            pool size. The 6/42 pool behaves differently from the 6/58 pool purely because of the number of
            possible outcomes — and the Markov model's transition matrix reflects those differences in the
            historical record. Users can view the Markov graph visualization directly in the dashboard after
            selecting any game.
          </p>
          <p>
            An important practical limitation: PCSO lottery balls are drawn without replacement within each game,
            making the process a sampling event rather than a simple state-transition process. The Markov
            abstraction used here treats the drawn combination as a "state" for modelling purposes — a useful
            simplification for pattern exploration, not a strict mathematical match to the physical draw process.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="markov-deeper">
          <h2 id="markov-deeper" className="text-xl font-semibold text-white">
            Deeper concepts: stationary distributions and mixing times
          </h2>
          <p>
            Beyond simple transition probabilities, two concepts matter for anyone wanting to go deeper into
            Markov chain theory:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">Stationary distribution</strong> — over many steps, a Markov
              chain often converges to a stable probability distribution across its states, regardless of the
              starting point. For a truly random lottery, this stationary distribution is uniform (every number
              equally likely). Comparing observed long-run frequencies to this uniform baseline is exactly the
              kind of analysis BayanWin&apos;s frequency charts provide.
            </li>
            <li>
              <strong className="text-slate-200">Mixing time</strong> — how many steps it takes for the chain to
              get close to its stationary distribution. A chain with fast mixing (like a well-shuffled lottery)
              &quot;forgets&quot; its starting state quickly. This is one reason why short-term historical windows
              can look patterned even in genuinely random data.
            </li>
          </ul>
          <p>
            These concepts explain why Markov models are genuinely useful for understanding lottery history without
            implying they can predict the future. They describe how the system has behaved, not how it will behave
            next.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="markov-faq">
          <h2 id="markov-faq" className="text-xl font-semibold text-white">
            FAQ: Markov chains and lottery prediction
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-200">
                Can a Markov chain predict the next PCSO lottery draw?
              </h3>
              <p className="text-slate-400 mt-1">
                No. PCSO draws use certified random mechanisms where each draw is independent of previous results.
                A Markov chain model can describe historical sequence patterns, but it cannot predict a genuinely
                random outcome. BayanWin's Markov output is an exploratory tool for studying historical behaviour,
                not a forecasting system.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">
                Why is the Markov model one of several in BayanWin rather than the only one?
              </h3>
              <p className="text-slate-400 mt-1">
                Because no single model captures every aspect of a complex historical dataset. XGBoost captures
                non-linear tabular relationships; frequency models show raw appearance rates; NashHotFilter
                incorporates balance heuristics; Deep RL adapts to feedback over time. Each model reflects a
                different set of assumptions, and comparing their outputs is more informative than trusting any
                one of them alone.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">
                Is the drunkard&apos;s walk a good mental model for lottery draws?
              </h3>
              <p className="text-slate-400 mt-1">
                Partially. The drunkard&apos;s walk illustrates memorylessness (each step is independent of prior
                path), which is a valid analogy for lottery draws. However, the walk is on a continuous line while
                a lottery draw selects from a fixed pool of numbers without replacement — so the analogy is useful
                for intuition but should not be taken literally when interpreting model outputs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">
                How do I view the Markov analysis for a specific PCSO game on BayanWin?
              </h3>
              <p className="text-slate-400 mt-1">
                Go to the <Link to="/" className="text-electric-400 hover:text-electric-300 underline">homepage</Link>,
                select a game (e.g. 6/49 or 6/58), then scroll down to the Markov Graph visualisation. The graph
                shows transition relationships between number groups based on the loaded historical window. You can
                also generate algorithmic predictions to see the Markov model&apos;s candidate output alongside
                all other models.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">
                Where can I learn more about the mathematical theory behind Markov chains?
              </h3>
              <p className="text-slate-400 mt-1">
                Standard university probability and stochastic processes textbooks cover Markov chains in depth.
                Online resources from MIT OpenCourseWare (18.650 Statistics for Applications) and similar courses
                provide accessible introductions. Andrey Markov&apos;s original 1906 paper on dependent trials
                in sequences is also available in translation for the historically curious.
              </p>
            </div>
          </div>
        </section>

        <div className="rounded-lg bg-amber-950/25 border border-amber-500/20 px-4 py-3 text-xs text-amber-100/80">
          <strong className="text-amber-200">Disclaimer:</strong> This article is for educational purposes only.
          BayanWin is not affiliated with PCSO. Lottery outcomes are random; historical patterns do not predict
          future results. No guaranteed wins exist. Play responsibly and within your means.
          <br /><br />
          For broader context, read{' '}
          <Link to="/about" className="text-electric-400 hover:text-electric-300 underline">About BayanWin</Link>{' '}
          and our{' '}
          <Link to="/responsible-play" className="text-electric-400 hover:text-electric-300 underline">Responsible Play</Link>{' '}
          guidance.
        </div>

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
