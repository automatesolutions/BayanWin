import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'sycat0378@gmail.com';

function Contact() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Contact | BayanWin';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 flex-1 max-w-2xl">
      <nav className="mb-6 text-sm text-slate-400">
        <Link to="/" className="text-electric-400 hover:text-electric-300 underline">
          Home
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-300">Contact</span>
      </nav>

      <article className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-6 py-8 text-slate-200 shadow-sm space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Contact</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Reach out for questions about BayanWin, the Privacy Policy, or technical issues with the site.
          </p>
        </header>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-white">Email</strong>
            <br />
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=BayanWin%20inquiry`}
              className="text-electric-400 hover:text-electric-300 underline break-all text-base"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-slate-400">
            We try to read messages regularly but cannot guarantee a specific response time. For privacy-related requests,
            please include “Privacy” in the subject line.
          </p>
          <p>
            <Link to="/privacy" className="text-electric-400 hover:text-electric-300 underline">
              Privacy Policy
            </Link>
            <span className="text-slate-600 mx-2">·</span>
            <Link to="/about" className="text-electric-400 hover:text-electric-300 underline">
              About BayanWin
            </Link>
          </p>
        </div>
      </article>
    </main>
  );
}

export default Contact;
