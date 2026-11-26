import React from 'react';
import { Link } from '../components/SiteLink';
import ArticleMeta from '../components/ArticleMeta';
import AuthorBio from '../components/AuthorBio';
import { allGames, formatNumber, formatPercent, dataRange } from '../data/stats';

const TITLE = 'Do PCSO lotto draws have memory? A Markov chain check';

/** Average numbers shared per draw, to 2 decimals. */
const fmtMean = (x) => x.toFixed(2);

// One row per game: does a draw share numbers with the draw before it more (or less) than chance?
const rows = allGames().map((g) => {
  const b = g.backtests;
  const rp = b.repeat_previous;
  return {
    key: g.key,
    name: g.name,
    balls: g.balls,
    odds: g.odds,
    pairs: rp.compared,
    actual: rp.mean,
    chance: b.expected_mean,
    gap: Math.abs(rp.mean - b.expected_mean),
    atLeastOne: 1 - rp.share['0'],
    chanceAtLeastOne: 1 - b.chance_share['0'],
  };
});

const largest = rows.reduce((a, r) => (r.gap > a.gap ? r : a), rows[0]);
const fewestPairs = Math.min(...rows.map((r) => r.pairs));
const first = rows[0];
const game649 = rows.find((r) => r.key === '6/49') || rows[0];

function BlogMarkovChainsLottery() {
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
        <span className="text-slate-300">{TITLE}</span>
      </nav>

      <article className="article text-slate-200 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">{TITLE}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            If 14 came up in last night&apos;s draw, is it more likely tonight, or less? This article answers one
            question: do PCSO draws remember the draw before them? We use Markov chains to frame the question. We use
            PCSO results from {dataRange()} to answer it.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mt-2">
            The short answer is no. In all five games, a draw shares numbers with the one before it about as often as
            chance predicts.
          </p>
          <ArticleMeta />
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="markov-what">
          <h2 id="markov-what" className="text-xl font-semibold text-white">
            What a Markov chain is
          </h2>
          <p>
            A Markov chain models something that moves between states, one step at a time. One rule defines it: the
            next step depends only on the current state. How the system got there doesn&apos;t matter. Mathematicians
            call this the memoryless property.
          </p>
          <p>
            The classic picture is the drunkard&apos;s walk. A man on a straight street takes one step forward or one
            step back, each with the same chance. He has no memory of the path behind him. Only where he stands now
            affects where he can go next.
          </p>
          <p>
            A move from one state to another is a transition. A transition table lists the chance of every move. A
            made-up weather model might say a rainy day is followed by another rainy day 60% of the time. If you know
            today, the table gives you odds for tomorrow.
          </p>
          <p>
            Andrey Markov introduced these chains in 1906. In 1913 he tested the idea on text. He counted vowels and
            consonants in Pushkin&apos;s poem <em>Eugene Onegin</em> and showed that each letter&apos;s type depended on
            the letter before it.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="markov-where">
          <h2 id="markov-where" className="text-xl font-semibold text-white">
            Where Markov chains do useful work
          </h2>
          <p>Markov chains help when the current state really does shape the next step.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-100">Web search.</strong> Google&apos;s original PageRank modeled a reader
              who clicks random links from page to page. A page&apos;s rank was the share of time that reader spent on
              it in the long run.
            </li>
            <li>
              <strong className="text-slate-100">Speech and text.</strong> Hidden Markov models guess the next sound or
              word from the current one. They were a standard tool in speech recognition for many years.
            </li>
            <li>
              <strong className="text-slate-100">Board games.</strong> In Snakes and Ladders, your next square depends
              only on your current square and the dice.
            </li>
          </ul>
          <p>
            In each case, the current state tells you something about the next one. A lottery has to pass the same
            test before a Markov model can tell you anything about the next draw.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="markov-test">
          <h2 id="markov-test" className="text-xl font-semibold text-white">
            How we tested PCSO draws for memory
          </h2>
          <p>
            If draws have memory, a draw should share numbers with the previous draw more often or less often than
            chance allows. We compared every pair of back-to-back draws in our records, game by game.
          </p>
          <p>
            First, the chance baseline. Each of the 6 numbers in one draw has a 6 in n chance of showing up in an
            unrelated draw, where n is the number of balls. So two unrelated draws share 36 ÷ n numbers on average.
            For {first.key}, that&apos;s 36 ÷ {first.balls}, or {fmtMean(first.chance)}.
          </p>

          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[680px]">
              <caption className="sr-only">
                Numbers shared with the previous draw, actual compared with chance, per PCSO game
              </caption>
              <thead>
                <tr>
                  <th scope="col">Game</th>
                  <th scope="col" className="text-right">Draw pairs compared</th>
                  <th scope="col" className="text-right">Shared on average</th>
                  <th scope="col" className="text-right">Chance predicts</th>
                  <th scope="col" className="text-right">Shared 1 or more</th>
                  <th scope="col" className="text-right">Chance predicts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row" className="whitespace-nowrap py-3 pr-6 text-left font-normal">
                      <span className="block font-mono font-semibold text-white tabular">{r.key}</span>
                      <span className="text-xs text-silver-400">{r.name}</span>
                    </th>
                    <td className="whitespace-nowrap py-3 text-right font-mono tabular">{formatNumber(r.pairs)}</td>
                    <td className="whitespace-nowrap py-3 text-right font-mono tabular">{fmtMean(r.actual)}</td>
                    <td className="whitespace-nowrap py-3 text-right font-mono tabular">{fmtMean(r.chance)}</td>
                    <td className="whitespace-nowrap py-3 text-right font-mono tabular">
                      {formatPercent(r.atLeastOne)}
                    </td>
                    <td className="whitespace-nowrap py-3 text-right font-mono tabular">
                      {formatPercent(r.chanceAtLeastOne)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            Actual and chance match closely in every game. The largest gap is {fmtMean(largest.gap)} numbers per draw,
            in {largest.key}, which is normal random variation over {formatNumber(fewestPairs)} or more pairs. A draw
            doesn&apos;t pull numbers from the one before it, and it doesn&apos;t avoid them either. As far as this test
            can tell, PCSO draws are memoryless and independent of each other.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="markov-forecast">
          <h2 id="markov-forecast" className="text-xl font-semibold text-white">
            Why a transition model can&apos;t forecast these draws
          </h2>
          <p>
            A Markov model learns from history. It counts how often state A was followed by state B. When draws are
            independent, those counts only reflect the overall mix of outcomes. The row for state A looks like the row
            for every other state, plus noise.
          </p>
          <p>
            So the model can describe what happened. It can&apos;t tell you what comes next, because the current draw
            carries no information about the next one. More data makes the noise smaller. It doesn&apos;t create a
            signal that isn&apos;t there.
          </p>
          <p>
            One detail trips people up. Inside a single draw, balls come out without replacement, so no number appears
            twice in the same draw. That rule only applies within a draw. Each new draw starts with the full set of
            balls, so the odds reset.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="markov-useful">
          <h2 id="markov-useful" className="text-xl font-semibold text-white">
            What our Markov view is still good for
          </h2>
          <p>
            We still run a Markov model on BayanWin, and we want to be clear about what it does. It describes each draw
            by the gaps between its sorted numbers. Then it counts which gap patterns followed which in past draws. You
            can see the result in the draw-to-draw transitions graph on the{' '}
            <Link to="/" className="link">home page</Link>.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-100">Describing history.</strong> The graph shows which gap patterns came
              up next to each other in past draws. It&apos;s a record of the past, not a forecast.
            </li>
            <li>
              <strong className="text-slate-100">Checking your intuition.</strong> Many players feel that numbers from
              the last draw come back often. They do: in {first.key}, {formatPercent(first.atLeastOne, 0)} of draws
              shared at least one number with the draw before. Chance predicts{' '}
              {formatPercent(first.chanceAtLeastOne, 0)}. The pattern is real, and it&apos;s what randomness looks like.
            </li>
            <li>
              <strong className="text-slate-100">Learning the method.</strong> A Markov chain is a good first model for
              anyone studying probability. Lottery data gives you a large, clean dataset where you already know the
              right answer.
            </li>
          </ul>
          <p>
            Every BayanWin pick, including the Markov one, has the same odds as any other line. A {game649.key} jackpot
            is 1 in {formatNumber(game649.odds)}, whichever model picks the numbers.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="markov-faq">
          <h2 id="markov-faq" className="text-xl font-semibold text-white">
            Common questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-200">Can a Markov chain predict the next PCSO draw?</h3>
              <p className="text-slate-400 mt-1">
                No. The test above shows a draw doesn&apos;t depend on the draw before it. A model built on transitions
                has nothing real to learn from.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Is the drunkard&apos;s walk a good picture of a lotto draw?</h3>
              <p className="text-slate-400 mt-1">
                Partly. It shows memorylessness well. But the walker&apos;s position builds up step by step, while each
                draw starts from scratch. A closer picture is a new walker who starts at the same spot every night.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Why do some games show actual slightly below chance?</h3>
              <p className="text-slate-400 mt-1">
                Any count from real draws wobbles a little around the expected value. The gaps in the table are a few
                hundredths of a number per draw. Over {formatNumber(fewestPairs)} or more pairs, a gap that small is
                within normal random variation.
              </p>
            </div>
          </div>
        </section>

        <div className="rounded-lg bg-amber-950/25 border border-amber-500/20 px-4 py-3 text-xs text-amber-100/80">
          <strong className="text-amber-200">Disclaimer:</strong> This article is for education only. BayanWin
          isn&apos;t affiliated with PCSO. Draws are random, and past results don&apos;t predict future ones. Play only
          what you can afford to lose. Read our{' '}
          <Link to="/responsible-play" className="link">responsible play guide</Link>.
        </div>

        <AuthorBio />

        <section className="space-y-3 border-t border-slate-600/50 pt-6" aria-labelledby="related-reading">
          <h2 id="related-reading" className="text-lg font-semibold text-white">
            Related reading
          </h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
            <li>
              <Link to="/blog/deep-reinforcement-learning" className="link">
                Can reinforcement learning beat a PCSO lotto draw?
              </Link>
            </li>
            <li>
              <Link to="/blog/nash-hotfilter" className="link">
                NashHotFilter and game theory in PCSO lotto
              </Link>
            </li>
            <li>
              <Link to="/blog/pcso-649-results-analysis" className="link">
                PCSO 6/49 results analysis
              </Link>
            </li>
            <li>
              <Link to="/methodology" className="link">
                How BayanWin collects data and runs its models
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </main>
  );
}

export default BlogMarkovChainsLottery;
