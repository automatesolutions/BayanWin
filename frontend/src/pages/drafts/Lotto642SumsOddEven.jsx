import React from 'react';
import { Link } from '../../components/SiteLink';
import Notice from '../../components/ui/Notice';
import AuthorBio from '../../components/AuthorBio';
import NumberBall from '../../components/NumberBall';
import { gameStats, formatNumber, formatPercent, dataRange } from '../../data/stats';

const g = gameStats('6/42');

// Every figure on this page comes from pcso-stats.json or from the game's rules (6 of g.balls).
const years = Number(g.last.slice(0, 4)) - Number(g.first.slice(0, 4)) + 1;
const s = g.sum;
const lowestPossible = 21; // 1 + 2 + 3 + 4 + 5 + 6
const highestPossible = Array.from({ length: 6 }, (_, i) => g.balls - i).reduce((a, b) => a + b, 0);
const theoryMean = (6 * (g.balls + 1)) / 2;
const meanGap = s.mean - s.theoretical_mean;

// Bands built from the percentiles we keep: min, 5th, 25th, 75th, 95th, max.
const sumBands = [
  { label: 'Lowest 5%', from: s.min, to: s.middle_90[0], share: 0.05, tone: 'bg-electric-400/25' },
  { label: 'Next 20%', from: s.middle_90[0], to: s.middle_half[0], share: 0.2, tone: 'bg-electric-400/45' },
  { label: 'Middle half', from: s.middle_half[0], to: s.middle_half[1], share: 0.5, tone: 'bg-electric-400/75' },
  { label: 'Next 20%', from: s.middle_half[1], to: s.middle_90[1], share: 0.2, tone: 'bg-electric-400/45' },
  { label: 'Highest 5%', from: s.middle_90[1], to: s.max, share: 0.05, tone: 'bg-electric-400/25' },
];
// How many 6-number tickets add up to the theoretical mean (counted by dynamic programming).
const waysToSum = (target) => {
  // ways[k][t]: ways to pick k distinct numbers seen so far that add up to t.
  const ways = Array.from({ length: 7 }, () => new Array(target + 1).fill(0));
  ways[0][0] = 1;
  for (let n = 1; n <= g.balls; n += 1) {
    for (let k = 6; k >= 1; k -= 1) {
      for (let t = target; t >= n; t -= 1) ways[k][t] += ways[k - 1][t - n];
    }
  }
  return ways[6][target];
};
const waysAtMean = waysToSum(Math.round(s.theoretical_mean));
const span = highestPossible - lowestPossible;
const pos = (v) => `${(((v - lowestPossible) / span) * 100).toFixed(2)}%`;
const middleHalfWidth = s.middle_half[1] - s.middle_half[0];

// Odd/even: how many of the possible combinations have each split.
const choose = (n, k) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
  return Math.round(r);
};
const oddBalls = Math.ceil(g.balls / 2);
const evenBalls = g.balls - oddBalls;
const splits = g.odd_even.map((r) => ({ ...r, combos: choose(oddBalls, r.odd) * choose(evenBalls, r.even) }));
const topSplit = splits.reduce((best, r) => (r.combos > best.combos ? r : best));
const allOdd = splits.find((r) => r.even === 0);
const mixedShare = splits.filter((r) => r.odd >= 2 && r.odd <= 4).reduce((t, r) => t + r.share, 0);
const mixedCombos = splits.filter((r) => r.odd >= 2 && r.odd <= 4).reduce((t, r) => t + r.combos, 0);

// Two example tickets: one that looks typical, one that doesn't.
const describe = (nums) => ({
  nums,
  sum: nums.reduce((a, b) => a + b, 0),
  odd: nums.filter((n) => n % 2 === 1).length,
});
const typical = describe([8, 15, 22, 27, 30, 39]);
const pattern = describe([1, 2, 3, 4, 5, 6]);

const aboveDates = g.balls - 31;

const sectionClass = 'space-y-3 text-sm leading-relaxed text-slate-300';
const h2Class = 'text-xl font-semibold text-white';

function Ticket({ t }) {
  return (
    <div className="space-y-2 rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-4">
      <div className="flex flex-wrap gap-2">
        {t.nums.map((n) => (
          <NumberBall key={n} number={n} size="sm" />
        ))}
      </div>
      <p className="text-sm text-silver-400">
        Sum <span className="font-mono tabular text-silver-200">{t.sum}</span>, {t.odd} odd and {6 - t.odd} even. Odds
        of a jackpot: <span className="font-mono tabular text-silver-200">1 in {formatNumber(g.odds)}</span>
      </p>
    </div>
  );
}

function Lotto642SumsOddEven() {
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
        <span className="text-slate-300">6/42 sums and odd-even</span>
      </nav>

      <Notice tone="warning" title="Draft for review" className="mb-6">
        Not published. This page only exists in npm run dev.
      </Notice>

      <article className="article text-slate-200 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-white">
            What {years} years of Lotto 6/42 results show about sums and odd-even splits
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            What does a typical Lotto 6/42 draw look like when you add up its numbers or count the odd ones? And should
            you pick numbers that match? We looked at all {formatNumber(g.draws)} draws in our records, from{' '}
            {dataRange('6/42')}, to find out.
          </p>
          <p className="text-sm text-silver-400">
            By{' '}
            <Link to="/about#who-runs-bayanwin" className="link">
              ZALEL LABS
            </Link>
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className={h2Class}>Two ways to describe a draw</h2>
          <p>
            Lotto 6/42 draws 6 numbers from 1 to {g.balls}. The sum is what you get when you add those 6 numbers. The
            smallest possible sum is {lowestPossible}, from 1 to 6. The largest is {highestPossible}, from{' '}
            {g.balls - 5} to {g.balls}.
          </p>
          <p>
            The odd-even split counts how many of the 6 numbers are odd. The game has {oddBalls} odd numbers and{' '}
            {evenBalls} even ones, so a draw can have anything from 0 to 6 odd numbers. Both measures sort draws into
            groups. That detail matters later on.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Where draw sums land</h2>
          <p>
            Our summary keeps the key points of the sum distribution, not a count for every possible sum. That&apos;s
            enough to see the shape. The strip below covers every possible sum, from {lowestPossible} on the left to{' '}
            {highestPossible} on the right. The colored part shows where real draws fell.
          </p>
          <div aria-hidden className="space-y-2 rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-4">
            <div className="relative h-8 rounded-md bg-white/[0.03]">
              {sumBands.map((b, i) => (
                <div
                  key={`${b.label}-${i}`}
                  className={`absolute inset-y-0 ${b.tone}`}
                  style={{ left: pos(b.from), width: `calc(${pos(b.to)} - ${pos(b.from)})` }}
                />
              ))}
              <div className="absolute -inset-y-1 w-px bg-white/80" style={{ left: pos(s.theoretical_mean) }} />
            </div>
            <div className="relative h-4 font-mono text-2xs tabular text-silver-500">
              <span className="absolute left-0">{lowestPossible}</span>
              <span className="absolute -translate-x-1/2" style={{ left: pos(s.theoretical_mean) }}>
                {s.theoretical_mean}
              </span>
              <span className="absolute right-0">{highestPossible}</span>
            </div>
            <p className="text-xs text-silver-500">
              Darker blue means more draws. The white line is the average sum chance predicts.
            </p>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[420px]">
              <thead>
                <tr>
                  <th scope="col">Group of draws</th>
                  <th scope="col" className="text-right">
                    Sum range
                  </th>
                  <th scope="col" className="text-right">
                    Share of draws
                  </th>
                </tr>
              </thead>
              <tbody>
                {sumBands.map((b, i) => (
                  <tr key={`${b.label}-row-${i}`}>
                    <th scope="row">{b.label}</th>
                    <td className="text-right font-mono tabular">
                      {b.from} to {b.to}
                    </td>
                    <td className="text-right font-mono tabular">about {formatPercent(b.share, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Half of all draws had a sum between {s.middle_half[0]} and {s.middle_half[1]}. That&apos;s a window only{' '}
            {middleHalfWidth} wide, out of {span} possible steps. Nine draws in ten fell between {s.middle_90[0]} and{' '}
            {s.middle_90[1]}. The lowest sum we saw was {s.min}, and the highest was {s.max}. No draw came close to{' '}
            {lowestPossible} or {highestPossible}.
          </p>
          <p>
            The average sum across all draws was {s.mean}. Chance predicts 6 × ({g.balls} + 1) ÷ 2, which is{' '}
            {theoryMean}.{' '}
            {Math.abs(meanGap) < 0.05
              ? 'The two are the same.'
              : `The gap is ${Math.abs(meanGap).toFixed(1)}, which is small for a range this wide.`}{' '}
            Sums bunch in the middle because there are far more ways to build a middle sum than an extreme one. Only one
            set of numbers adds up to {lowestPossible}. {formatNumber(waysAtMean)} different sets add up to {Math.round(s.theoretical_mean)}.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Odd and even splits</h2>
          <p>
            The table shows every possible split, how many draws had it, and the share chance predicts. The
            &quot;Combinations&quot; column counts how many of the {formatNumber(g.odds)} possible tickets have that
            split.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[520px]">
              <thead>
                <tr>
                  <th scope="col">Odd / even</th>
                  <th scope="col" className="text-right">
                    Combinations
                  </th>
                  <th scope="col" className="text-right">
                    Draws
                  </th>
                  <th scope="col" className="text-right">
                    Actual share
                  </th>
                  <th scope="col" className="text-right">
                    Expected share
                  </th>
                </tr>
              </thead>
              <tbody>
                {splits.map((r) => (
                  <tr key={r.odd}>
                    <th scope="row" className="font-mono tabular">
                      {r.odd} / {r.even}
                    </th>
                    <td className="text-right font-mono tabular">{formatNumber(r.combos)}</td>
                    <td className="text-right font-mono tabular">{formatNumber(r.draws)}</td>
                    <td className="text-right font-mono tabular">{formatPercent(r.share)}</td>
                    <td className="text-right font-mono tabular">{formatPercent(r.expected_share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            The {topSplit.odd} odd, {topSplit.even} even split is the most common, and the reason is counting. You can
            build {formatNumber(topSplit.combos)} different tickets with that split. Only{' '}
            {formatNumber(allOdd.combos)} tickets are all odd. So chance lands on a mixed split far more often.
          </p>
          <p>
            Splits of 2, 3, or 4 odd numbers cover {formatNumber(mixedCombos)} combinations, about{' '}
            {formatPercent(mixedCombos / g.odds)} of all tickets. In our data, {formatPercent(mixedShare)} of draws had
            one of those splits. The actual and expected columns track each other closely, which is what fair random
            draws produce.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>A typical ticket isn&apos;t a better ticket</h2>
          <p>
            This is the key point of the page. Look at these two tickets.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Ticket t={typical} />
            <Ticket t={pattern} />
          </div>
          <p>
            The first looks like a normal draw. Its sum is in the middle and its split is {typical.odd} odd,{' '}
            {6 - typical.odd} even. The second has a sum of {pattern.sum}
            {pattern.sum < s.min ? ', lower than any draw in our data' : ''}. Both have the
            same 1 in {formatNumber(g.odds)} chance at the jackpot.
          </p>
          <p>
            Here&apos;s why. &quot;Sum in the middle with {topSplit.odd} odd numbers&quot; is a group. The{' '}
            {topSplit.odd} odd, {topSplit.even} even part alone holds {formatNumber(topSplit.combos)} combinations, so the
            winning ticket often belongs to it. Your ticket is one combination, not the
            whole group. The draw picks one combination out of {formatNumber(g.odds)}, and each one is as likely as any
            other.
          </p>
          <p>
            Think of a raffle with 100 tickets: 90 blue and 10 red. The winner probably holds a blue ticket. Your blue
            ticket still has a 1 in 100 chance, the same as every red one. Matching the typical pattern makes your ticket
            look like the winners. It doesn&apos;t make it more likely to win.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>One thing that can matter: sharing a jackpot</h2>
          <p>
            This is a general point about lotteries, not something our data shows. Our records hold the drawn numbers,
            not the numbers players pick.
          </p>
          <p>
            Many people play birthdays and other dates, which only go up to 31. Others play patterns like 1, 2, 3, 4, 5,
            6. Those choices don&apos;t change the odds. If they win, though, more tickets may hold the same numbers.
            When more than one ticket matches all six, the winners share the jackpot.
          </p>
          <p>
            In 6/42, the {aboveDates} numbers from 32 to {g.balls} can&apos;t be a day of the month. Including some of
            them may mean fewer people share your prize if you win. It doesn&apos;t make you more likely to win.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Should you pick numbers to match?</h2>
          <p>
            You can if you like, but it won&apos;t help your odds. {years} years of draws show what chance predicts:
            middle sums and mixed splits are common because most combinations look like that. Every ticket still has a 1
            in {formatNumber(g.odds)} chance.
          </p>
          <p>
            Our{' '}
            <Link to="/methodology" className="link">
              methodology page
            </Link>{' '}
            explains how we work with this data and what it can&apos;t do. Set a budget you can afford to lose, and read
            our{' '}
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
              <Link to="/blog" className="link">
                All BayanWin articles
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

export default Lotto642SumsOddEven;
