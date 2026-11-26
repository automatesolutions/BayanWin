import React from 'react';
import { Link } from '../components/SiteLink';
import { AUTHOR } from '../seo/author';

const CONTACT_EMAIL = AUTHOR.email;

function Contact() {
  return (
    <main id="main" className="page max-w-2xl">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="link">
          Home
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <span className="text-slate-300">Contact</span>
      </nav>

      <article className="article text-slate-200 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Contact BayanWin</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Send us feedback, bug reports, privacy requests, and questions about BayanWin. {AUTHOR.name} reads this
            inbox. There&apos;s no form and no chatbot.
          </p>
        </header>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-xl font-semibold text-white">How to reach us</h2>
          <p>
            <strong className="text-white">Email</strong>
            <br />
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=BayanWin%20inquiry`}
              className="link break-all text-base"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-slate-400">
            Most messages get a reply within <strong className="text-slate-300">3 to 5 business days</strong>. For a
            privacy request, put <strong className="text-slate-300">&quot;Privacy&quot;</strong> in the subject line so we
            can answer it first.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-xl font-semibold text-white">What you can contact us about</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">General questions:</strong> how BayanWin works, what the models do,
              or how to read the statistics.
            </li>
            <li>
              <strong className="text-slate-200">Bugs:</strong> if something on the site is broken or looks wrong,
              tell us your browser, your device, and what happened.
            </li>
            <li>
              <strong className="text-slate-200">Privacy requests:</strong> to use your rights under the Data Privacy
              Act of 2012, ask for deletion, or ask what information we process. Read our{' '}
              <Link to="/privacy" className="link">
                Privacy Policy
              </Link>{' '}
              first.
            </li>
            <li>
              <strong className="text-slate-200">Corrections:</strong> if you find a factual error in an article or
              a statistic, tell us and we&apos;ll fix it.
            </li>
            <li>
              <strong className="text-slate-200">Collaboration:</strong> data partnerships, teaching, or research use
              of BayanWin.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-xl font-semibold text-white">What we cannot help with</h2>
          <p className="text-slate-400">
            BayanWin is an independent website. We&apos;re{' '}
            <strong className="text-slate-300">not affiliated with PCSO</strong> or any government agency. We
            can&apos;t:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>
              Confirm official PCSO results. Check{' '}
              <strong className="text-slate-300">pcso.gov.ph</strong> for those.
            </li>
            <li>Give financial or gambling advice.</li>
            <li>Promise that any pick will match a future draw.</li>
            <li>Handle prize claims or sell lottery tickets.</li>
          </ul>
        </section>

        <section
          className="space-y-3 text-sm text-slate-300 leading-relaxed border-t border-slate-600/50 pt-6"
          aria-labelledby="contact-faq"
        >
          <h2 id="contact-faq" className="text-xl font-semibold text-white">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-200">How long does a response take?</h3>
              <p className="text-slate-400 mt-1">
                Usually 3 to 5 business days. Privacy requests come first when the subject line includes
                &quot;Privacy&quot;.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Is there a phone number or live chat?</h3>
              <p className="text-slate-400 mt-1">
                No. Email is the only way to reach us.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">How do I report inaccurate draw history data?</h3>
              <p className="text-slate-400 mt-1">
                Send us the game, the draw date, and the numbers you think are wrong. Add a source if you have one,
                such as an official PCSO announcement. We&apos;ll check it and fix the record.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Can I request that my usage data be deleted?</h3>
              <p className="text-slate-400 mt-1">
                Yes. Under the Data Privacy Act, you can ask us to delete personal data we hold. Email us with
                &quot;Privacy: deletion request&quot; in the subject line, and we&apos;ll answer within the time the law
                sets.
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-slate-600/50 pt-4 text-sm">
          <Link to="/privacy" className="link">
            Privacy Policy
          </Link>
          <span className="text-slate-600 mx-2">·</span>
          <Link to="/about" className="link">
            About BayanWin
          </Link>
          <span className="text-slate-600 mx-2">·</span>
          <Link to="/responsible-play" className="link">
            Responsible Play
          </Link>
        </div>
      </article>
    </main>
  );
}

export default Contact;
