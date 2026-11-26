import React from 'react';
import { Link } from '../components/SiteLink';
import ArticleMeta from '../components/ArticleMeta';
import ArticleImage from '../components/ArticleImage';
import nashImage from '../assets/articles/nash.webp';
import AuthorBio from '../components/AuthorBio';
import { allGames, formatNumber, dataRange } from '../data/stats';

const GAMES = allGames();
const WINDOW = GAMES[0].backtests.window;
const TOTAL_TESTED = GAMES.reduce((sum, g) => sum + g.backtests.hot_six.compared, 0);
const avg = (n) => n.toFixed(2);

/** Largest gap, in either direction, between the hot six and chance in any game. */
const MAX_GAP = Math.max(...GAMES.map((g) => Math.abs(g.backtests.hot_six.mean - g.backtests.expected_mean)));
const HOT_BEAT_COLD = GAMES.filter((g) => g.backtests.hot_six.mean > g.backtests.cold_six.mean).map((g) => g.key);

function BlogNashHotFilter() {
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
        <span className="text-slate-300">NashHotFilter</span>
      </nav>

      <article className="article text-slate-200 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">NashHotFilter and the spirit of <em>A Beautiful Mind</em></h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            This article answers one question: do hot numbers help, and what does{' '}
            <strong className="text-slate-200">NashHotFilter</strong> actually do with them? NashHotFilter is one of the
            six numeric models on BayanWin. It mixes an idea from game theory with hot and cold number counts from PCSO
            draw history. Below, we explain the idea, show how the model builds a line, and test hot numbers on our own
            data.
          </p>
          <ArticleMeta />
        </header>

        <ArticleImage src={nashImage} alt="Two hands playing rock, paper, scissors over a wooden table" />

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Why the name comes from a film</h2>
          <p>
            Most people know John Nash from the 2001 film <em>A Beautiful Mind</em>, with Russell Crowe as Nash. The film
            is a drama, and it changes many facts of his life. It did make “Nash equilibrium” a phrase people recognize.
            We use the name for that reason: it tells you this model borrows from game theory.
          </p>
          <p>
            Nash shared the 1994 Nobel Memorial Prize in Economic Sciences for his work on non-cooperative games. He never
            worked on lotteries. Nothing in his math says how to pick lottery numbers.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Mixed strategies in plain words</h2>
          <p>
            Game theory studies choices where your best move depends on what others do. A Nash equilibrium is a set of
            choices where no player gains by changing only their own.
          </p>
          <p>
            Sometimes no fixed choice is stable. In rock-paper-scissors, a player who always throws rock loses to paper.
            The stable plan is to throw each option one third of the time, at random. That plan is a{' '}
            <strong className="text-slate-200">mixed strategy</strong>: you choose among options with fixed odds, so
            nobody can predict you. Nash proved every finite game has an equilibrium once mixed strategies are allowed.
          </p>
          <p>
            A PCSO draw has no opponent. The machine doesn’t react to your ticket, so no lottery pick is an equilibrium in
            the strict sense. NashHotFilter borrows only the habit of choosing at random among balanced options.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">How NashHotFilter builds a line</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong className="text-slate-100">Build a wheel of 8 tickets.</strong> For 6/49 the model uses a fixed set
              of 8 tickets, each with 3 low numbers (1 to 24) and 3 high numbers (25 to 49). For the other games it
              generates 8 different tickets. Each has 3 odd and 3 even numbers, and 3 numbers from each half of the range.
            </li>
            <li>
              <strong className="text-slate-100">Pick 1 ticket with equal odds.</strong> Each ticket has a 1 in 8 (12.5%)
              chance. This is the mixed-strategy step: no ticket is favored.
            </li>
            <li>
              <strong className="text-slate-100">Count hot and cold numbers.</strong> The model counts how often each
              number has come up in all stored draws for that game. The 20 most-drawn numbers are hot. The 15
              least-drawn are cold.
            </li>
            <li>
              <strong className="text-slate-100">Swap up to 2 cold numbers.</strong> If the ticket holds cold numbers, the
              model replaces up to 2 of them with hot numbers of the same type, odd for odd and even for even. More often
              drawn numbers are more likely to be chosen.
            </li>
            <li>
              <strong className="text-slate-100">Sort and return.</strong> The model sorts the 6 numbers and shows them on
              the dashboard. Without frequency data, it returns the wheel ticket unchanged.
            </li>
          </ol>
          <p>
            The result is neither the 6 hottest numbers nor a random spread. Steps 2 and 4 use randomness, so 2 runs can
            give 2 different lines.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="sec-hot-test">
          <h2 id="sec-hot-test" className="text-xl font-semibold text-white">
            We tested hot numbers on 11 years of draws
          </h2>
          <p>
            Step 4 assumes hot numbers are worth keeping. So we checked. We used every PCSO draw from {dataRange()}. For
            each draw, we took the 6 most-drawn numbers of the previous {WINDOW} draws (the hot six) and the 6
            least-drawn (the cold six). Then we counted how many of each set the next draw matched.
          </p>
          <p>
            The table shows the average matches per draw. “Chance” is what any random line of 6 numbers averages. In
            total we tested {formatNumber(TOTAL_TESTED)} draws.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[560px]">
              <caption className="sr-only">Average numbers matched per draw by hot six, cold six, and a random line</caption>
              <thead>
                <tr>
                  <th scope="col">Game</th>
                  <th scope="col" className="text-right">Draws tested</th>
                  <th scope="col" className="text-right">Hot six</th>
                  <th scope="col" className="text-right">Cold six</th>
                  <th scope="col" className="text-right">Chance</th>
                </tr>
              </thead>
              <tbody>
                {GAMES.map((g) => {
                  const b = g.backtests;
                  return (
                    <tr key={g.key}>
                      <th scope="row" className="whitespace-nowrap text-left font-mono font-semibold text-white tabular">
                        {g.key}
                      </th>
                      <td className="text-right font-mono tabular">{formatNumber(b.hot_six.compared)}</td>
                      <td className="text-right font-mono tabular">{avg(b.hot_six.mean)}</td>
                      <td className="text-right font-mono tabular">{avg(b.cold_six.mean)}</td>
                      <td className="text-right font-mono tabular">{avg(b.expected_mean)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p>
            Hot numbers hit no more often than cold numbers or chance. The hot six beat the cold six in{' '}
            {HOT_BEAT_COLD.length} of {GAMES.length} games and lost in the rest. The biggest gap from chance in any game is{' '}
            {MAX_GAP.toFixed(3)} numbers per draw. That’s 1 match more or less every {formatNumber(1 / MAX_GAP)} draws.
            So NashHotFilter
            doesn’t raise your odds. Its value is spreading your tickets with variety and structure.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">What balance does and doesn’t change</h2>
          <p>
            A 6/49 ticket has a 1 in {formatNumber(GAMES.find((g) => g.key === '6/49').odds)} chance of matching all 6
            numbers. That holds whether the line is balanced, hot, or random.
          </p>
          <p>
            One effect is real, though small. Balanced lines avoid patterns like 1-2-3-4-5-6 that many players choose. If
            a popular pattern won, many winners would split the prize.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="sec-faq-nash">
          <h2 id="sec-faq-nash" className="text-xl font-semibold text-white">
            Questions about NashHotFilter
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-200">Did John Nash work on lottery prediction?</h3>
              <p className="text-slate-400 mt-1">
                No. His work proved that equilibria exist in non-cooperative games. NashHotFilter borrows the
                mixed-strategy idea, not any lottery method.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Can NashHotFilter predict winning PCSO numbers?</h3>
              <p className="text-slate-400 mt-1">
                No. PCSO draws are random. Use NashHotFilter to explore and compare lines, not to beat the draw.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">How is it different from picking the most frequent numbers?</h3>
              <p className="text-slate-400 mt-1">
                A pure hot pick takes the 6 most-drawn numbers. NashHotFilter starts from a balanced ticket and changes at
                most 2 numbers, so frequency adjusts the line without taking it over.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Why do I get a different line each time?</h3>
              <p className="text-slate-400 mt-1">
                The model picks 1 of 8 tickets at random and chooses its swaps at random, weighted by frequency. Each run
                can land on a different ticket and different swaps.
              </p>
            </div>
          </div>
        </section>

        <AuthorBio />

        <section className="space-y-3 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">Related reading</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <Link to="/blog/miro-prediction" className="link">
                How Miro merges six models into one pick
              </Link>
            </li>
            <li>
              <Link to="/blog/markov-chains-lottery" className="link">
                Markov chain lottery analysis in the Philippines
              </Link>
            </li>
            <li>
              <Link to="/blog/pcso-649-results-analysis" className="link">
                PCSO 6/49 results analysis
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
          BayanWin is not affiliated with PCSO. Lottery draws are random, and past frequency doesn’t change the next draw.
          Play only with money you can afford to lose. 18+ only.
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

export default BlogNashHotFilter;
