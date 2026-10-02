import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { TbChevronDown, TbExternalLink, TbMenu2, TbX } from 'react-icons/tb';
import logo from '../assets/logo-128.webp';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/methodology', label: 'Methodology' },
  { to: '/blog', label: 'Blog', prefix: '/blog' },
  { to: '/about', label: 'About' },
];

const WEB_APPS = [
  { href: 'https://gods-eye-predictor-246621344960.asia-southeast1.run.app/', label: "God's Eye Predictor" },
  { href: 'https://randomness-web-rxl6tsackq-as.a.run.app/', label: 'Randomness' },
];

const appLinkClass =
  'flex min-h-[44px] items-center justify-between gap-3 rounded-lg px-3.5 text-sm font-medium text-silver-300 transition-colors hover:bg-white/[0.05] hover:text-white';

const WebAppsMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3.5 text-sm font-medium transition-colors ${
          open ? 'bg-white/[0.08] text-white' : 'text-silver-400 hover:bg-white/[0.05] hover:text-white'
        }`}
        aria-expanded={open}
        aria-controls="web-apps-menu"
        onClick={() => setOpen((v) => !v)}
      >
        Web App
        <TbChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          id="web-apps-menu"
          className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-white/[0.08] bg-charcoal-800 p-1.5 shadow-lg"
        >
          {WEB_APPS.map((app) => (
            <li key={app.href}>
              <a
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className={appLinkClass}
                onClick={() => setOpen(false)}
              >
                {app.label}
                <TbExternalLink className="h-4 w-4 text-silver-500" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Header = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [location.pathname]);

  const isActive = (item, navActive) =>
    navActive || (item.prefix && location.pathname.startsWith(item.prefix));

  const linkClass = (item) => ({ isActive: navActive }) =>
    `inline-flex min-h-[44px] items-center rounded-lg px-3.5 text-sm font-medium transition-colors ${
      isActive(item, navActive)
        ? 'bg-white/[0.08] text-white'
        : 'text-silver-400 hover:bg-white/[0.05] hover:text-white'
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-charcoal-900/95">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-electric-500 focus:px-4 focus:py-2 focus:text-charcoal-950"
      >
        Skip to content
      </a>
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-h-[44px] items-center gap-2.5" aria-label="BayanWin home">
          <img src={logo} alt="" className="h-8 w-auto" />
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            BayanWin
          </span>
          <span className="hidden rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-2xs text-silver-500 md:inline">
            PCSO analytics
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass(item)}>
              {item.label}
            </NavLink>
          ))}
          <WebAppsMenu />
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-silver-200 hover:bg-white/[0.06] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <TbX className="h-6 w-6" /> : <TbMenu2 className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-white/[0.06] bg-charcoal-900 px-4 pb-4 pt-2 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={(s) => `${linkClass(item)(s)} w-full`}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <p className="mt-3 px-3.5 text-xs font-medium text-silver-500">Web App</p>
          <ul className="mt-1 flex flex-col gap-1">
            {WEB_APPS.map((app) => (
              <li key={app.href}>
                <a href={app.href} target="_blank" rel="noopener noreferrer" className={appLinkClass}>
                  {app.label}
                  <TbExternalLink className="h-4 w-4 text-silver-500" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;
