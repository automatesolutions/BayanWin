import React from 'react';
import { Link } from 'react-router-dom';
import ArticleMeta from '../components/ArticleMeta';

const CONTEXT_ITEMS = [
  ['Game rules', 'the number range and how many numbers to pick, so every answer can be checked against the game.'],
  ['The six base picks', 'the lines from XGBoost, Decision Tree, Markov Chain, Anomaly Detection, NashHotFilter, and DRL.'],
  [
    'Model overlap',
    'how many models chose each number (top 20), and the 10 model pairs whose picks share the most numbers.',
  ],
  [
    'Past error by model',
    'how far each model’s earlier picks landed from the real draws. A lower error distance means closer.',
  ],
  ['Hot, cold, and overdue numbers', 'up to 15 overdue numbers, each with the days since it was last drawn.'],
  ['Sum and product bands', 'the usual range of the six-number sum and product in past draws.'],
  [
    'Pair and transition graphs',
    'the 45 strongest co-occurrence pairs and the 45 strongest draw-to-draw transitions, from up to 2,000 draws.',
  ],
];

function BlogMiroPrediction() {
  return (
    <main id="main" className="page max-w-4xl">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="link">
          Home
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <Link to="/blog" className="link">
          Blog
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <span className="text-slate-300">Miro prediction</span>
      </nav>

      <article className="article text-slate-200 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">How Miro merges six models into one pick</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Miro is the seventh prediction on the BayanWin dashboard. It runs no statistics of its own. It reads the
            picks of the six numeric models and the analytics behind them, then a language model proposes one
            six-number line. This article explains each step, the checks around it, and what Miro can’t do.
          </p>
          <ArticleMeta />
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Where Miro sits in the pipeline</h2>
          <p>
            When you run the models for a PCSO game, six numeric models run first: XGBoost, Decision Tree, Markov
            Chain, Anomaly Detection, NashHotFilter, and Deep Reinforcement Learning (DRL). Each one returns six
            numbers. These models often disagree, because each looks at a different part of the draw history.
          </p>
          <p>
            Miro runs after them and has 180 seconds to answer. If it takes longer, or if the server has no language
            model key, Miro returns an error message instead of a pick. The other six results stay on screen either
            way.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">What Miro reads</h2>
          <p>
            Before any language model call, the server builds one bundle of data for the selected game. Every list in
            it has a fixed cap, so the bundle stays the same size from draw to draw:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            {CONTEXT_ITEMS.map(([term, text]) => (
              <li key={term}>
                <strong className="text-slate-100">{term}:</strong> {text}
              </li>
            ))}
          </ul>
          <p>
            Miro sees only this bundle. It has no web access, no news, and no information about the next draw, because
            no such information exists before the draw.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Round one: six analyst voices</h2>
          <p>
            In the first call, the language model writes one short response for each of the six models, in a fixed
            order. Each response has a paragraph that reacts to the other models, up to eight preferred numbers, and up
            to three concerns. A concern can be as plain as “three of my numbers are also cold numbers.”
          </p>
          <p>
            These voices are not the models running again. They are written perspectives, based on each model’s pick
            and the shared data. The instructions say that draws are random and that no voice may claim better odds.
            The call runs at a low temperature (0.35), so the wording stays focused but can still vary.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Round two: the chairman picks one line</h2>
          <p>
            The second call plays a chairman. It gets the full data bundle and all six responses from round one. It
            must return exactly six different whole numbers inside the game’s range, plus an optional one-line reason.
            It is told to weigh where the models disagree, the pair and transition graphs, hot, cold, and overdue
            numbers, each model’s past error, and the sum and product bands. This call runs at an even lower temperature
            (0.25).
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Checks and fallbacks</h2>
          <p>
            Language models sometimes return a duplicate number, a number outside the range, or broken data. The server
            checks the chairman’s answer before it shows anything: six numbers, all whole, all in range, with no
            repeats.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>If the answer passes, Miro shows it, sorted from low to high.</li>
            <li>
              If it fails, the server sends one repair request that asks only for a valid list of six numbers, at
              temperature 0.1.
            </li>
            <li>
              If the repair also fails, Miro stops using the language model. It counts how many of the six base models
              chose each number and takes the six with the most votes. Ties go to the lower number. If fewer than six
              numbers got votes, it fills the gaps with the lowest unused numbers.
            </li>
          </ol>
          <p>
            Because of this order, Miro always shows either a valid line or a clear error, never broken numbers.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">How Miro is scored</h2>
          <p>
            Each Miro line is saved with the draw date it targets, next to the other models’ picks. After the official
            result comes in, BayanWin scores it with the same error-distance check as every other model. You can compare
            Miro’s record with the six base models on the dashboard. The{' '}
            <Link to="/methodology" className="link">
              methodology page
            </Link>{' '}
            explains how error distance works.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">What Miro can’t do</h2>
          <p>
            Miro can’t see the future, and it can’t change the odds. Every PCSO draw is random. A 6/58 ticket has a 1
            in 40,475,358 chance of matching all six numbers, whichever model picked it.
          </p>
          <p>
            Language models write with confidence even when the data supports nothing. Treat the chairman’s reason as a
            summary of the inputs, not as evidence. Two runs on the same data can also give different lines, because
            both calls allow some variation.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Why we built it</h2>
          <p>
            Six disagreeing lines are hard to read. Miro gives you one merged line, and the round-one voices show where
            the models agree and where they split. The vote fallback keeps the dashboard working when the language
            model fails, and the saved scores show over time whether merging helps at all.
          </p>
          <p>
            An earlier version of this article compared Miro with MiroFish, a separate multi-agent simulation project.
            Miro is not related to it and uses none of its code.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">Related articles</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <Link to="/blog/nash-hotfilter" className="link">
                How NashHotFilter builds a balanced line
              </Link>
            </li>
            <li>
              <Link to="/blog/deep-reinforcement-learning" className="link">
                Deep reinforcement learning for lottery analysis
              </Link>
            </li>
            <li>
              <Link to="/methodology" className="link">
                BayanWin methodology and model limits
              </Link>
            </li>
          </ul>
        </section>

        <p className="text-xs text-slate-500 border-t border-slate-600/50 pt-5">
          BayanWin is not affiliated with PCSO. Lottery draws are random, and no model or language model can predict
          them. Play only with money you can afford to lose. 18+ only.
        </p>

        <p>
          <Link to="/blog" className="link text-sm font-medium">
            ← Back to Blog
          </Link>
        </p>
      </article>
    </main>
  );
}

export default BlogMiroPrediction;
