import React from 'react';
import { TbMail, TbMapPin } from 'react-icons/tb';
import { AUTHOR } from '../seo/author';
import logo from '../assets/zalel-labs.png';

/** Who made this: shown at the end of every article and on /about. */
function AuthorBio({ className = 'mt-12', headingLevel: Heading = 'h2' }) {
  return (
    <aside
      aria-labelledby="author-bio-name"
      className={`flex flex-col gap-4 rounded-card border border-white/[0.07] bg-charcoal-800 p-5 sm:flex-row sm:p-6 ${className}`}
    >
      <img
        src={logo}
        alt=""
        width="56"
        height="56"
        className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/[0.08]"
      />
      <div className="min-w-0 space-y-2 text-sm leading-relaxed text-silver-300">
        <Heading id="author-bio-name" className="text-base text-silver-200">
          Made by <strong className="font-display font-semibold text-white">{AUTHOR.name}</strong>. We build software,
          cybersecurity, and AI products.
        </Heading>
        <p className="text-silver-400">
          {AUTHOR.name} is part of {AUTHOR.parentOrg}.
        </p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-silver-400">
          <span className="inline-flex items-center gap-1.5">
            <TbMapPin aria-hidden /> {AUTHOR.location}
          </span>
          <a href={`mailto:${AUTHOR.email}`} className="link inline-flex items-center gap-1.5">
            <TbMail aria-hidden /> {AUTHOR.email}
          </a>
        </p>
      </div>
    </aside>
  );
}

export default AuthorBio;
