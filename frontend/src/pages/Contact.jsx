import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'sycat0378@gmail.com';

function Contact() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Contact BayanWin | PCSO Lottery Analysis Philippines';
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

      <article className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-6 py-8 text-slate-200 shadow-sm space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Contact BayanWin</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            We welcome feedback, bug reports, privacy inquiries, and questions about the analytical tools on BayanWin.
            Use the email below to reach our team — there is no automated form, just a real inbox.
          </p>
        </header>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-xl font-semibold text-white">How to reach us</h2>
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
            We aim to read every message, though we cannot guarantee a specific response time. Most inquiries receive
            a reply within <strong className="text-slate-300">3–5 business days</strong>. For urgent privacy-related
            requests, please include <strong className="text-slate-300">"Privacy"</strong> in the subject line so we
            can prioritise your message.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-xl font-semibold text-white">What you can contact us about</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">General questions</strong> — how the platform works, what the
              analytical models mean, or how to interpret the statistics dashboards.
            </li>
            <li>
              <strong className="text-slate-200">Bug reports &amp; technical issues</strong> — if something on the
              site is broken, loading incorrectly, or behaving unexpectedly, let us know with your browser, device
              type, and a brief description of the problem.
            </li>
            <li>
              <strong className="text-slate-200">Privacy requests</strong> — to exercise data rights under the
              Philippine Data Privacy Act of 2012, request data deletion, or ask about what information we process.
              See our{' '}
              <Link to="/privacy" className="text-electric-400 hover:text-electric-300 underline">
                Privacy Policy
              </Link>{' '}
              first.
            </li>
            <li>
              <strong className="text-slate-200">Content corrections</strong> — if you spot a factual error in any
              article, statistical explanation, or methodology page, we want to hear about it so we can correct the
              record quickly.
            </li>
            <li>
              <strong className="text-slate-200">Partnership or collaboration inquiries</strong> — outreach about
              potential data partnerships, educational collaborations, or research use of the platform.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-xl font-semibold text-white">What we cannot help with</h2>
          <p className="text-slate-400">
            BayanWin is an independent informational platform. We are{' '}
            <strong className="text-slate-300">not affiliated with PCSO</strong> or any government lottery agency.
            We cannot:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>
              Verify or validate official PCSO results — always check{' '}
              <strong className="text-slate-300">pcso.gov.ph</strong> directly.
            </li>
            <li>Provide financial or gambling advice of any kind.</li>
            <li>Guarantee that any prediction output will match a future draw result.</li>
            <li>Process prize claims or accept lottery ticket purchases.</li>
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
                Typically 3–5 business days. Urgent privacy requests are prioritised when the subject line
                includes "Privacy".
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Is there a phone number or live chat?</h3>
              <p className="text-slate-400 mt-1">
                Not at this time. Email is the only supported contact channel.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">How do I report inaccurate draw history data?</h3>
              <p className="text-slate-400 mt-1">
                Send us the specific game, draw date, and the numbers you believe are incorrect. Include a source
                reference if possible (e.g. an official PCSO announcement). We will investigate and update as needed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Can I request that my usage data be deleted?</h3>
              <p className="text-slate-400 mt-1">
                Yes. Under the Philippine Data Privacy Act you have the right to request deletion of personal data
                we hold. Email us with "Privacy - Deletion Request" in the subject line and we will respond within
                the statutory timeframe.
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-slate-600/50 pt-4 text-sm">
          <Link to="/privacy" className="text-electric-400 hover:text-electric-300 underline">
            Privacy Policy
          </Link>
          <span className="text-slate-600 mx-2">·</span>
          <Link to="/about" className="text-electric-400 hover:text-electric-300 underline">
            About BayanWin
          </Link>
          <span className="text-slate-600 mx-2">·</span>
          <Link to="/responsible-play" className="text-electric-400 hover:text-electric-300 underline">
            Responsible Play
          </Link>
        </div>
      </article>
    </main>
  );
}

export default Contact;
