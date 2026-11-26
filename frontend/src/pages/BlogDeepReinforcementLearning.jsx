import React from 'react';
import { Link } from '../components/SiteLink';
import ArticleMeta from '../components/ArticleMeta';
import AuthorBio from '../components/AuthorBio';
import { allGames, formatNumber, dataRange } from '../data/stats';

const TITLE = 'Can reinforcement learning beat a PCSO lotto draw?';

/** 0.0272 -> "1 in 37" */
const oneIn = (p) => `1 in ${formatNumber(1 / p)}`;

const MATCHES = [3, 4, 5, 6];

const rows = allGames().map((g) => ({
  key: g.key,
  name: g.name,
  odds: g.odds,
  // Chance that one line matches exactly k numbers (backtests.chance_share).
  chances: MATCHES.map((k) => g.backtests.chance_share[String(k)]),
  window: g.backtests.window,
  hotMean: g.backtests.hot_six.mean,
  hotCompared: g.backtests.hot_six.compared,
  expected: g.backtests.expected_mean,
}));

const fmtMean = (x) => x.toFixed(2);
const game649 = rows.find((r) => r.key === '6/49') || rows[0];
const game658 = rows.find((r) => r.key === '6/58') || rows[rows.length - 1];
const hotTotal = rows.reduce((sum, r) => sum + r.hotCompared, 0);
const hotMaxGap = Math.max(...rows.map((r) => Math.abs(r.hotMean - r.expected)));

function BlogDeepReinforcementLearning() {
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
            Reinforcement learning taught computers to beat top players at Go and to play video games from the screen
            alone. So it&apos;s fair to ask: can a reinforcement learning agent learn to beat a lottery draw? This
            article answers that question with the PCSO results we track, from {dataRange()}.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mt-2">
            The short answer is no. The agent isn&apos;t too weak. A lottery gives it nothing to learn.
          </p>
          <ArticleMeta />
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="drl-how">
          <h2 id="drl-how" className="text-xl font-semibold text-white">
            How reinforcement learning works
          </h2>
          <p>
            Reinforcement learning trains an agent by trial and error. Nobody tells the agent the right move. It tries
            an action, gets a score called a reward, and adjusts. Four ideas carry the whole method:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-100">State:</strong> what the agent sees right now, such as the pixels on a
              game screen.
            </li>
            <li>
              <strong className="text-slate-100">Action:</strong> what it chooses to do, such as move left.
            </li>
            <li>
              <strong className="text-slate-100">Reward:</strong> a number that says how well that action turned out.
            </li>
            <li>
              <strong className="text-slate-100">Policy:</strong> the agent&apos;s rule for picking actions. Training
              changes the policy so the agent earns more reward over time.
            </li>
          </ul>
          <p>
            Deep reinforcement learning adds a neural network. The network turns raw input, like a screen image, into
            an estimate of which action pays off. That&apos;s what lets the agent work without rules written by hand.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="drl-history">
          <h2 id="drl-history" className="text-xl font-semibold text-white">
            What it has achieved
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-100">2013:</strong> DeepMind&apos;s DQN learned Atari games such as Breakout
              from the screen pixels and the score.
            </li>
            <li>
              <strong className="text-slate-100">2016:</strong> AlphaGo beat Lee Sedol, one of the world&apos;s top Go
              players, 4 games to 1.
            </li>
            <li>
              <strong className="text-slate-100">2017:</strong> AlphaZero taught itself chess, shogi, and Go by playing
              against itself, then beat leading programs in each.
            </li>
            <li>
              <strong className="text-slate-100">2019:</strong> OpenAI Five beat the reigning world champion team at
              Dota 2.
            </li>
          </ul>
          <p>
            Every one of these games has rules that link actions to outcomes. A good move in Go raises the chance of
            winning, and over many games the agent can measure that. A lottery has no such link.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="drl-noise">
          <h2 id="drl-noise" className="text-xl font-semibold text-white">
            Why the reward is pure noise in a lottery
          </h2>
          <p>
            Picture an agent that picks 6 numbers before each draw. Its reward goes up when its pick lands close to the
            draw. Our own DRL model uses a reward like this. It scores matched numbers and how far the pick sits from
            the drawn numbers.
          </p>
          <p>
            When draws are independent, no pick is more likely to match than any other. Two picks with the same odds
            earn different rewards only because of luck. The agent still updates its policy after every reward. So it
            ends up chasing past luck.
          </p>
          <p>
            In Go, a lucky win and a skilled win look different over thousands of games. In a lottery, they look the
            same, because there&apos;s no skill to find. More training doesn&apos;t help. It only fits the agent more
            tightly to noise in past draws.
          </p>
          <p>
            Our <Link to="/blog/markov-chains-lottery" className="link">Markov chain check</Link> shows the
            independence directly. In all five PCSO games, a draw shares numbers with the draw before it about as often
            as chance predicts.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="drl-odds">
          <h2 id="drl-odds" className="text-xl font-semibold text-white">
            What any model is up against
          </h2>
          <p>
            These are the exact chances for one line of 6 numbers in each game. We work them out from the number of
            balls. They&apos;re the same for every line, whoever or whatever picks it.
          </p>

          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="data-table min-w-[640px]">
              <caption className="sr-only">Chance that one line matches 3, 4, 5, or 6 numbers, per PCSO game</caption>
              <thead>
                <tr>
                  <th scope="col">Game</th>
                  {MATCHES.map((k) => (
                    <th key={k} scope="col" className="text-right">
                      Match {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row" className="whitespace-nowrap py-3 pr-6 text-left font-normal">
                      <span className="block font-mono font-semibold text-white tabular">{r.key}</span>
                      <span className="text-xs text-silver-400">{r.name}</span>
                    </th>
                    {r.chances.map((p, i) => (
                      <td key={MATCHES[i]} className="whitespace-nowrap py-3 text-right font-mono tabular">
                        {oneIn(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            A model that had learned something real would beat these numbers over time. Here&apos;s a test of a
            popular &quot;learned&quot; pattern: play the 6 numbers drawn most often in the last {game649.window} draws.
          </p>
          <p>
            We ran it on {formatNumber(hotTotal)} draws across five games. In {game649.key}, those hot six matched{' '}
            {fmtMean(game649.hotMean)} numbers per draw on average, and a random line matches{' '}
            {fmtMean(game649.expected)}. No game showed a gap bigger than {fmtMean(hotMaxGap)}.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="drl-bayanwin">
          <h2 id="drl-bayanwin" className="text-xl font-semibold text-white">
            What our DRL model is for
          </h2>
          <p>
            BayanWin runs a DRL agent next to our other models. We treat it as an experiment and a teaching tool, not
            a forecaster.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-100">An experiment.</strong> It shows what a learning agent does when its
              reward carries no signal. Its picks shift as it reacts to recent luck.
            </li>
            <li>
              <strong className="text-slate-100">A teaching tool.</strong> You can see state, action, and reward at
              work on real PCSO data. Then compare its pick with the other models in the council panel on the{' '}
              <Link to="/" className="link">home page</Link>.
            </li>
            <li>
              <strong className="text-slate-100">A reality check.</strong> Its picks face the same odds as any line
              in the table above.
            </li>
          </ul>
          <p>
            We don&apos;t claim the DRL model improves your odds. A {game658.key} line chosen by the agent has a 1 in{' '}
            {formatNumber(game658.odds)} chance at the jackpot, like any other line.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="drl-faq">
          <h2 id="drl-faq" className="text-xl font-semibold text-white">
            Common questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-200">Does more training make the agent better at the lottery?</h3>
              <p className="text-slate-400 mt-1">
                No. Training helps when rewards follow from actions. In a lottery they follow from luck, so more
                training fits the agent to old noise.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">How is DRL different from the other BayanWin models?</h3>
              <p className="text-slate-400 mt-1">
                Our XGBoost and decision tree models learn from a fixed slice of past draws. The DRL agent also
                updates from the reward each new draw gives it. That makes it adaptive, but adapting to noise
                doesn&apos;t make it accurate.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Where does reinforcement learning work well?</h3>
              <p className="text-slate-400 mt-1">
                It works where actions change outcomes and the reward reflects that. Games, robot control, and
                tuning systems like data center cooling are examples.
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
              <Link to="/blog/markov-chains-lottery" className="link">
                Do PCSO lotto draws have memory? A Markov chain check
              </Link>
            </li>
            <li>
              <Link to="/blog/miro-prediction" className="link">
                How the Miro model combines BayanWin&apos;s picks
              </Link>
            </li>
            <li>
              <Link to="/blog/pcso-658-results-analysis" className="link">
                PCSO 6/58 results analysis
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

export default BlogDeepReinforcementLearning;
