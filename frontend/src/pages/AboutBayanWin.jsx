import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function AboutBayanWin() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'About BayanWin - AI Lottery Analytics for PCSO Philippines';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <nav className="mb-6 text-sm text-slate-400">
        <Link to="/" className="text-electric-400 hover:text-electric-300 underline">
          Home
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-300">About BayanWin</span>
      </nav>

      <article className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-5 py-8 text-slate-200 shadow-sm space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">About BayanWin</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            What the platform does, how historical data is used, and how the statistics and models fit together.
          </p>
          <p className="text-xs text-slate-500 mt-3">Last updated: May 9, 2026</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-xl font-semibold text-white">
            What is BayanWin?
          </h2>
          <p>
            BayanWin is an informational dashboard for fans of major Philippine lottery draws. It brings together{' '}
            <strong className="text-slate-200">Ultra Lotto 6/58, Grand Lotto 6/55, Super Lotto 6/49, Mega Lotto 6/45,</strong>{' '}
            and <strong className="text-slate-200">Lotto 6/42</strong>: recent winning numbers, history, frequency stats,
            and optional machine-learning-style prediction outputs for exploration—not official PCSO results.
          </p>
          <p>
            Draw data is ingested from curated sources on a regular schedule and when you use the site, so lists can update
            through the day. Always verify payouts and official results with PCSO or authorized outlets.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="mission-heading">
          <h2 id="mission-heading" className="text-xl font-semibold text-white">
            Beyond “lucky picks”: patterns, statistics, and models
          </h2>
          <p>
            BayanWin is not only about generating prediction lines. It is built around the idea of{' '}
            <strong className="text-slate-200">studying how random-looking draw sequences behave over long horizons</strong>
            —using transparent statistics and algorithms to surface structure you can inspect yourself (hot and cold periods,
            gaps, co-occurrence, and how different models disagree). Lottery draws are random in the statistical sense; the
            tools here explore <em>historical regularities</em> in the record, not a hidden “formula” that beats randomness.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-xl font-semibold text-white">
            Core statistics
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">Frequency analysis</strong> — how often each number has appeared relative
              to expectation, helping you see “hot” and “cold” numbers at a glance.
            </li>
            <li>
              <strong className="text-slate-200">Overdue numbers</strong> — numbers that have not appeared for unusually
              long stretches in the historical window, for exploratory context (not a guarantee they are “due”).
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="dashboard-heading">
          <h2 id="dashboard-heading" className="text-xl font-semibold text-white">
            Analysis dashboards
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">Gaussian distribution views</strong> — visualize how sums and products of
              winning numbers distribute compared to simplified Gaussian-style baselines, to spot unusual draws and typical
              bands.
            </li>
            <li>
              <strong className="text-slate-200">Error / distance analysis</strong> — after predictions are stored, the app
              can compare them to actual results using distance-style metrics so you can see how each model behaved over
              time—not just the latest pick.
            </li>
            <li>
              Graph views (e.g. co-occurrence and transition-style plots) summarize <strong className="text-slate-200">
                relationships between numbers and between consecutive draws
              </strong>{' '}
              in the dataset you have loaded.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="data-heading">
          <h2 id="data-heading" className="text-xl font-semibold text-white">
            Historical depth and machine learning
          </h2>
          <p>
            Where available, the pipeline is designed to work with <strong className="text-slate-200">many years of winning-number history</strong>{' '}
            (on the order of a decade or more depending on the game and source). That depth feeds both the dashboards above
            and the <strong className="text-slate-200">machine learning predictors</strong>, which look for patterns in
            features derived from that history. Each model encodes different assumptions; together they act as a small
            “ensemble laboratory” rather than a single oracle.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="models-heading">
          <h2 id="models-heading" className="text-xl font-semibold text-white">
            Models used in BayanWin
          </h2>

          <div className="space-y-4 pl-0 border-l-2 border-electric-500/40 pl-4">
            <div>
              <h3 className="text-base font-semibold text-white">XGBoost</h3>
              <p>
                Gradient-boosted trees trained on tabular features from past draws; strong at capturing non-linear patterns
                in structured inputs.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Decision Tree / ensemble variants</h3>
              <p>
                Interpretable tree-based models that split the feature space into regions—useful for frequency- and
                rule-like structure in the data.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Anomaly detection</h3>
              <p>
                Monte Carlo / distribution-style views that highlight unusual combinations or bands (e.g. sums and products)
                relative to a baseline—oriented toward <strong className="text-slate-200">rare-event</strong> style analysis
                rather than a single “most likely” ticket.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Markov-style sequence models</h3>
              <p>
                Models that treat draws as a sequence and estimate <strong className="text-slate-200">transition-style relationships</strong>{' '}
                between states. Ideas like this appear throughout applied math and engineering (including large-scale systems
                that model linked states over time); here they summarize how consecutive draws relate in <em>your</em> historical
                slice.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">NashHotFilter</h3>
              <p>
                A hybrid idea inspired by <strong className="text-slate-200">game-theoretic equilibrium</strong> concepts
                associated with John Nash (popularized in film as <em>A Beautiful Mind</em>), combined with hot-number and
                balance heuristics to produce structured candidate lines—still purely exploratory.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Deep reinforcement learning (DRL)</h3>
              <p>
                An agent-style model that can incorporate <strong className="text-slate-200">feedback from error / accuracy signals</strong>{' '}
                over time, so behavior can shift as more prediction–result pairs exist in the database.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Miro — LLM synthesis</h3>
              <p>
                A <strong className="text-slate-200">multi-step large language model (LLM)</strong> workflow that reads the
                same context bundle as the numeric models and produces a synthesized pick—similar in spirit to “swarm” or
                multi-agent discussions you may see in modern ML communities, but implemented as a single coordinated pipeline
                in this app. In the UI it appears as <strong className="text-slate-200">Miro</strong> (LLM synthesis), separate
                from the six core numeric models.
              </p>
            </div>
          </div>
        </section>

        <section
          className="text-slate-400 border-t border-slate-600/50 pt-6 text-sm leading-relaxed"
          aria-labelledby="disclaimer-heading"
        >
          <h2 id="disclaimer-heading" className="text-lg font-semibold text-slate-300 mb-2">
            Disclaimer
          </h2>
          <p>
            This site is for <strong className="text-slate-300">education and entertainment only</strong>. It does not
            provide financial, legal, or gambling advice. Past draws do not predict future outcomes. There are{' '}
            <strong className="text-slate-300">no guaranteed wins</strong>. Play responsibly and only within the law in your
            area.
          </p>
          <p className="mt-3">
            Start with the{' '}
            <Link to="/methodology" className="text-electric-400 hover:text-electric-300 underline">
              Methodology
            </Link>{' '}
            page, then read game-specific analyses like{' '}
            <Link to="/blog/pcso-658-results-analysis" className="text-electric-400 hover:text-electric-300 underline">
              PCSO 6/58 results analysis
            </Link>{' '}
            and{' '}
            <Link to="/blog/pcso-649-results-analysis" className="text-electric-400 hover:text-electric-300 underline">
              PCSO 6/49 results analysis
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  );
}

export default AboutBayanWin;
