import React from 'react';
import { Link } from '../../components/SiteLink';
import AuthorBio from '../../components/AuthorBio';
import Notice from '../../components/ui/Notice';
import { allGames, gameStats, formatNumber, formatPercent, dataRange } from '../../data/stats';

// Every figure on this page is computed from pcso-stats.json, so it stays true when the data is refreshed.
const DAY_MS = 24 * 60 * 60 * 1000;
const PLAY_YEARS = 50;

/** "1 in X" from a probability. */
const oneIn = (p) => `1 in ${formatNumber(1 / p)}`;

const rows = allGames().map((g) => {
  const years = (Date.parse(g.last) - Date.parse(g.first)) / DAY_MS / 365.25;
  const drawsPerYear = g.draws / years;
  const p = 1 / g.odds;
  const lifetimeDraws = drawsPerYear * PLAY_YEARS;
  return {
    key: g.key,
    name: g.name,
    balls: g.balls,
    odds: g.odds,
    draws: g.draws,
    share: g.backtests.chance_share,
    won: g.jackpots.won,
    drawsPerJackpot: g.draws / g.jackpots.won,
    drawsPerYear,
    perWeek: drawsPerYear / 52.18,
    yearsToJackpot: g.odds / drawsPerYear,
    // Chance of at least one jackpot from one line every draw for PLAY_YEARS years.
    lifetimeChance: 1 - (1 - p) ** lifetimeDraws,
  };
});

const row = (key) => rows.find((r) => r.key === key);
const small = row('6/42');
const big = row('6/58');
const g49 = gameStats('6/49');
const ratio = big.odds / small.odds;
// Chance a single 6/42 line matches at least 3 numbers.
const atLeastThree42 = ['3', '4', '5', '6'].reduce((s, k) => s + small.share[k], 0);

const sectionClass = 'space-y-3 text-sm leading-relaxed text-slate-300';
const h2Class = 'text-xl font-semibold text-white';

function PcsoJackpotOdds() {
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
        <span className="text-slate-300">PCSO Jackpot Odds</span>
      </nav>

      <Notice tone="warning" title="Draft for review">
        Not published. This page only exists in npm run dev.
      </Notice>

      <article className="article text-slate-200 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Jackpot odds for every PCSO lotto game, explained</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            What are the real odds of winning each PCSO 6-number game, and what do those numbers mean in everyday
            terms? We worked them out from the rules of each game and checked them against our draw records from{' '}
            {dataRange()}.
          </p>
          <p className="mt-3 text-xs text-silver-500">
            By{' '}
            <Link to="/about#who-runs-bayanwin" className="link">
              Jonel Pericon
            </Link>
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className={h2Class}>Where the odds come from</h2>
          <p>
            Each PCSO lotto game draws 6 numbers from a fixed pool. In {small.name}, the pool is 1 to {small.balls}. In{' '}
            {big.name}, it’s 1 to {big.balls}.
          </p>
          <p>
            The jackpot odds count every possible set of 6 numbers from that pool. Order doesn’t matter, so 3, 9, 14,
            22, 30, 41 is the same line as 41, 30, 22, 14, 9, 3. For 6/42 there are {formatNumber(small.odds)}{' '}
            possible lines. One ticket line covers exactly one of them.
          </p>
          <p>
            That’s why the jackpot odds for one line in {small.name} are 1 in {formatNumber(small.odds)}. Every line has
            the same chance, whether it’s 1 to 6 in a row or a mix you picked with care.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>The odds for each game</h2>
          <p>
            The table shows the chance that one line matches exactly 3, 4, 5, or all 6 numbers in a single draw. The
            last column counts the draws in our data where at least one ticket won the jackpot.
          </p>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th scope="col">Game</th>
                  <th scope="col" className="text-right">Jackpot (all 6)</th>
                  <th scope="col" className="text-right">Exactly 5</th>
                  <th scope="col" className="text-right">Exactly 4</th>
                  <th scope="col" className="text-right">Exactly 3</th>
                  <th scope="col" className="text-right">Draws with a jackpot winner</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{r.name}</th>
                    <td className="text-right font-mono tabular">1 in {formatNumber(r.odds)}</td>
                    <td className="text-right font-mono tabular">{oneIn(r.share['5'])}</td>
                    <td className="text-right font-mono tabular">{oneIn(r.share['4'])}</td>
                    <td className="text-right font-mono tabular">{oneIn(r.share['3'])}</td>
                    <td className="text-right font-mono tabular">
                      {formatNumber(r.won)} of {formatNumber(r.draws)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Each extra ball in the pool makes every tier harder. A 6/58 line is about {ratio.toFixed(1)} times less
            likely to hit the jackpot than a 6/42 line. The gap is smaller for 3 matches, but it’s still there.
          </p>
          <p>
            Prize amounts for 3, 4, and 5 matches differ by game. We don’t list them here. Check the current amounts
            with PCSO or an authorized lotto outlet.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Why someone wins when the odds are this long</h2>
          <p>
            In our data, {big.name} had a jackpot winner in {formatNumber(big.won)} of {formatNumber(big.draws)} draws.
            That’s about one jackpot every {Math.round(big.drawsPerJackpot)} draws. It can look like the odds are
            better than 1 in {formatNumber(big.odds)}.
          </p>
          <p>
            They aren’t. Many people buy many lines for every draw. Across all those lines, the chance that one of them
            matches is much higher than the chance for your line. Your own line still has 1 in{' '}
            {formatNumber(big.odds)}.
          </p>
          <p>
            The same is true for {g49.name}. It had {formatNumber(g49.jackpots.won)} jackpot draws out of{' '}
            {formatNumber(g49.draws)}, and every line in every one of those draws had a 1 in {formatNumber(g49.odds)}{' '}
            chance.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>What “1 in X” means</h2>
          <p>
            “1 in {formatNumber(small.odds)}” describes a single line in a single draw. It doesn’t mean you win once
            after {formatNumber(small.odds)} draws. Each draw starts fresh, and past losses don’t bring a win closer.
          </p>
          <p>
            The “expected wait” is a long-run average. If you played one line every draw forever, you’d hit the jackpot
            once every {formatNumber(small.odds)} draws on average. Some people would win sooner, and most would wait
            far longer than a lifetime.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>The odds in years, not draws</h2>
          <p>
            To turn draws into years, we divided each game’s draws by the years our data covers. {small.name} ran about{' '}
            {small.perWeek.toFixed(1)} draws a week, or {formatNumber(small.drawsPerYear)} a year. {big.name} ran about{' '}
            {big.perWeek.toFixed(1)} a week, or {formatNumber(big.drawsPerYear)} a year.
          </p>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[560px]">
              <thead>
                <tr>
                  <th scope="col">One line, every draw</th>
                  <th scope="col" className="text-right">Draws a year</th>
                  <th scope="col" className="text-right">Average years to one jackpot</th>
                  <th scope="col" className="text-right">Chance of a jackpot in {PLAY_YEARS} years</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{r.name}</th>
                    <td className="text-right font-mono tabular">{formatNumber(r.drawsPerYear)}</td>
                    <td className="text-right font-mono tabular">{formatNumber(r.yearsToJackpot)}</td>
                    <td className="text-right font-mono tabular">{formatPercent(r.lifetimeChance, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Suppose you buy one {big.name} line for every draw. You’d wait about {formatNumber(big.yearsToJackpot)}{' '}
            years, on average, for one jackpot. For {small.name}, the average wait is about{' '}
            {formatNumber(small.yearsToJackpot)} years.
          </p>
          <p>
            Put another way, playing one 6/42 line every draw for {PLAY_YEARS} years gives you about a{' '}
            {formatPercent(small.lifetimeChance, 2)} chance of ever winning its jackpot. For 6/58, it’s about{' '}
            {formatPercent(big.lifetimeChance, 2)}.
          </p>
          <p>
            Smaller wins are far more common. One 6/42 line matches at least 3 numbers about once every{' '}
            {formatNumber(1 / atLeastThree42)} draws. That’s roughly {formatPercent(atLeastThree42)} of draws.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>More lines cost more, at the same rate</h2>
          <p>
            Buying 10 different lines for one draw gives you 10 chances out of {formatNumber(small.odds)} in 6/42. Your
            chance goes up 10 times. Your cost also goes up 10 times.
          </p>
          <p>
            So the chance you buy with each peso stays the same. No number pattern, system, or app changes that. This
            includes BayanWin’s models, which describe past draws and don’t predict future ones.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Bigger jackpots, same odds</h2>
          <p>
            When no one wins, the jackpot rolls over to the next draw and grows. A bigger jackpot changes what you’d
            win. It doesn’t change your chance of winning it.
          </p>
          <p>
            A 6/58 line has 1 in {formatNumber(big.odds)} odds when the jackpot is small, and the same odds when it’s
            record-sized. If more people play when the jackpot is large, the chance that someone else also matches goes
            up. Your own chance stays where it was.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Before you play</h2>
          <p>
            Treat a lotto ticket as the cost of entertainment, not as a plan to earn money. Set a budget you can afford
            to lose, and stop when you reach it. Read our{' '}
            <Link to="/responsible-play" className="link">
              responsible play guide
            </Link>{' '}
            for practical limits and where to get help.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>How we calculated this</h2>
          <p>
            We counted the possible lines for each game with the standard formula for choosing 6 from n numbers. The
            match chances use the same counting for partial matches. Draw counts, dates, and jackpot draws come from our
            PCSO results dataset. Read our{' '}
            <Link to="/methodology" className="link">
              methodology
            </Link>{' '}
            for how we collect and check it.
          </p>
        </section>

        <AuthorBio />

        <section className="space-y-2 text-sm">
          <h2 className="text-lg font-semibold text-white">Related reading</h2>
          <ul className="list-disc space-y-1 pl-5 text-slate-300">
            <li>
              <Link to="/blog/pcso-649-results-analysis" className="link">
                PCSO 6/49 results: what the draws show
              </Link>
            </li>
            <li>
              <Link to="/blog/pcso-658-results-analysis" className="link">
                PCSO 6/58 results analysis
              </Link>
            </li>
            <li>
              <Link to="/responsible-play" className="link">
                Responsible play
              </Link>
            </li>
            <li>
              <Link to="/blog" className="link">
                All articles
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </main>
  );
}

export default PcsoJackpotOdds;
