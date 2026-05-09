import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <main className="container mx-auto px-4 py-16 flex-1 max-w-lg text-center">
      <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
      <p className="text-slate-400 text-sm mb-6">
        This URL does not match any page on this build of BayanWin. If you just deployed new routes, wait for the latest
        revision to serve traffic, then hard refresh (Ctrl+Shift+R).
      </p>
      <Link to="/" className="text-electric-400 hover:text-electric-300 underline mr-4">
        Home
      </Link>
      <Link to="/blog" className="text-electric-400 hover:text-electric-300 underline">
        Blog
      </Link>
    </main>
  );
}

export default NotFound;
