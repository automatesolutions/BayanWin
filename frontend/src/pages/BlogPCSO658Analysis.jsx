import React from 'react';
import { Link } from '../components/SiteLink';
import ArticleMeta from '../components/ArticleMeta';
import AuthorBio from '../components/AuthorBio';
import NumberBall from '../components/NumberBall';
import { gameStats, formatNumber, formatPercent, formatPeso, formatDate, dataRange } from '../data/stats';

const g = gameStats('6/58');
const small = gameStats('6/49');

// Everything below comes from pcso-stats.json, so the page stays true when the data is refreshed.
const years = Number(g.last.slice(0, 4)) - Number(g.first.slice(0, 4)) + 1;
const p = 6 / g.balls;
const expected = g.frequency.expected;
const counts = Object.values(g.frequency.all);
// Typical distance of one number's count from the expected count if draws are random (binomial standard deviation).
const spread = Math.sqrt(g.draws * p * (1 - p));
const topCount = g.frequency.most[0].count;
const bottomCount = Math.min(...g.frequency.least.map((r) => r.count));

// Chi-square test of the whole frequency table, with a Wilson-Hilferty normal approximation for the p-value.
const chiSquare = counts.reduce((sum, c) => sum + (c - expected) ** 2 / (spread * spread), 0);
const df = g.balls - 1;
const erf = (x) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
};
const z = (Math.cbrt(chiSquare / df) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
const chanceOfWiderSpread = 0.5 * (1 - erf(z / Math.SQRT2));

const minSum = 21;
const maxSum = Array.from({ length: 6 }, (_, i) => g.balls - i).reduce((a, b) => a + b, 0);
const oddBalls = Math.ceil(g.balls / 2);
const topSplit = g.odd_even.reduce((best, row) => (row.share > best.share ? row : best));
const widestSplitGap = Math.max(...g.odd_even.map((r) => Math.abs(r.share - r.expected_share)));

const bt = g.backtests;
const two = (x) => x.toFixed(2);
const three = (x) => x.toFixed(3);
const signed = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(1)}`;
const backtestRows = [
  { label: 'Any six numbers (chance)', mean: bt.expected_mean, compared: null },
  { label: `Six hottest of the last ${bt.window} draws`, mean: bt.hot_six.mean, compared: bt.hot_six.compared },
  { label: `Six coldest of the last ${bt.window} draws`, mean: bt.cold_six.mean, compared: bt.cold_six.compared },
  { label: 'The previous draw’s six numbers', mean: bt.repeat_previous.mean, compared: bt.repeat_previous.compared },
];
const biggestGap = Math.max(
  ...[bt.hot_six.mean, bt.cold_six.mean, bt.repeat_previous.mean].map((m) => Math.abs(m - bt.expected_mean))
);
const drawsPerJackpot = Math.round(g.draws / g.jackpots.won);
const smallDrawsPerJackpot = Math.round(small.draws / small.jackpots.won);
const oddsRatio = g.odds / small.odds;

const freqRows = [
  ...g.frequency.most.map((r) => ({ ...r, group: 'Most drawn' })),
  ...g.frequency.least.map((r) => ({ ...r, group: 'Least drawn' })),
];

const sectionClass = 'space-y-3 text-sm leading-relaxed text-slate-300';
const h2Class = 'text-xl font-semibold text-white';

function BlogPCSO658Analysis() {
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
        <span className="text-slate-300">PCSO 6/58 Analysis</span>
      </nav>

      <article className="article text-slate-200 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">PCSO 6/58 results: what {years} years of draws show</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            What do {years} years of Ultra Lotto 6/58 results actually show? We analyzed all{' '}
            {formatNumber(g.draws)} draws in our records, from {dataRange('6/58')}. Below, you&apos;ll find the numbers
            drawn most and least, the usual range of sums, and the odd-even splits. We also test &quot;hot&quot; numbers
            and count how often someone won the jackpot.
          </p>
          <ArticleMeta />
        </header>

        <section className={sectionClass}>
          <h2 className={h2Class}>Ultra Lotto 6/58 in numbers</h2>
          <p>
            Ultra Lotto 6/58 is the largest of the PCSO six-number games. Each draw picks six numbers from 1 to 58, and
            PCSO draws it on Tuesday, Friday, and Sunday at 9 PM.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table">
              <tbody>
                <tr>
                  <th scope="row">Draws in our data</th>
                  <td className="text-right font-mono tabular">{formatNumber(g.draws)}</td>
                </tr>
                <tr>
                  <th scope="row">First and last draw</th>
                  <td className="text-right">{dataRange('6/58')}</td>
                </tr>
                <tr>
                  <th scope="row">Jackpot odds per line</th>
                  <td className="text-right font-mono tabular">1 in {formatNumber(g.odds)}</td>
                </tr>
                <tr>
                  <th scope="row">Times each number should appear by chance</th>
                  <td className="text-right font-mono tabular">{expected.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Nine extra balls make a big difference. A 6/58 line has about {oddsRatio.toFixed(1)} times longer odds than
            a{' '}
            <Link to="/blog/pcso-649-results-analysis" className="link">
              Super Lotto 6/49
            </Link>{' '}
            line, at 1 in {formatNumber(g.odds)} against 1 in {formatNumber(small.odds)}.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Which numbers came up most and least</h2>
          <p>
            Our {formatNumber(g.draws)} draws hold {formatNumber(g.draws * 6)} drawn balls. Shared evenly across 58
            numbers, each would appear {expected.toFixed(1)} times. Here are the 6 most drawn and 6 least drawn numbers,
            with the gap from that even share.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[420px]">
              <thead>
                <tr>
                  <th scope="col">Group</th>
                  <th scope="col">Number</th>
                  <th scope="col" className="text-right">Times drawn</th>
                  <th scope="col" className="text-right">Vs expected</th>
                </tr>
              </thead>
              <tbody>
                {freqRows.map((r) => (
                  <tr key={`${r.group}-${r.number}`}>
                    <td>{r.group}</td>
                    <td>
                      <NumberBall number={r.number} size="sm" tone={r.group === 'Most drawn' ? 'accent' : 'muted'} />
                    </td>
                    <td className="text-right font-mono tabular">{formatNumber(r.count)}</td>
                    <td className="text-right font-mono tabular">{signed(r.count - expected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            The top number came up {topCount - bottomCount} more times than the bottom one. That sounds like a pattern,
            but it&apos;s what randomness does. For one number over {formatNumber(g.draws)} draws, the count usually
            misses the even share by around {spread.toFixed(0)}, up or down. Across 58 numbers, some land well above and
            some well below.
          </p>
          <p>
            To check the whole table at once, we used a chi-square test. It asks how often fair draws would scatter the
            counts at least this much. The answer is about {formatPercent(chanceOfWiderSpread, 0)} of the time.{' '}
            {chanceOfWiderSpread >= 0.05
              ? 'Anything above 5% counts as ordinary, so these counts look like a fair draw.'
              : 'That’s below the usual 5% line, so we’ll keep watching it. It still doesn’t make any number more likely in the next draw.'}
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>The range of draw sums</h2>
          <p>
            A draw&apos;s sum is its six numbers added together. With 58 balls, the sums spread wider than in smaller
            games. This table shows where real 6/58 sums fell.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table">
              <tbody>
                <tr>
                  <th scope="row">Possible sums</th>
                  <td className="text-right font-mono tabular">
                    {minSum}–{maxSum}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Lowest and highest drawn</th>
                  <td className="text-right font-mono tabular">
                    {g.sum.min}–{g.sum.max}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Average drawn sum</th>
                  <td className="text-right font-mono tabular">{g.sum.mean.toFixed(1)}</td>
                </tr>
                <tr>
                  <th scope="row">Average if draws are random</th>
                  <td className="text-right font-mono tabular">{g.sum.theoretical_mean.toFixed(1)}</td>
                </tr>
                <tr>
                  <th scope="row">Middle half of draws</th>
                  <td className="text-right font-mono tabular">
                    {g.sum.middle_half[0]}–{g.sum.middle_half[1]}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Middle 90% of draws</th>
                  <td className="text-right font-mono tabular">
                    {g.sum.middle_90[0]}–{g.sum.middle_90[1]}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Half of all draws summed to between {g.sum.middle_half[0]} and {g.sum.middle_half[1]}, and the average of{' '}
            {g.sum.mean.toFixed(1)} is close to the {g.sum.theoretical_mean} that chance predicts. The middle is crowded
            because far more combinations add up to a middle value than to an extreme one. A line summing to{' '}
            {g.sum.theoretical_mean} is no more likely to win than a line summing to {g.sum.min}. Each single
            combination has the same odds.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>How odd and even numbers split</h2>
          <p>
            The pool has {oddBalls} odd and {g.balls - oddBalls} even numbers. For each draw, we counted the odd numbers,
            then compared each split&apos;s share of draws with the share random draws should give.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[420px]">
              <thead>
                <tr>
                  <th scope="col">Split</th>
                  <th scope="col" className="text-right">Draws</th>
                  <th scope="col" className="text-right">Our share</th>
                  <th scope="col" className="text-right">Expected share</th>
                </tr>
              </thead>
              <tbody>
                {g.odd_even.map((r) => (
                  <tr key={r.odd}>
                    <th scope="row">
                      {r.odd} odd, {r.even} even
                    </th>
                    <td className="text-right font-mono tabular">{formatNumber(r.draws)}</td>
                    <td className="text-right font-mono tabular">{formatPercent(r.share)}</td>
                    <td className="text-right font-mono tabular">{formatPercent(r.expected_share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            {topSplit.odd} odd and {topSplit.even} even was the most common split, at {formatPercent(topSplit.share)} of
            draws. The largest gap between our share and the expected share is{' '}
            {(widestSplitGap * 100).toFixed(1)} percentage points. Gaps that small are normal for a sample of{' '}
            {formatNumber(g.draws)} draws.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Do hot numbers stay hot?</h2>
          <p>
            Many players favor numbers that came up often in recent draws. We tested that idea on the full 6/58 history.
            Before each draw, we ranked numbers by how often they came up in the previous {bt.window} draws. We then
            checked how many of the top six, and of the bottom six, the next draw matched.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[420px]">
              <thead>
                <tr>
                  <th scope="col">Six numbers picked from</th>
                  <th scope="col" className="text-right">Draws tested</th>
                  <th scope="col" className="text-right">Average matches</th>
                </tr>
              </thead>
              <tbody>
                {backtestRows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    <td className="text-right font-mono tabular">{r.compared ? formatNumber(r.compared) : 'Theory'}</td>
                    <td className="text-right font-mono tabular">{three(r.mean)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Chance says any six numbers match {three(bt.expected_mean)} drawn numbers per draw, on average. The hot six
            matched {three(bt.hot_six.mean)} and the cold six matched {three(bt.cold_six.mean)}. Repeating the last draw
            matched {three(bt.repeat_previous.mean)}. Every result is within {two(biggestGap)} of chance, so hot numbers hit
            no more often than chance. Past draws don&apos;t steer the next one.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Jackpot winners</h2>
          <p>
            Long odds mean the 6/58 jackpot is rarely won. Only {formatNumber(g.jackpots.won)} of{' '}
            {formatNumber(g.draws)} draws in our data had a jackpot winner, about 1 draw in {drawsPerJackpot}. For 6/49,
            it was about 1 draw in {smallDrawsPerJackpot}.
          </p>
          <p>
            Each draw without a winner adds to the jackpot. That&apos;s how the largest jackpot won in our data reached{' '}
            {formatPeso(g.jackpots.largest_won)}, in the draw on {formatDate(g.jackpots.largest_won_date)}. A bigger
            jackpot doesn&apos;t change the odds. Each line still has a 1 in {formatNumber(g.odds)} chance.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>How to use this</h2>
          <p>
            Across {years} years, Ultra Lotto 6/58 behaves like a fair random draw. The number counts, sums, and odd-even
            splits all match what chance predicts. Hot and cold picks did no better than any other six numbers.
          </p>
          <p>
            Read these stats as a description of the past. No pattern, model, or system changes your odds, ours
            included. Our{' '}
            <Link to="/methodology" className="link">
              methodology page
            </Link>{' '}
            explains what our models do and where they stop. If you play, pick an amount you&apos;re fine losing, and
            see our{' '}
            <Link to="/responsible-play" className="link">
              responsible play guide
            </Link>
            . Always confirm winning numbers with official PCSO results.
          </p>
        </section>

        <AuthorBio />

        <section className="space-y-3 border-t border-slate-600/50 pt-6">
          <h2 className="text-lg font-semibold text-white">Related reading</h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
            <li>
              <Link to="/blog/pcso-649-results-analysis" className="link">
                PCSO 6/49 results: what the draws show
              </Link>
            </li>
            <li>
              <Link to="/blog/markov-chains-lottery" className="link">
                Markov chains and lottery draws
              </Link>
            </li>
            <li>
              <Link to="/blog/deep-reinforcement-learning" className="link">
                What deep reinforcement learning can and can&apos;t do for lotto
              </Link>
            </li>
            <li>
              <Link to="/methodology" className="link">
                Our methodology and data
              </Link>
            </li>
            <li>
              <Link to="/responsible-play" className="link">
                Responsible play
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </main>
  );
}

export default BlogPCSO658Analysis;
