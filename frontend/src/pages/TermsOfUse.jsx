import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function TermsOfUse() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Terms of Use — BayanWin';
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
        <span className="text-slate-300">Terms of Use</span>
      </nav>

      <article className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-5 py-8 text-slate-200 shadow-sm space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Use</h1>
          <p className="text-slate-400 text-sm">Last updated: April 29, 2026</p>
        </header>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Purpose of this site</h2>
          <p>
            BayanWin is an informational platform for lottery history, statistics, and algorithmic forecasting outputs.
            Content is provided for education and entertainment purposes only.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">No guarantees, no betting advice</h2>
          <p>
            Forecasts, trends, and model outputs are exploratory and do not guarantee any lottery result or winnings.
            Nothing on this site is financial, legal, or gambling advice.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">No government affiliation</h2>
          <p>
            BayanWin is not affiliated with, endorsed by, or operated by PCSO or any government lottery operator. Verify
            official results only from authorized channels.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Responsible use</h2>
          <p>
            You agree to use this site responsibly and only where permitted by local law. If you are under legal age in
            your jurisdiction, do not use betting-related services.
          </p>
          <p>
            See our{' '}
            <Link to="/responsible-play" className="text-electric-400 hover:text-electric-300 underline">
              Responsible Play
            </Link>{' '}
            page for more guidance.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Third-party services and ads</h2>
          <p>
            We may use third-party tools for analytics, security, and advertising. Those services may set cookies subject
            to your consent choices and their own policies.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">Changes to these terms</h2>
          <p>
            We may update these terms as the service evolves. Continued use after updates means you accept the revised
            terms.
          </p>
        </section>
      </article>
    </main>
  );
}

export default TermsOfUse;
