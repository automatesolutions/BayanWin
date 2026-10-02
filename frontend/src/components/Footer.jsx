import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo-128.webp';

const GROUPS = [
  {
    title: 'Explore',
    links: [
      { to: '/', label: 'Dashboard' },
      { to: '/methodology', label: 'Methodology' },
      { to: '/blog', label: 'Blog' },
      { to: '/about', label: 'About BayanWin' },
    ],
  },
  {
    title: 'Legal & support',
    links: [
      { to: '/responsible-play', label: 'Responsible play' },
      { to: '/privacy', label: 'Privacy policy' },
      { to: '/terms', label: 'Terms of use' },
      { to: '/contact', label: 'Contact' },
    ],
  },
];

const Footer = () => (
  <footer className="mt-auto border-t border-white/[0.06] bg-charcoal-950">
    <div className="container mx-auto grid gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-2.5" aria-label="BayanWin home">
          <img src={logo} alt="" className="h-7 w-auto" />
          <span className="font-display text-base font-semibold text-white">BayanWin</span>
        </Link>
        <p className="max-w-sm text-sm leading-relaxed text-silver-500">
          Free PCSO draw history and model outputs for study and entertainment. Lottery draws are random. No
          tool can predict them, and nothing here guarantees a win.
        </p>
        <p className="text-sm text-silver-500">
          18+ only. Not affiliated with PCSO.
        </p>
      </div>

      {GROUPS.map((group) => (
        <nav key={group.title} aria-label={group.title}>
          <h2 className="mb-3 font-mono text-2xs font-medium uppercase tracking-[0.18em] text-silver-600">
            {group.title}
          </h2>
          <ul className="space-y-1">
            {group.links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="inline-flex min-h-[36px] items-center text-sm text-silver-400 transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
    <div className="border-t border-white/[0.05]">
      <p className="container mx-auto px-4 py-5 text-xs text-silver-600 sm:px-6">
        &copy; {new Date().getFullYear()} BayanWin
      </p>
    </div>
  </footer>
);

export default Footer;
