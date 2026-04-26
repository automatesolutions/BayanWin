import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logo from '../assets/Logo.png';

const navClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
    isActive
      ? 'bg-white/20 text-white'
      : 'text-white/85 hover:bg-white/10 hover:text-white'
  }`;

const Header = () => {
  const location = useLocation();
  const showBrandingH1 = location.pathname === '/';

  const branding = (
    <>
      <span className="text-2xl sm:text-3xl md:text-4xl shrink-0">BayanWin</span>
      <span className="text-base sm:text-lg md:text-xl font-semibold text-white/95">
        - PCSO results & AI Driven Predictions
      </span>
    </>
  );

  const titleShellClass =
    'flex flex-wrap items-baseline gap-x-1.5 gap-y-1 font-bold tracking-tight leading-tight';

  return (
    <header className="bg-tech-gradient text-white shadow-tech-lg border-b-4 border-electric-500">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 min-w-0">
            <Link to="/" className="shrink-0" aria-label="BayanWin home">
              <img src={logo} alt="" className="h-12 w-auto" />
            </Link>
            <div className="min-w-0 max-w-3xl">
              <Link to="/" className="block text-left hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded">
                {showBrandingH1 ? (
                  <h1
                    className={titleShellClass}
                    style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
                  >
                    {branding}
                  </h1>
                ) : (
                  <div className={titleShellClass} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>
                    {branding}
                  </div>
                )}
              </Link>
              <p className="text-silver-200 text-sm mt-2 font-light">
                ML-powered tools and historical draw data for major lotto games
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
              <NavLink to="/" end className={navClass}>
                Home
              </NavLink>
              <NavLink to="/about" className={navClass}>
                About BayanWin
              </NavLink>
              <NavLink
                to="/blog"
                className={({ isActive }) =>
                  navClass({ isActive: isActive || location.pathname.startsWith('/blog') })
                }
              >
                Blog
              </NavLink>
            </nav>
            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-white/20">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-silver-300 text-xs font-mono">LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
