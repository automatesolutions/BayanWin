import React from 'react';
import { Link } from '../components/SiteLink';
import ArticleMeta from '../components/ArticleMeta';
import ArticleImage from '../components/ArticleImage';
import miroImage from '../assets/articles/miro.webp';
import AuthorBio from '../components/AuthorBio';
import { allGames, formatNumber } from '../data/stats';

const CONTEXT_ITEMS = [
  ['Game rules', 'the number range and how many numbers to pick, so every answer can be checked.'],
  ['The six base picks', 'the lines from XGBoost, Decision Tree, Markov Chain, Anomaly Detection, NashHotFilter, and DRL.'],
  ['Model overlap', 'how many models chose each number, and which model pairs share the most numbers.'],
  ['Past error by model', 'how far each model’s earlier picks landed from the real draws. Lower means closer.'],
  ['Hot, cold, and overdue numbers', 'up to 15 overdue numbers, each with the days since it was last drawn.'],
  ['Sum and product bands', 'the usual range of the six-number sum and product in past draws.'],
  [
    'Pair and transition graphs',
    'the 45 strongest pairs that come up together and the 45 strongest draw-to-draw transitions, from up to 2,000 draws.',
  ],
];

const choose = (n, k) => {
  let r = 1;
  for (let i = 0; i < k; i += 1) r = (r * (n - i)) / (i + 1);
  return r;
};

/** Chance that one line of 6 matches at least `k` numbers in a 6/`balls` draw. */
const atLeast = (balls, k) => {
  let p = 0;
  for (let m = k; m <= 6; m += 1) p += (choose(6, m) * choose(balls - 6, 6 - m)) / choose(balls, 6);
  return p;
};

const oneIn = (p) => `1 in ${formatNumber(1 / p)}`;
const GAMES = allGames();

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
            This article answers one question: how does Miro turn six model outputs into one line, and how much should
            you trust it? Miro is the seventh pick on the BayanWin dashboard. It runs no statistics of its own. It reads
            the six numeric models’ picks and the data behind them, and a language model proposes one six-number line.
          </p>
          <ArticleMeta />
        </header>

        <ArticleImage src={miroImage} alt="Six colored cards on a cork board, each tied by string to one card in the middle" />

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Where Miro sits</h2>
          <p>
            When you run the models for a PCSO game, six numeric models run first: XGBoost, Decision Tree, Markov Chain,
            Anomaly Detection, NashHotFilter, and Deep Reinforcement Learning (DRL). Each returns six numbers. They often
            disagree, because each looks at a different part of the draw history.
          </p>
          <p>
            Miro runs after them. If the server has no language model key, Miro shows an error instead of a pick. The
            other six picks stay on screen either way.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">What Miro reads</h2>
          <p>
            Before any language model call, the server builds one bundle of data for the game. Every list in it has a
            fixed cap, so the bundle stays the same size from draw to draw:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            {CONTEXT_ITEMS.map(([term, text]) => (
              <li key={term}>
                <strong className="text-slate-100">{term}:</strong> {text}
              </li>
            ))}
          </ul>
          <p>
            Miro sees only this bundle. It has no web access and no news. Nobody has information about the next draw
            before it happens, so Miro doesn’t either.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Round one: six analyst voices</h2>
          <p>
            In the first call, the language model writes one short response for each of the six models, in a fixed
            order. Each response has a paragraph that reacts to the other models, up to 8 preferred numbers, and up to 3
            concerns. A concern can be as plain as “three of my numbers are also cold numbers.”
          </p>
          <p>
            These voices are not the models running again. They’re written views based on each model’s pick and the
            shared data. The instructions say draws are random and no voice may claim better odds. The call runs at a
            low temperature (0.35), so the wording stays focused but can still vary.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Round two: the chairman picks one line</h2>
          <p>
            The second call plays a chairman. It gets the full data bundle and all six responses from round one. It
            must return exactly 6 different whole numbers inside the game’s range, plus an optional one-line reason.
          </p>
          <p>
            Its instructions tell it to weigh model disagreement, the pair and transition graphs, and hot, cold, and
            overdue numbers. It also weighs each model’s past error and the sum and product bands. This call runs at an
            even lower temperature (0.25).
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Checks and fallbacks</h2>
          <p>
            Language models sometimes return a repeated number, a number out of range, or broken data. The server checks
            the chairman’s answer before it shows anything: 6 numbers, all whole, all in range, with no repeats.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>If the answer passes, Miro shows it, sorted from low to high.</li>
            <li>
              If it fails, the server sends one repair request at temperature 0.1. It asks only for a valid list of 6
              numbers.
            </li>
            <li>
              If the repair also fails, Miro stops using the language model. It counts how many base models chose each
              number and takes the 6 with the most votes. Ties go to the lower number. If fewer than 6 numbers got
              votes, it fills the gaps with the lowest unused numbers.
            </li>
          </ol>
          <p>
            If the whole step fails or runs past its time limit, the server tries a smaller language model. After that
            it uses the same vote, then the last valid Miro line saved for that game and draw date. If every option
            fails, Miro shows a short error, never broken numbers.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">How Miro is scored</h2>
          <p>
            We save each Miro line with the draw date it targets, next to the other models’ picks. After the official
            result comes in, we score it with the same error-distance check as every other model. You can compare
            Miro’s record with the six base models on the dashboard. The{' '}
            <Link to="/methodology" className="link">
              methodology page
            </Link>{' '}
            explains how error distance works.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="sec-miro-odds">
          <h2 id="sec-miro-odds" className="text-xl font-semibold text-white">
            What one line is up against
          </h2>
          <p>
            Miro gives you one line of 6 numbers. The table shows the chance that one line matches at least 3, 4, or 5
            numbers, or all 6, in a single draw.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[560px]">
              <caption className="sr-only">Chance that one line matches 3 or more numbers, by game</caption>
              <thead>
                <tr>
                  <th scope="col">Game</th>
                  <th scope="col" className="text-right">3 or more</th>
                  <th scope="col" className="text-right">4 or more</th>
                  <th scope="col" className="text-right">5 or more</th>
                  <th scope="col" className="text-right">All 6</th>
                </tr>
              </thead>
              <tbody>
                {GAMES.map((g) => (
                  <tr key={g.key}>
                    <th scope="row" className="whitespace-nowrap text-left font-mono font-semibold text-white tabular">
                      {g.key}
                    </th>
                    <td className="whitespace-nowrap text-right font-mono tabular">{oneIn(atLeast(g.balls, 3))}</td>
                    <td className="whitespace-nowrap text-right font-mono tabular">{oneIn(atLeast(g.balls, 4))}</td>
                    <td className="whitespace-nowrap text-right font-mono tabular">{oneIn(atLeast(g.balls, 5))}</td>
                    <td className="whitespace-nowrap text-right font-mono tabular">1 in {formatNumber(g.odds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Merging six models doesn’t change any of these numbers. A Miro line faces the same odds as any other line
            of 6.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">How much to trust Miro</h2>
          <p>
            Trust Miro as a summary, not a forecast. It can’t see the future, and it can’t change the odds. Every PCSO
            draw is random.
          </p>
          <p>
            Language models write with confidence even when the data supports nothing. Read the chairman’s reason as a
            summary of the inputs, not as evidence. Two runs on the same data can give different lines, because both
            calls allow some variation.
          </p>
          <p>
            Miro is useful for reading six disagreeing lines at once. The round-one voices show where the models agree
            and where they split. The saved scores show over time whether merging helps at all.
          </p>
          <p>
            An earlier version of this article compared Miro with MiroFish, a separate multi-agent simulation project.
            Miro isn’t related to it and uses none of its code.
          </p>
        </section>

        <AuthorBio />

        <section className="space-y-3 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">Related reading</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <Link to="/blog/nash-hotfilter" className="link">
                Do hot numbers help? How NashHotFilter builds a line
              </Link>
            </li>
            <li>
              <Link to="/blog/deep-reinforcement-learning" className="link">
                Deep reinforcement learning for lottery analysis
              </Link>
            </li>
            <li>
              <Link to="/blog/markov-chains-lottery" className="link">
                Markov chain lottery analysis in the Philippines
              </Link>
            </li>
            <li>
              <Link to="/methodology" className="link">
                BayanWin methodology and model limits
              </Link>
            </li>
            <li>
              <Link to="/responsible-play" className="link">
                Responsible play
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
