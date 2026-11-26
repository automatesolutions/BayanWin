import React from 'react';
import { Link } from '../../components/SiteLink';
import Notice from '../../components/ui/Notice';
import AuthorBio from '../../components/AuthorBio';
import NumberBall from '../../components/NumberBall';
import { gameStats, formatNumber, formatPercent, dataRange } from '../../data/stats';

const g = gameStats('6/58');

// Every figure on this page comes from pcso-stats.json, so the text stays true when the data is refreshed.
const p = 6 / g.balls;
const expected = g.frequency.expected;
const balls = g.draws * 6;
const numbers = Object.entries(g.frequency.all)
  .map(([n, count]) => ({ number: Number(n), count }))
  .sort((a, b) => a.number - b.number);
const counts = numbers.map((r) => r.count);
const maxCount = Math.max(...counts);
const minCount = Math.min(...counts);

// Spread of the real counts around the expected count: square root of the mean squared deviation.
const observedSd = Math.sqrt(counts.reduce((s, c) => s + (c - expected) ** 2, 0) / counts.length);
// Spread that pure chance predicts for one number's count (binomial standard deviation).
const binomialSd = Math.sqrt(expected * (1 - p));
const oneSdLow = expected - binomialSd;
const oneSdHigh = expected + binomialSd;
const twoSdLow = expected - 2 * binomialSd;
const twoSdHigh = expected + 2 * binomialSd;
const withinOne = counts.filter((c) => c >= oneSdLow && c <= oneSdHigh).length;
const withinTwo = counts.filter((c) => c >= twoSdLow && c <= twoSdHigh).length;
// A normal curve puts about 68.3% of values within 1 SD and 95.4% within 2 SD.
const chanceWithinOne = Math.round(g.balls * 0.683);
const chanceWithinTwo = Math.round(g.balls * 0.954);

// Bars run from 0 to whichever is larger: the top count or the top of the 2 SD zone.
const scaleMax = Math.max(maxCount, twoSdHigh);
const pct = (v) => `${((v / scaleMax) * 100).toFixed(2)}%`;
const splitAt = Math.ceil(numbers.length / 2);
const chartHalves = [numbers.slice(0, splitAt), numbers.slice(splitAt)];

const one = (x) => x.toFixed(1);
const three = (x) => x.toFixed(3);
const signed = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(1)}`;
const signed3 = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(3)}`;
const pad = (n) => String(n).padStart(2, '0');

const freqRows = [
  ...g.frequency.most.map((r) => ({ ...r, group: 'Most drawn' })),
  ...g.frequency.least.map((r) => ({ ...r, group: 'Least drawn' })),
];
const topGap = g.frequency.most[0].count - Math.min(...g.frequency.least.map((r) => r.count));

const bt = g.backtests;
const threePlus = (share) => [3, 4, 5, 6].reduce((s, k) => s + (share[k] || 0), 0);
const backtestRows = [
  { label: 'Any six numbers (chance)', mean: bt.expected_mean, compared: null, three: threePlus(bt.chance_share) },
  {
    label: `Six most drawn in the last ${bt.window} draws`,
    mean: bt.hot_six.mean,
    compared: bt.hot_six.compared,
    three: threePlus(bt.hot_six.share),
  },
  {
    label: `Six least drawn in the last ${bt.window} draws`,
    mean: bt.cold_six.mean,
    compared: bt.cold_six.compared,
    three: threePlus(bt.cold_six.share),
  },
];
// Typical random wobble of an average over this many draws: chance SD of matches / sqrt(draws tested).
const chanceMean = Object.entries(bt.chance_share).reduce((t, [k, v]) => t + Number(k) * v, 0);
const chanceVar = Object.entries(bt.chance_share).reduce((t, [k, v]) => t + Number(k) ** 2 * v, 0) - chanceMean ** 2;
const wobble = Math.sqrt(chanceVar / bt.hot_six.compared);
const hotGap = bt.hot_six.mean - bt.expected_mean;
const coldGap = bt.cold_six.mean - bt.expected_mean;

const sectionClass = 'space-y-3 text-sm leading-relaxed text-slate-300';
const h2Class = 'text-xl font-semibold text-white';

function FrequencyHalf({ rows }) {
  const first = rows[0].number;
  const last = rows[rows.length - 1].number;
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">
        Times drawn for numbers {first} to {last}. Expected count {one(expected)}.
      </caption>
      <thead>
        <tr className="text-2xs uppercase tracking-wider text-silver-500">
          <th scope="col" className="w-10 pb-2 text-left font-semibold">
            No.
          </th>
          <th scope="col" className="w-12 pb-2 pr-3 text-right font-semibold">
            Times
          </th>
          <th scope="col" className="pb-2 text-left font-semibold">
            <span className="sr-only">Bar</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.number}>
            <th scope="row" className="py-0.5 pr-2 text-left font-mono font-normal tabular text-silver-400">
              {pad(r.number)}
            </th>
            <td className="py-0.5 pr-3 text-right font-mono tabular text-silver-200">{r.count}</td>
            <td className="py-0.5">
              <div aria-hidden className="relative h-3 rounded-sm bg-white/[0.03]">
                <div
                  className="absolute inset-y-0 bg-white/[0.07]"
                  style={{ left: pct(twoSdLow), width: `calc(${pct(twoSdHigh)} - ${pct(twoSdLow)})` }}
                />
                <div className="absolute inset-y-0 left-0 rounded-sm bg-electric-400/70" style={{ width: pct(r.count) }} />
                <div className="absolute -inset-y-0.5 w-px bg-white/80" style={{ left: pct(expected) }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UltraLotto658NumberFrequency() {
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
        <span className="text-slate-300">6/58 number frequency</span>
      </nav>

      <Notice tone="warning" title="Draft for review" className="mb-6">
        Not published. This page only exists in npm run dev.
      </Notice>

      <article className="article text-slate-200 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-white">How often each Ultra Lotto 6/58 number has come up since 2015</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Has every Ultra Lotto 6/58 number come up about as often as the others? And does a number&apos;s past count
            tell you anything about the next draw? We counted all {formatNumber(g.draws)} draws in our records, from{' '}
            {dataRange('6/58')}, to answer both questions with our own data.
          </p>
          <p className="text-sm text-silver-400">
            By{' '}
            <Link to="/about#who-runs-bayanwin" className="link">
              Jonel Pericon
            </Link>
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className={h2Class}>The count we expect from chance</h2>
          <p>
            Ultra Lotto 6/58 draws 6 numbers from 1 to 58. Our {formatNumber(g.draws)} draws add up to{' '}
            {formatNumber(balls)} drawn balls. If you share those out evenly over 58 numbers, each one gets{' '}
            {one(expected)} appearances. That&apos;s the expected count, and it&apos;s the line every number on this page
            is measured against.
          </p>
          <p>
            Real counts never land exactly on that line. Random draws spread out, the same way 100 coin flips rarely
            give exactly 50 heads. The question is whether the spread is bigger than chance can explain.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Every number, side by side</h2>
          <p>
            Each row shows how many times a number was drawn. The white line marks the expected count of{' '}
            {one(expected)}. The lighter zone runs from {one(twoSdLow)} to {one(twoSdHigh)}, the range where chance
            alone usually puts a count. We explain where that range comes from further down.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-silver-400" aria-hidden>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-5 rounded-sm bg-electric-400/70" /> Times drawn
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-px bg-white/80" /> Expected count
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-5 rounded-sm bg-white/[0.07]" /> Usual range for chance
            </span>
          </div>
          <div className="grid gap-x-8 gap-y-4 rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-4 sm:grid-cols-2">
            {chartHalves.map((rows) => (
              <FrequencyHalf key={rows[0].number} rows={rows} />
            ))}
          </div>
          <p>
            The longest bar belongs to {g.frequency.most[0].number}, drawn {maxCount} times. The shortest belongs to{' '}
            {g.frequency.least[0].number}, drawn {minCount} times. Every bar still ends close to the white line.{' '}
            {withinTwo === g.balls
              ? 'Every one ends inside the shaded zone.'
              : `${withinTwo} of ${g.balls} end inside the shaded zone.`}
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>The most and least drawn numbers</h2>
          <p>
            Here are the 6 numbers drawn most and the 6 drawn least, with the gap between each count and the expected{' '}
            {one(expected)}.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[420px]">
              <thead>
                <tr>
                  <th scope="col">Group</th>
                  <th scope="col">Number</th>
                  <th scope="col" className="text-right">
                    Times drawn
                  </th>
                  <th scope="col" className="text-right">
                    Vs expected
                  </th>
                </tr>
              </thead>
              <tbody>
                {freqRows.map((r) => (
                  <tr key={`${r.group}-${r.number}`}>
                    <td className="text-silver-400">{r.group}</td>
                    <th scope="row">
                      <NumberBall number={r.number} size="sm" />
                    </th>
                    <td className="text-right font-mono tabular">{r.count}</td>
                    <td className="text-right font-mono tabular">{signed(r.count - expected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            The top number came up {topGap} more times than the bottom one. That sounds like a lot. Over{' '}
            {formatNumber(g.draws)} draws, it&apos;s a small difference, as the next section shows.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Why a spread this wide is normal</h2>
          <p>
            In each draw, any one number has a {formatPercent(p)} chance of being picked. Over many draws, its count
            follows a binomial pattern. The standard deviation tells you how far a count usually wanders from the expected
            value. For this game, it&apos;s the square root of {one(expected)} × (1 − 6/58), which is about{' '}
            {one(binomialSd)}.
          </p>
          <p>
            So chance alone puts most counts within {one(binomialSd)} of {one(expected)}, between {one(oneSdLow)} and{' '}
            {one(oneSdHigh)}. Nearly all of them should fall within two standard deviations, between {one(twoSdLow)} and{' '}
            {one(twoSdHigh)}.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[420px]">
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  <th scope="col" className="text-right">
                    Chance predicts
                  </th>
                  <th scope="col" className="text-right">
                    Our data
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Standard deviation of counts</th>
                  <td className="text-right font-mono tabular">{one(binomialSd)}</td>
                  <td className="text-right font-mono tabular">{one(observedSd)}</td>
                </tr>
                <tr>
                  <th scope="row">Numbers within 1 standard deviation</th>
                  <td className="text-right font-mono tabular">about {chanceWithinOne}</td>
                  <td className="text-right font-mono tabular">{withinOne}</td>
                </tr>
                <tr>
                  <th scope="row">Numbers within 2 standard deviations</th>
                  <td className="text-right font-mono tabular">about {chanceWithinTwo}</td>
                  <td className="text-right font-mono tabular">{withinTwo}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            We worked out the &quot;our data&quot; spread as the square root of the average squared gap between each
            count and {one(expected)}. It comes to {one(observedSd)}, against {one(binomialSd)} from the binomial formula.{' '}
            {observedSd <= binomialSd
              ? 'The real counts sit as close to the expected value as chance predicts, or a little closer.'
              : 'The real counts spread a little wider than the formula, which small samples often do.'}
          </p>
          <p>
            A biased draw would show the opposite: some numbers far outside the shaded zone. We don&apos;t see
            that. The gap between {g.frequency.most[0].number} and {g.frequency.least[0].number} is the kind of gap random
            draws produce.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Do the most drawn numbers keep coming up?</h2>
          <p>
            A count describes the past. To see if it says anything about the next draw, we ran a test. Before each draw,
            we took the 6 numbers drawn most often in the previous {bt.window} draws. Then we counted how many of them
            came up in the next draw. We did the same with the 6 numbers drawn least often.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[480px]">
              <thead>
                <tr>
                  <th scope="col">Six numbers picked</th>
                  <th scope="col" className="text-right">
                    Draws tested
                  </th>
                  <th scope="col" className="text-right">
                    Average matches
                  </th>
                  <th scope="col" className="text-right">
                    3 or more matches
                  </th>
                </tr>
              </thead>
              <tbody>
                {backtestRows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    <td className="text-right font-mono tabular">{r.compared ? formatNumber(r.compared) : 'Theory'}</td>
                    <td className="text-right font-mono tabular">{three(r.mean)}</td>
                    <td className="text-right font-mono tabular">{formatPercent(r.three)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Any six numbers match {three(bt.expected_mean)} of the drawn numbers per draw, on average. The most drawn six
            matched {three(bt.hot_six.mean)}, a difference of {signed3(hotGap)}. The least
            drawn six matched {three(bt.cold_six.mean)}, a difference of {signed3(coldGap)}.
          </p>
          <p>
            Over {formatNumber(bt.hot_six.compared)} draws, random variation alone moves an average like this by about{' '}
            {three(wobble)}. The larger gap is {(Math.max(Math.abs(hotGap), Math.abs(coldGap)) / wobble).toFixed(1)} times
            that, which chance produces all the time. The draw machine doesn&apos;t know which balls came out last
            month. A number that came up often isn&apos;t &quot;hot&quot;, and one that came up rarely isn&apos;t
            &quot;due&quot;.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>What this means for your ticket</h2>
          <p>
            Every 6/58 line has the same 1 in {formatNumber(g.odds)} chance at the jackpot. That&apos;s true for the six
            most drawn numbers, the six least drawn, and any other six. The frequency chart above describes what already
            happened. It doesn&apos;t change what happens next.
          </p>
          <p>
            If you like to play numbers from the chart, that&apos;s fine. Pick them because you enjoy it, not because they
            have better odds. They don&apos;t. Set a budget you can afford to lose, and read our{' '}
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

export default UltraLotto658NumberFrequency;
