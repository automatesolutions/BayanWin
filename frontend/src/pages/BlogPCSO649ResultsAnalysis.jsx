import React from 'react';
import { Link } from '../components/SiteLink';
import ArticleMeta from '../components/ArticleMeta';
import ArticleImage from '../components/ArticleImage';
import pcso649Image from '../assets/articles/pcso649.webp';
import AuthorBio from '../components/AuthorBio';
import NumberBall from '../components/NumberBall';
import { gameStats, formatNumber, formatPercent, formatPeso, formatDate, dataRange } from '../data/stats';

const g = gameStats('6/49');

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
const allSameShare = g.odd_even.filter((r) => r.odd === 0 || r.even === 0).reduce((s, r) => s + r.share, 0);
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

const freqRows = [
  ...g.frequency.most.map((r) => ({ ...r, group: 'Most drawn' })),
  ...g.frequency.least.map((r) => ({ ...r, group: 'Least drawn' })),
];

const sectionClass = 'space-y-3 text-sm leading-relaxed text-slate-300';
const h2Class = 'text-xl font-semibold text-white';

function BlogPCSO649ResultsAnalysis() {
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
        <span className="text-slate-300">PCSO 6/49 Analysis</span>
      </nav>

      <article className="article text-slate-200 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">PCSO 6/49 results: what {years} years of draws show</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            What do {years} years of Super Lotto 6/49 results actually show? We counted every draw in our records,{' '}
            {formatNumber(g.draws)} of them from {dataRange('6/49')}. This page shows what we found: which numbers came
            up most and least, how the sums and odd-even splits fell, and whether &quot;hot&quot; numbers kept winning.
          </p>
          <ArticleMeta />
        </header>

        <ArticleImage src={pcso649Image} alt="Orange and white numbered lotto balls beside a blank ticket and a pen" />

        <section className={sectionClass}>
          <h2 className={h2Class}>Super Lotto 6/49 in numbers</h2>
          <p>
            Super Lotto 6/49 draws six numbers from 1 to 49. PCSO holds the draw on Tuesday, Thursday, and Sunday, and
            the minimum jackpot starts at ₱16 million. Here&apos;s the game as it appears in our data.
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
                  <td className="text-right">{dataRange('6/49')}</td>
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
            The odds figure counts every way to choose 6 numbers out of 49. One ticket line covers one of those
            combinations, so it has a 1 in {formatNumber(g.odds)} chance at the jackpot on any draw.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>How often each number came up</h2>
          <p>
            Each draw has 6 numbers, so {formatNumber(g.draws)} draws give {formatNumber(g.draws * 6)} drawn balls.
            Spread evenly over 49 numbers, that&apos;s {expected.toFixed(1)} appearances each. The table shows the 6 numbers
            drawn most and the 6 drawn least, and how far each one sits from that expected count.
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
            A gap of {topCount - bottomCount} between the top and bottom count looks large, but random draws never
            hand out equal counts. Over {formatNumber(g.draws)} draws, one number&apos;s count typically lands about{' '}
            {spread.toFixed(0)} away from {expected.toFixed(1)} in either direction. With 49 numbers, a few always end up
            two or more of those steps away.
          </p>
          <p>
            We also ran a chi-square test, the standard check for whether counts are spread too unevenly to be chance.
            Random draws produce a spread at least this wide about {formatPercent(chanceOfWiderSpread, 0)} of the time.{' '}
            {chanceOfWiderSpread >= 0.05
              ? 'Statisticians call a result unusual below 5%, so this spread is within the normal range for a fair draw.'
              : 'That’s below the usual 5% line, so we’ll keep watching it. It still doesn’t make any number more likely in the next draw.'}
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Where the sums landed</h2>
          <p>
            Add up the six numbers in a draw and you get its sum. Some players pick lines whose sum sits in a
            &quot;normal&quot; band. Here&apos;s where the sums of real 6/49 draws fell.
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
            The average drawn sum of {g.sum.mean.toFixed(1)} sits next to the {g.sum.theoretical_mean} that pure chance
            predicts. Sums bunch in the middle because many more combinations add up to {g.sum.theoretical_mean} than
            to {minSum} or {maxSum}. That&apos;s arithmetic, not a pattern. A sum filter skips lines from a rare group,
            but each skipped line had the same 1 in {formatNumber(g.odds)} chance as any line you keep.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Odd and even split</h2>
          <p>
            The 6/49 pool has {oddBalls} odd and {g.balls - oddBalls} even numbers. We counted how many odd numbers each
            draw had and compared the shares with what random draws should give.
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
            The most common split was {topSplit.odd} odd and {topSplit.even} even, in {formatPercent(topSplit.share)} of
            draws. Lines with all six odd or all six even came up in {formatPercent(allSameShare)} of draws. No row is more
            than {(widestSplitGap * 100).toFixed(1)} percentage points from its expected share, which is what a fair draw
            looks like.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Did hot numbers keep winning?</h2>
          <p>
            A &quot;hot&quot; number is one that came up often lately. We tested whether hot numbers keep coming up.
            Before each draw, we took the six numbers drawn most often in the previous {bt.window} draws. Then we counted
            how many of them the next draw matched. We did the same for the six coldest numbers and for a repeat of the
            previous draw.
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
            Any six numbers match about {three(bt.expected_mean)} of the six drawn numbers per draw, on average. Hot numbers
            matched {three(bt.hot_six.mean)}. Cold numbers matched {three(bt.cold_six.mean)}. No method strays more than{' '}
            {two(biggestGap)} from chance. In plain terms, hot numbers hit no more often than chance, and neither do cold
            or &quot;due&quot; numbers. The draw has no memory of past results.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Jackpot winners</h2>
          <p>
            In our data, {formatNumber(g.jackpots.won)} of {formatNumber(g.draws)} draws had at least one jackpot winner.
            That&apos;s about 1 draw in {drawsPerJackpot}. In the other draws, no line matched all six numbers and the
            jackpot rolled over to the next draw.
          </p>
          <p>
            The largest jackpot won in our data was {formatPeso(g.jackpots.largest_won)}, in the draw on{' '}
            {formatDate(g.jackpots.largest_won_date)}. Big jackpots like that build up over many draws without a winner.
            The odds per line stay the same no matter how large the jackpot grows.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>How to use this</h2>
          <p>
            {years} years of Super Lotto 6/49 results look the way random draws should look. Number counts, sums, and
            odd-even splits all sit close to what chance predicts. Picking hot, cold, or repeat numbers didn&apos;t beat
            chance in our test.
          </p>
          <p>
            Use these numbers to understand the game, not to chase it. Every line has the same 1 in{' '}
            {formatNumber(g.odds)} odds, and no model, including ours, changes that. Our models describe past draws. The{' '}
            <Link to="/methodology" className="link">
              methodology page
            </Link>{' '}
            explains how they work and what they can&apos;t do. Set a budget you can afford to lose, and read our{' '}
            <Link to="/responsible-play" className="link">
              responsible play guide
            </Link>{' '}
            before you buy a ticket. Always check winning numbers against official PCSO results.
          </p>
        </section>

        <AuthorBio />

        <section className="space-y-3 border-t border-slate-600/50 pt-6">
          <h2 className="text-lg font-semibold text-white">Related reading</h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
            <li>
              <Link to="/blog/pcso-658-results-analysis" className="link">
                PCSO 6/58 results: what the draws show
              </Link>
            </li>
            <li>
              <Link to="/blog/nash-hotfilter" className="link">
                How our NashHotFilter model treats hot numbers
              </Link>
            </li>
            <li>
              <Link to="/blog/markov-chains-lottery" className="link">
                Markov chains and lottery draws
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

export default BlogPCSO649ResultsAnalysis;
