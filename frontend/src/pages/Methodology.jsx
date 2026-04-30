import React from 'react';
import { Link } from 'react-router-dom';

function Methodology() {
  return (
    <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <nav className="mb-6 text-sm text-slate-400">
        <Link to="/" className="text-electric-400 hover:text-electric-300 underline">
          Home
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-300">Methodology</span>
      </nav>

      <article className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-5 py-8 text-slate-200 shadow-sm space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">BayanWin Methodology</h1>
          <p className="text-slate-400 text-sm">
            How we process historical lottery results, generate analytics, and present algorithmic prediction outputs.
          </p>
        </header>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Data sources</h2>
          <p>
            BayanWin ingests historical draw results from configured data pipelines and storage services used by the app.
            The dataset is refreshed through scheduled updates and user-triggered sync flows where available.
          </p>
          <p>
            For official draw outcomes and jackpot verification, always use authorized PCSO channels. BayanWin is an
            independent analysis platform and not a government source.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Model family overview</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Frequency, overdue, and statistical distribution analysis.</li>
            <li>Tree-based and ensemble-style machine learning predictors.</li>
            <li>Markov transition analysis for sequence behavior.</li>
            <li>Heuristic/game-theory-inspired filters (for exploratory ranking).</li>
            <li>Optional LLM synthesis as an additional comparative perspective.</li>
          </ul>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">How to interpret outputs</h2>
          <p>
            Results should be interpreted as <strong className="text-slate-100">historical pattern analysis</strong>, not as
            deterministic forecasts. Different models often disagree; that variance is expected and useful for comparison.
          </p>
          <p>
            We recommend reading model outputs together with draw history, frequency charts, and error-distance summaries
            instead of relying on a single generated line.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Limitations</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lottery draws are random under published rules; no model can guarantee future outcomes.</li>
            <li>Data quality and timeliness can vary by source, update cycle, and availability.</li>
            <li>Model performance can drift and must be periodically evaluated against new draws.</li>
          </ul>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">Responsible use</h2>
          <p>
            BayanWin is for educational and entertainment purposes. Please review our{' '}
            <Link to="/responsible-play" className="text-electric-400 hover:text-electric-300 underline">
              Responsible Play
            </Link>{' '}
            and{' '}
            <Link to="/terms" className="text-electric-400 hover:text-electric-300 underline">
              Terms of Use
            </Link>{' '}
            pages before relying on model outputs.
          </p>
        </section>
      </article>
    </main>
  );
}

export default Methodology;
