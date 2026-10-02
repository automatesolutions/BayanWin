import React from 'react';
import { Link } from 'react-router-dom';
import { TbArrowLeft, TbMapOff } from 'react-icons/tb';

function NotFound() {
  return (
    <main id="main" className="page flex max-w-lg flex-col items-center justify-center text-center">
      <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-silver-400">
        <TbMapOff className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mb-3 text-3xl font-semibold text-white">404: this page doesn&apos;t exist</h1>
      <p className="mb-8 text-silver-400">
        The link may be old or mistyped. If this page was just published, give it a minute and hard refresh
        (Ctrl+Shift+R).
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn-primary">
          <TbArrowLeft aria-hidden /> Back to the dashboard
        </Link>
        <Link to="/blog" className="btn-secondary">
          Read the blog
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
