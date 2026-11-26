import React from 'react';
import { Link } from '../components/SiteLink';
import ArticleMeta from '../components/ArticleMeta';
import AuthorBio from '../components/AuthorBio';
import { allGames, formatNumber, formatPercent, dataRange } from '../data/stats';

function Methodology() {
  const games = allGames();

  return (
    <main id="main" className="page max-w-4xl">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="link">
          Home
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <span className="text-slate-300">Methodology</span>
      </nav>

      <article className="article text-slate-200 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-white">How BayanWin makes its picks</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
            This page answers one question. How does BayanWin get its data and turn it into picks,
            and what can't those picks do? We cover where the PCSO draw results come from, how often
            we update them, the 6 models we run, and what our own data says about randomness.
          </p>
          <ArticleMeta />
        </header>

        {/* Data Sources */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-data">
          <h2 id="method-data" className="text-xl font-semibold text-white">Where the draw results come from</h2>
          <p>
            We start with <strong className="text-slate-200">official PCSO draw history</strong> for 5
            games: Lotto 6/42, Mega Lotto 6/45, Super Lotto 6/49, Grand Lotto 6/55, and Ultra Lotto
            6/58. Each game has more than a thousand past draws, with 6 numbers per draw.
          </p>
          <p>
            We keep the history in structured spreadsheets. Two processes copy new draws from those
            records into our database:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">Scheduled sync.</strong> A Cloud Scheduler job calls
              our backend every 20 to 30 minutes. It pulls any new draws added to the records. You
              don't have to do anything.
            </li>
            <li>
              <strong className="text-slate-200">On-demand sync.</strong> When you pick a game on the
              homepage, the app runs a sync first. The dashboards then load with the latest draws we
              have.
            </li>
          </ul>
          <p>
            The database is <strong className="text-slate-200">InstantDB</strong>. It supports live
            updates, so dashboards refresh without a full page reload.
          </p>
          <p>
            BayanWin is independent and isn't an official PCSO source. To verify a draw, check a
            schedule, or claim a prize, go to <strong className="text-slate-200">pcso.gov.ph</strong>.
          </p>
        </section>

        {/* Feature Engineering */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-features">
          <h2 id="method-features" className="text-xl font-semibold text-white">What we measure in each draw</h2>
          <p>
            A list of past numbers isn't something a model can read directly. So we turn each draw
            into measurements, called features. The models work from these:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">Frequency.</strong> How often each number came up in
              the last 50 draws, the last 100 draws, and the full history. We compare each count to
              what equal chances would give.
            </li>
            <li>
              <strong className="text-slate-200">Gaps.</strong> How many draws have passed since each
              number last came up. We label long gaps "overdue" for exploration only. A long gap
              doesn't change the next draw.
            </li>
            <li>
              <strong className="text-slate-200">Pairs.</strong> How often 2 numbers appear in the same
              draw. The graph view shows the strongest pairs.
            </li>
            <li>
              <strong className="text-slate-200">Sum and product.</strong> The total of the 6 numbers in
              each draw. This shows the usual range of results.
            </li>
            <li>
              <strong className="text-slate-200">Transitions.</strong> Which numbers came up in the draw
              after a given number. The Markov chain model uses these.
            </li>
            <li>
              <strong className="text-slate-200">Position.</strong> Whether a number shows up more often
              as the lowest, a middle, or the highest number once a draw is sorted.
            </li>
          </ul>
        </section>

        {/* Model Family */}
        <section className="space-y-6 text-sm leading-relaxed text-slate-300" aria-labelledby="method-models">
          <h2 id="method-models" className="text-xl font-semibold text-white">The 6 models we run</h2>
          <p>
            Each model makes different assumptions about the draws. We don't treat any one of them as
            the right answer. Where they agree and where they differ is part of what we show you.
          </p>

          <div className="space-y-6 border-l-2 border-electric-500/30 pl-5">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">XGBoost (gradient boosted trees)</h3>
              <p>
                XGBoost trains many decision trees on the features above. Each new tree corrects the
                errors of the one before it. We retrain it from time to time as new draws come in.
              </p>
              <p>
                It scores every number in the pool and returns the top 6. It has no sense of order
                between draws. Each pick is a separate scoring problem.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Decision tree</h3>
              <p>
                This is a single tree trained on the same features as XGBoost. It's less accurate, but
                you can follow every split that led to its pick. We keep it as a plain baseline next to
                the more complex models.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Markov chain</h3>
              <p>
                The Markov model looks at the draws as a sequence. It assumes the next draw depends
                partly on recent ones. We build a transition table from the full history. Each cell
                holds how often number B came up in the draw right after number A.
              </p>
              <p>
                Over the long run, the table settles into a steady frequency for each number. We use
                that long-run figure along with recent transitions to rank numbers. The Markov graph
                shows the strongest links in both directions. Read more in the{' '}
                <Link to="/blog/markov-chains-lottery" className="link">
                  Markov chains lottery article
                </Link>
                .
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">NashHotFilter (game theory heuristic)</h3>
              <p>
                NashHotFilter borrows the idea of a Nash equilibrium from game theory. In that idea, a
                stable strategy is one nobody can improve by changing it alone. Here it means a
                balanced set of numbers. None of them are very hot lately, and none have been missing
                for very long.
              </p>
              <p>
                The filter mixes frequency, gaps, and pair counts into one score. Then it picks the 6
                numbers with the best balance. It's a rule of thumb for exploring the data. Read more in
                the{' '}
                <Link to="/blog/nash-hotfilter" className="link">
                  NashHotFilter article
                </Link>
                .
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Deep reinforcement learning (DRL)</h3>
              <p>
                The DRL model picks numbers one at a time, like moves in a game. After each draw, it
                gets a score based on how far its pick was from the result. We store that distance in
                the database. Over time, the model shifts toward choices that gave smaller distances.
              </p>
              <p>
                Unlike XGBoost and the decision tree, it keeps updating as new results come in. It
                starts from saved weights, so it doesn't retrain from zero each time. Read more in the{' '}
                <Link to="/blog/deep-reinforcement-learning" className="link">
                  deep reinforcement learning article
                </Link>
                .
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Miro (language model summary)</h3>
              <p>
                Miro is a large language model (LLM) that reads the output of the 5 models above. It
                gets each model's numbers, confidence scores, feature summaries, and distance history.
                It also gets the current state of the game: hot and cold numbers, top pairs, and strong
                transitions.
              </p>
              <p>
                Miro works through where the models agree and flags outliers. It checks that there are
                no repeated numbers and that every number is in the game's pool. Then it returns 6
                numbers with a short reason. We show Miro apart from the other models. It combines
                their views rather than acting as a separate model. Read more in the{' '}
                <Link to="/blog/miro-prediction" className="link">
                  Miro article
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Ensemble Comparison */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-ensemble">
          <h2 id="method-ensemble" className="text-xl font-semibold text-white">Comparing the models in the Council Panel</h2>
          <p>
            The <strong className="text-slate-200">Council Panel</strong> shows every model's pick side
            by side. We highlight numbers that more than one model chose. Agreement doesn't make a
            number more likely. It only shows where different assumptions land on the same answer.
          </p>
          <p>
            We show all the picks on purpose. It keeps you from leaning on one model as if it were a
            system.
          </p>
        </section>

        {/* Error Distance */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-error">
          <h2 id="method-error" className="text-xl font-semibold text-white">How we track each model after a draw</h2>
          <p>
            After each draw, we store how far each model's pick was from the result. We call this the
            error distance. It counts matching numbers, the difference in sums, and the offset by
            position. It isn't a simple win or loss.
          </p>
          <p>
            The <strong className="text-slate-200">Error Distance Analysis</strong> dashboard shows this
            history for each model. You can see which models have been closer on average and which jump
            around more.
          </p>
          <p>
            The same numbers feed the DRL model's score. So the DRL model can get better at lowering its
            distance. That doesn't change how random the draw is.
          </p>
        </section>

        {/* Data on randomness */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-randomness">
          <h2 id="method-randomness" className="text-xl font-semibold text-white">What our data shows about randomness</h2>
          <p>
            We tested one popular idea on our own draw history, {dataRange()}. For every draw, we took
            the 6 numbers that came up most in the 50 draws before it. Then we counted how many of those
            6 matched the actual draw.
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[640px]">
              <caption className="sr-only">
                PCSO draws in our data per game, with jackpot odds, average sums, and hot-number matches
              </caption>
              <thead>
                <tr>
                  <th scope="col">Game</th>
                  <th scope="col" className="text-right">Draws in our data</th>
                  <th scope="col" className="text-right">Jackpot odds</th>
                  <th scope="col" className="text-right">Average sum (math)</th>
                  <th scope="col" className="text-right">Hot-six matches (chance)</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.key}>
                    <th scope="row" className="whitespace-nowrap py-3 pr-6 text-left font-normal">
                      <span className="block font-mono font-semibold text-white tabular">{g.key}</span>
                      <span className="text-silver-400">{g.name.replace(/\s*6\/\d+$/, '')}</span>
                    </th>
                    <td className="whitespace-nowrap py-3 text-right font-mono tabular">{formatNumber(g.draws)}</td>
                    <td className="whitespace-nowrap py-3 text-right font-mono tabular">1 in {formatNumber(g.odds)}</td>
                    <td className="whitespace-nowrap py-3 text-right font-mono tabular">
                      {g.sum.mean.toFixed(1)} ({g.sum.theoretical_mean})
                    </td>
                    <td className="whitespace-nowrap py-3 text-right font-mono tabular">
                      {g.backtests.hot_six.mean.toFixed(2)} ({g.backtests.expected_mean.toFixed(2)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            In every game, the hottest 6 numbers matched about as many numbers as any 6 picked at
            random. The average sum of each draw sits within a few points of what the math predicts.
            For 6/42, the hot six matched 0 numbers in{' '}
            {formatPercent(games[0].backtests.hot_six.share['0'])} of draws, against{' '}
            {formatPercent(games[0].backtests.chance_share['0'])} for random picks. Past draws don't
            point to future ones, and none of our models change these odds.
          </p>
        </section>

        {/* Update Cadence */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-cadence">
          <h2 id="method-cadence" className="text-xl font-semibold text-white">How fresh the data is</h2>
          <p>
            PCSO draws each game on set days of the week. On draw days, our scheduler checks for new
            results every 20 to 30 minutes. A new result usually shows up within 1 or 2 checks after the
            official draw. On other days, the job runs less often.
          </p>
          <p>
            Sometimes a sync is late, for example when a source feed stops. The dashboards then show the
            last data we have, with a timestamp of the last update. To force a sync, pick a game on the
            homepage.
          </p>
        </section>

        {/* Limitations */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-limits">
          <h2 id="method-limits" className="text-xl font-semibold text-white">What the picks can't do</h2>
          <div className="rounded-lg bg-amber-950/25 border border-amber-500/20 px-4 py-4 space-y-2 text-amber-100/85 text-xs">
            <p>
              <strong className="text-amber-200">Read this first.</strong> PCSO draws use certified random
              procedures. No model can predict a random draw. The patterns we show are facts about past
              draws. They don't carry over to future ones.
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong className="text-slate-200">Every number has the same chance.</strong> Past counts,
              gaps, and transitions don't bind the next draw. Each number in the pool is equally likely
              every time.
            </li>
            <li>
              <strong className="text-slate-200">Short histories are weaker.</strong> Some patterns only
              mean something over many draws. A game with fewer draws gives less reliable model output.
            </li>
            <li>
              <strong className="text-slate-200">Models lag behind rule changes.</strong> XGBoost and DRL
              learn from past draws. If PCSO changes a game's number pool or draw schedule, they won't
              adjust right away.
            </li>
            <li>
              <strong className="text-slate-200">The records can have errors.</strong> Our draw history
              may contain the odd typo. If you spot one,{' '}
              <Link to="/contact" className="link">
                contact us
              </Link>{' '}
              with the game and draw date.
            </li>
            <li>
              <strong className="text-slate-200">A past match means nothing next time.</strong> A pick
              that came close to an old draw won't be closer to the next one. Check the error distance
              history before you read anything into a pick.
            </li>
          </ul>
          <p>
            If you play, set a budget you can afford to lose. Our{' '}
            <Link to="/responsible-play" className="link">
              Responsible Play page
            </Link>{' '}
            has more on this.
          </p>
        </section>

        {/* FAQ */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-6" aria-labelledby="method-faq">
          <h2 id="method-faq" className="text-xl font-semibold text-white">Questions people ask</h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-slate-200">How often do you retrain the models?</h3>
              <p className="text-slate-400 mt-1">
                We retrain XGBoost and the decision tree from time to time as new draws come in. The DRL
                model updates after each new draw. We rebuild the Markov transition table whenever new
                data arrives.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Why do the models give different numbers?</h3>
              <p className="text-slate-400 mt-1">
                Each model uses different assumptions, features, and ways of learning. So they disagree.
                That's expected, not a bug. We show all of them so you can see it.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Can these models predict the jackpot?</h3>
              <p className="text-slate-400 mt-1">
                No. A jackpot needs all 6 numbers right. The odds for one ticket run from 1 in{' '}
                {formatNumber(games[0].odds)} for 6/42 to 1 in {formatNumber(games[games.length - 1].odds)}{' '}
                for 6/58. No model changes those odds, because the draws are random.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">What does error distance mean?</h3>
              <p className="text-slate-400 mt-1">
                It counts how many of a model's numbers matched the draw. It also measures how far off
                the other numbers were. A lower average over many draws means the model was closer in
                the past. It says nothing about the next draw.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Is BayanWin part of PCSO?</h3>
              <p className="text-slate-400 mt-1">
                No. BayanWin is independent. PCSO and other government agencies don't run, endorse, or
                partner with us. For official results and tickets, use PCSO's own channels.
              </p>
            </div>
          </div>
        </section>

        <AuthorBio />

        <section className="border-t border-slate-600/50 pt-5 text-sm text-slate-400 space-y-2">
          <p>
            For more on each method, read the{' '}
            <Link to="/blog" className="link">
              BayanWin blog
            </Link>
            . To learn who builds BayanWin, see the{' '}
            <Link to="/about" className="link">
              About page
            </Link>
            . To report a data problem or ask a question, use the{' '}
            <Link to="/contact" className="link">
              Contact page
            </Link>
            .
          </p>
        </section>

      </article>
    </main>
  );
}

export default Methodology;
