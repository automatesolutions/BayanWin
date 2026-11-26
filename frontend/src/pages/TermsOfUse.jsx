import React from 'react';
import { Link } from '../components/SiteLink';
import { AUTHOR } from '../seo/author';

const CONTACT_EMAIL = AUTHOR.email;

function TermsOfUse() {
  return (
    <main id="main" className="page max-w-4xl">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="link">
          Home
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <span className="text-slate-300">Terms of Use</span>
      </nav>

      <article className="article text-slate-200 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Use</h1>
          <p className="text-slate-400 text-sm">Last updated: October 28, 2026</p>
        </header>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Agreement to these terms</h2>
          <p>
            These terms apply when you use bayanwin.net (the “Site”), run by BayanWin (“we”, “us”). By using the Site, you
            agree to them. If you don’t agree, don’t use the Site.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Purpose of this site</h2>
          <p>
            BayanWin is a free, informational site about Philippine PCSO lotto games. It shows draw history, statistics,
            and the output of several algorithmic models. Content is provided for education and entertainment only. We
            don’t sell tickets, take bets, or pay prizes.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">No guarantees, no betting advice</h2>
          <p>
            Lottery draws are random. Forecasts, trends, and model outputs are experiments on past data. They don’t
            guarantee any result or winnings and they don’t improve your odds. Nothing on this site is financial, legal,
            or gambling advice. You alone decide whether to buy a ticket and which numbers to play.
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
          <h2 className="text-xl font-semibold text-white">Age and local law</h2>
          <p>
            In the Philippines you must be 18 or older to buy PCSO lotto tickets. If you are under 18, don’t use this Site
            to plan any bet. If you visit from another country, follow the gambling laws where you live.
          </p>
          <p>
            See our{' '}
            <Link to="/responsible-play" className="link">
              Responsible Play
            </Link>{' '}
            page for budget limits and where to get help.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Accuracy of results</h2>
          <p>
            We collect draw results from public sources. A result can arrive late or contain an error, and we correct
            errors when we find them. Before you claim a prize or act on a result, check it against the official PCSO
            announcement. If our data and PCSO’s differ, PCSO’s result is the correct one.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Acceptable use</h2>
          <p>When you use the Site, you agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>send automated requests at a rate that slows the Site or its API for other people;</li>
            <li>try to get into systems, data, or accounts that are not meant for public use;</li>
            <li>upload or send malicious code, or interfere with the Site’s security;</li>
            <li>present our model outputs as guaranteed winning numbers, or sell them as such;</li>
            <li>suggest that PCSO or any government agency endorses BayanWin or your use of it.</li>
          </ul>
          <p>We may block access for anyone who breaks these rules.</p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Content and ownership</h2>
          <p>
            We own the Site’s articles, design, and code, unless a page says otherwise. You may share links to our pages
            and quote short parts with credit to BayanWin. Don’t copy whole articles or the design to another site.
            Official draw results are public facts, and we claim no ownership of them.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Third-party links and ads</h2>
          <p>
            Some pages link to other websites, and some articles show ads served by Google AdSense. We don’t control
            those sites or the advertisers, and an ad is not our endorsement. Ads appear only on long-form articles, never
            on the dashboard, the Blog list, Responsible Play, legal pages, Contact, or error pages. Our{' '}
            <Link to="/privacy" className="link">
              Privacy Policy
            </Link>{' '}
            explains the cookies that ads use and how to change your choice.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Availability</h2>
          <p>
            The Site is free and offered as it is. We may change, pause, or remove features at any time, and we don’t
            promise that the Site or any model will always be available.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Limitation of liability</h2>
          <p>
            To the extent Philippine law allows, BayanWin is not liable for any loss that comes from using the Site. This
            includes money spent on tickets, missed prizes, and decisions based on our data or model outputs.
          </p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300">
          <h2 className="text-xl font-semibold text-white">Governing law</h2>
          <p>These terms are governed by the laws of the Republic of the Philippines.</p>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">Changes and contact</h2>
          <p>
            We may update these terms as the Site changes. The date at the top shows the latest version. If you keep
            using the Site after an update, you accept the new terms.
          </p>
          <p>
            Questions about these terms:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link break-all">
              {CONTACT_EMAIL}
            </a>
            , or use our{' '}
            <Link to="/contact" className="link">
              Contact
            </Link>{' '}
            page.
          </p>
        </section>
      </article>
    </main>
  );
}

export default TermsOfUse;
