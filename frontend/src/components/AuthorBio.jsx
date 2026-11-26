import React from 'react';
import { TbMail, TbMapPin } from 'react-icons/tb';
import { AUTHOR } from '../seo/author';

/** Who wrote this: shown at the end of every article and on /about. */
function AuthorBio({ className = 'mt-12', headingLevel: Heading = 'h2' }) {
  return (
    <aside
      aria-labelledby="author-bio-name"
      className={`flex flex-col gap-4 rounded-card border border-white/[0.07] bg-charcoal-800 p-5 sm:flex-row sm:p-6 ${className}`}
    >
      {/* Initials until the ZALEL LABS logo file is added. */}
      <span
        aria-hidden
        className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] font-display text-lg font-semibold text-white"
      >
        JP
      </span>
      <div className="min-w-0 space-y-2 text-sm leading-relaxed text-silver-300">
        <p className="text-xs text-silver-500">Written by</p>
        <Heading id="author-bio-name" className="font-display text-base font-semibold text-white">
          {AUTHOR.name}
        </Heading>
        <p>
          {AUTHOR.name} runs BayanWin. It&apos;s made by {AUTHOR.org}. We build software, cybersecurity, and AI
          products. {AUTHOR.org} is part of {AUTHOR.parentOrg}.
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
