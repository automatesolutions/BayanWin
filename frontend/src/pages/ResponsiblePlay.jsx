import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function ResponsiblePlay() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Responsible Play — BayanWin';
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
        <span className="text-slate-300">Responsible Play</span>
      </nav>

      <article className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-5 py-8 text-slate-200 shadow-sm space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Responsible Play</h1>
          <p className="text-slate-400 text-sm">BayanWin supports informed and moderate use.</p>
        </header>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Important reminders</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lottery outcomes are random. Historical patterns do not guarantee future results.</li>
            <li>Set a strict budget and never spend money needed for essential expenses.</li>
            <li>Do not chase losses. If you reach your limit, stop.</li>
            <li>Take breaks and avoid frequent play driven by stress, urgency, or emotional pressure.</li>
          </ul>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Age and legal compliance</h2>
          <p>
            Use this site only where lawful and only if you are of legal age in your location. BayanWin is not intended
            for minors.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">No affiliation</h2>
          <p>
            BayanWin is an independent informational website and is not affiliated with PCSO or any official lottery
            authority.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">Need help?</h2>
          <p>
            If play stops being recreational, seek support from qualified local professionals or trusted community
            organizations. For concerns about personal data handling in the Philippines, visit{' '}
            <a
              href="https://privacy.gov.ph"
              target="_blank"
              rel="noreferrer"
              className="text-electric-400 hover:text-electric-300 underline"
            >
              privacy.gov.ph
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}

export default ResponsiblePlay;
