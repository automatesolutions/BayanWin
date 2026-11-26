import React from 'react';
import { Link } from '../components/SiteLink';
import ArticleMeta from '../components/ArticleMeta';
import AuthorBio from '../components/AuthorBio';
import { AUTHOR } from '../seo/author';
import { allGames, dataRange, formatDate, formatNumber, formatPeso } from '../data/stats';

const MODELS = [
  ['Markov chains', 'Treat the draws as a sequence and count how often one state follows another.', '/blog/markov-chains-lottery', 'How the Markov model works'],
  ['NashHotFilter', 'Uses game theory to spread a set of tickets across hot numbers, low and high ranges.', '/blog/nash-hotfilter', 'How NashHotFilter works'],
  ['Deep reinforcement learning', 'An agent that adjusts its picks from the gap between past picks and real results.', '/blog/deep-reinforcement-learning', 'How the deep RL model works'],
  ['XGBoost and decision trees', 'Tree models trained on features from past draws, such as frequency and gaps.'],
  ['Anomaly detection', 'Monte Carlo runs that show which sums and combinations are common and which are rare.'],
  ['Miro', 'A language model reads the six other models and writes one line, with the reasons to doubt it.', '/blog/miro-prediction', 'How Miro works'],
];

function AboutBayanWin() {
  const games = allGames();
  const totalDraws = games.reduce((n, g) => n + g.draws, 0);

  return (
    <main id="main" className="page max-w-4xl">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="link">
          Home
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <span className="text-slate-300">About BayanWin</span>
      </nav>

      <article className="article text-slate-200 space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">About BayanWin</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            What BayanWin is, who runs it, what our data shows, and how to use it without fooling yourself.
          </p>
          <ArticleMeta />
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-xl font-semibold text-white">
            What BayanWin is
          </h2>
          <p>
            BayanWin is a free website for PCSO lotto draw history in the Philippines. It covers five games: Lotto 6/42,
            Mega Lotto 6/45, Super Lotto 6/49, Grand Lotto 6/55, and Ultra Lotto 6/58.
          </p>
          <p>
            For each game you get the latest results, number statistics, a ticket checker, and the output of seven
            models. You don&apos;t need an account, and we don&apos;t sell tickets or link to betting sites.
          </p>
          <p>
            BayanWin isn&apos;t affiliated with PCSO. Always check winning numbers and prizes with PCSO or an authorized
            lotto outlet before you act on them.
          </p>
        </section>

        <section
          id="who-runs-bayanwin"
          className="space-y-3 text-sm leading-relaxed text-slate-300"
          aria-labelledby="who-heading"
        >
          <h2 id="who-heading" className="text-xl font-semibold text-white">
            Who runs BayanWin
          </h2>
          <p>
            {AUTHOR.name} runs BayanWin from the {AUTHOR.location}, writes the articles on this site, and builds the
            dashboard and the models.
          </p>
          <p>
            We built BayanWin to put PCSO draw history in one place and to test popular lotto ideas, like hot numbers,
            against real results. When an idea fails that test, we say so on the page.
          </p>
          <p>
            To reach us, email{' '}
            <a href={`mailto:${AUTHOR.email}`} className="link">
              {AUTHOR.email}
            </a>{' '}
            or use the{' '}
            <Link to="/contact" className="link">
              contact page
            </Link>
            .
          </p>
          <AuthorBio className="mt-5" headingLevel="h3" />
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="data-heading">
          <h2 id="data-heading" className="text-xl font-semibold text-white">
            What {formatNumber(totalDraws)} draws show
          </h2>
          <p>
            Our dataset holds every result we have for the five games from {dataRange()}. The table sums it up.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th scope="col">Game</th>
                  <th scope="col" className="text-right">
                    Draws
                  </th>
                  <th scope="col" className="text-right">
                    Jackpot odds
                  </th>
                  <th scope="col" className="text-right">
                    Draws with a jackpot winner
                  </th>
                  <th scope="col" className="text-right">
                    Largest jackpot won
                  </th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.key}>
                    <th scope="row" className="whitespace-nowrap text-left font-normal text-white">
                      {g.name}
                    </th>
                    <td className="text-right font-mono tabular">{formatNumber(g.draws)}</td>
                    <td className="whitespace-nowrap text-right font-mono tabular">1 in {formatNumber(g.odds)}</td>
                    <td className="text-right font-mono tabular">{formatNumber(g.jackpots.won)}</td>
                    <td className="whitespace-nowrap text-right font-mono tabular">
                      {g.jackpots.largest_won ? (
                        <>
                          {formatPeso(g.jackpots.largest_won)}
                          <span className="block text-xs text-silver-500">{formatDate(g.jackpots.largest_won_date)}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            The bigger the pool of balls, the longer the odds and the rarer the jackpot winners. The numbers themselves
            behave the way random draws should. Sums cluster around the value math predicts, and the &quot;hot&quot;
            numbers of the last 50 draws hit no more often than any others. The{' '}
            <Link to="/methodology" className="link">
              methodology
            </Link>{' '}
            page has the full test.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="tools-heading">
          <h2 id="tools-heading" className="text-xl font-semibold text-white">
            What you can do on BayanWin
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">See the latest results</strong> for every game, with the draw date and
              the next draw day.
            </li>
            <li>
              <strong className="text-slate-200">Check how often each number came up</strong> compared with what chance
              predicts, and how long each number has gone without appearing. A long gap doesn&apos;t make a number
              &quot;due.&quot;
            </li>
            <li>
              <strong className="text-slate-200">Compare sums and products</strong> of winning numbers against a normal
              distribution, to see which draws were typical and which were unusual.
            </li>
            <li>
              <strong className="text-slate-200">Explore number pairs and sequences</strong> in the co-occurrence graph
              and the Markov transition map.
            </li>
            <li>
              <strong className="text-slate-200">Track each model over time.</strong> We store every pick and compare it
              with the real result, so you can see how far off each model was.
            </li>
            <li>
              <strong className="text-slate-200">Check your own ticket</strong> against past results with the ticket
              checker.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="models-heading">
          <h2 id="models-heading" className="text-xl font-semibold text-white">
            The seven models
          </h2>
          <p>
            Each model makes different assumptions about the draws. We show them side by side so you can see where they
            agree and where they don&apos;t. None of them can change your odds.
          </p>
          <dl className="space-y-4 border-l-2 border-electric-500/40 pl-4">
            {MODELS.map(([name, desc, href, linkLabel]) => (
              <div key={name}>
                <dt className="text-base font-semibold text-white">{name}</dt>
                <dd className="mt-1">
                  {desc}{' '}
                  {href && (
                    <Link to={href} className="link whitespace-nowrap">
                      {linkLabel}
                    </Link>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="text-slate-400 border-t border-slate-600/50 pt-6 text-sm leading-relaxed"
          aria-labelledby="disclaimer-heading"
        >
          <h2 id="disclaimer-heading" className="text-lg font-semibold text-slate-300 mb-2">
            What BayanWin isn&apos;t
          </h2>
          <p>
            BayanWin is for <strong className="text-slate-300">education and entertainment only</strong>. It isn&apos;t
            financial, legal, or gambling advice. Past draws don&apos;t predict future ones, and there are{' '}
            <strong className="text-slate-300">no guaranteed wins</strong>. You must be 18 or older to play PCSO games.
            If you play, set a budget first. Our{' '}
            <Link to="/responsible-play" className="link">
              responsible play
            </Link>{' '}
            page explains how.
          </p>
          <p className="mt-3">
            To go deeper, read the{' '}
            <Link to="/methodology" className="link">
              methodology
            </Link>
            , then the{' '}
            <Link to="/blog/pcso-658-results-analysis" className="link">
              6/58 results analysis
            </Link>{' '}
            and the{' '}
            <Link to="/blog/pcso-649-results-analysis" className="link">
              6/49 results analysis
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  );
}

export default AboutBayanWin;
