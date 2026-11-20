import React from 'react';
import { Link } from 'react-router-dom';
import ArticleMeta from '../components/ArticleMeta';

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
            BayanWin’s <strong className="text-slate-200">NashHotFilter</strong> takes its name from mathematician John
            Nash and his idea of a mixed strategy. It combines that idea with hot and cold number counts from PCSO draw
            history. This article explains the game theory in plain words, then shows step by step how the model builds
            its six-number line.
          </p>
          <ArticleMeta />
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Why the name comes from a film</h2>
          <p>
            Most people first met John Nash through Ron Howard’s 2001 film <em>A Beautiful Mind</em>, with Russell Crowe
            as Nash. The film is a drama, not a math lesson, and it changes many facts of his life. It still did one
            useful thing: it made “Nash equilibrium” a phrase that people outside universities recognize. We chose the
            name for the same reason. It tells you, in two words, that this model borrows from game theory.
          </p>
          <p>
            The real Nash shared the 1994 Nobel Memorial Prize in Economic Sciences for his work on non-cooperative
            games. He never worked on lotteries, and nothing in his math says how to pick lottery numbers.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Nash equilibrium in plain words</h2>
          <p>
            Game theory studies decisions where your best move depends on what other people do. A Nash equilibrium is a
            set of choices, one per player, where no player can do better by changing only their own choice. Everyone is
            already giving their best response to everyone else.
          </p>
          <p>
            Sometimes no single fixed choice is stable. In rock-paper-scissors, any player who always throws rock gets
            beaten. The stable plan is to throw each option one third of the time, at random. Game theory calls this a{' '}
            <strong className="text-slate-200">mixed strategy</strong>: you pick among options with fixed odds, so nobody
            can predict and punish your choice. Nash proved that every finite game has at least one equilibrium, if
            players are allowed mixed strategies.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Why a lottery is not really a game</h2>
          <p>
            PCSO games such as 6/42, 6/45, 6/49, 6/55, and 6/58 have no strategic opponent. The draw machine does not
            react to your ticket, and other players’ choices do not change which balls come out. So no lottery strategy
            is a Nash equilibrium in the strict sense.
          </p>
          <p>
            What NashHotFilter borrows is the habit of balancing. A line built only from the most-drawn numbers bunches
            up. A purely random line ignores history completely. NashHotFilter starts from a set of balanced tickets,
            picks one with equal odds, and then lets historical frequency adjust it a little.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">How NashHotFilter builds a line</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong className="text-slate-100">Build a wheel of eight tickets.</strong> For 6/49 the model uses a
              fixed set of eight tickets, and each has three low numbers (1 to 24) and three high numbers (25 to 49). For
              the other games it generates eight different tickets. Each has three odd and three even numbers, and
              three numbers from each half of the range.
            </li>
            <li>
              <strong className="text-slate-100">Pick one ticket with equal odds.</strong> Each of the eight tickets has
              a 1 in 8 (12.5%) chance. This is the mixed-strategy step: no ticket is favored.
            </li>
            <li>
              <strong className="text-slate-100">Find the cold numbers.</strong> The model counts how often every number
              has appeared across all stored draws for that game. The 15 least-drawn numbers are cold. The 20 most-drawn
              numbers are hot.
            </li>
            <li>
              <strong className="text-slate-100">Swap up to two cold numbers.</strong> If the chosen ticket holds cold
              numbers, the model replaces up to two of them with hot numbers of the same type: odd for odd, even for
              even. It picks each replacement at random, with more often drawn numbers more likely to be picked.
            </li>
            <li>
              <strong className="text-slate-100">Sort and return.</strong> The six numbers are sorted and shown on the
              dashboard. If the frequency data is not available, the model returns the chosen wheel ticket unchanged.
            </li>
          </ol>
          <p>
            The result sits between two extremes. It is not the six hottest numbers, and it is not a random spread.
            Because steps two and four use randomness, running the model twice can give two different lines.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">What this does and doesn’t change</h2>
          <p>
            Balance makes a line look reasonable, and frequency makes it reflect the record. Neither changes your odds.
            A 6/49 ticket has a 1 in 13,983,816 chance of matching all six numbers, whether it is balanced, hot, or
            picked at random. A number that came up often in the past has no greater chance in the next draw.
          </p>
          <p>
            One practical effect is real, though small. Balanced lines avoid patterns such as 1-2-3-4-5-6 that many
            players choose. If such a line ever won, the prize would be split among many winners.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="sec-faq-nash">
          <h2 id="sec-faq-nash" className="text-xl font-semibold text-white">
            FAQ: NashHotFilter and game theory in lottery analysis
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-200">Did John Nash actually work on lottery prediction?</h3>
              <p className="text-slate-400 mt-1">
                No. His work proved that equilibria exist in non-cooperative games. BayanWin’s NashHotFilter borrows the
                mixed-strategy idea and the habit of balancing, not any method Nash wrote about lotteries.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Can the NashHotFilter predict winning PCSO numbers?</h3>
              <p className="text-slate-400 mt-1">
                No. PCSO draws are random by design. NashHotFilter is one of six numeric models in BayanWin, useful for
                exploring and comparing lines, not for beating randomness.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">How is NashHotFilter different from picking the most frequent numbers?</h3>
              <p className="text-slate-400 mt-1">
                A pure hot-number pick takes the six most-drawn numbers. NashHotFilter starts from a balanced ticket and
                changes at most two of its numbers, so frequency adjusts the line without taking it over.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Why do I get a different line each time?</h3>
              <p className="text-slate-400 mt-1">
                The model picks one of eight tickets at random and draws its replacements at random, weighted by
                frequency. Different runs can land on different tickets and different swaps.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">Related articles</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <Link to="/blog/markov-chains-lottery" className="link">
                Markov chain lottery analysis in the Philippines
              </Link>
            </li>
            <li>
              <Link to="/blog/miro-prediction" className="link">
                How Miro merges six models into one pick
              </Link>
            </li>
            <li>
              <Link to="/methodology" className="link">
                BayanWin lottery methodology and limitations
              </Link>
            </li>
          </ul>
        </section>

        <p className="text-xs text-slate-500 border-t border-slate-600/50 pt-5">
          BayanWin is not affiliated with PCSO. Lottery draws are random; past frequency does not change the next draw.
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
