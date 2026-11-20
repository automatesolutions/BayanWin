import React from 'react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'sycat0378@gmail.com';

function PrivacyPolicy() {
  return (
    <main id="main" className="page max-w-4xl">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="link">
          Home
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <span className="text-slate-300">Privacy Policy</span>
      </nav>

      <article className="article text-slate-200 space-y-8 text-sm leading-relaxed">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400">
            Last updated: October 28, 2026. BayanWin (“we”, “us”) operates the website{' '}
            <strong className="text-slate-300">bayanwin.net</strong> (the “Site”), primarily for users in the{' '}
            <strong className="text-slate-300">Philippines</strong>.
          </p>
        </header>

        <section className="space-y-3" aria-labelledby="pp-intro">
          <h2 id="pp-intro" className="text-xl font-semibold text-white">
            Summary
          </h2>
          <p className="text-slate-300">
            This policy describes what personal information may be processed when you use the Site, how we use it, and your
            choices under <strong className="text-slate-200">Philippine law</strong>, in particular the{' '}
            <strong className="text-slate-200">Data Privacy Act of 2012</strong> (Republic Act No. 10173) and its implementing
            rules. The Site provides lottery-related information and tools for{' '}
            <strong className="text-slate-200">personal, non-commercial</strong> use. We may update this policy from time to
            time; the “Last updated” date above will change when we do.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="pp-collect">
          <h2 id="pp-collect" className="text-xl font-semibold text-white">
            Information we process
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>
              <strong className="text-slate-200">Usage &amp; technical data:</strong> Like most websites, our hosting and
              infrastructure may log standard data such as IP address, browser type, approximate region, timestamps, and
              requested URLs. This helps us operate and secure the Site.
            </li>
            <li>
              <strong className="text-slate-200">Data you generate in the app:</strong> When you use features that call our
              backend API, requests may include parameters such as selected game type. We do not require you to create an
              account on the Site for basic browsing.
            </li>
            <li>
              <strong className="text-slate-200">Third-party backends:</strong> Lottery results and related data may be stored
              and served using third-party database or hosting services configured for the application (for example, cloud
              database and application hosting). Those providers process data under their own terms and security practices.
            </li>
          </ul>
        </section>

        <section className="space-y-3" aria-labelledby="pp-cookies">
          <h2 id="pp-cookies" className="text-xl font-semibold text-white">
            Cookies, advertising, and analytics
          </h2>
          <p className="text-slate-300">
            <strong className="text-slate-200">Necessary storage:</strong> We save your cookie choice in your browser’s
            local storage, so the banner doesn’t ask again on every visit. The Site has no accounts and sets no login
            cookies.
          </p>
          <p className="text-slate-300">
            <strong className="text-slate-200">Analytics:</strong> We don’t run an analytics service on the Site at this
            time. If we add one, we will update this policy and the cookie banner first, and it will load only with
            your consent.
          </p>
          <p className="text-slate-300">
            <strong className="text-slate-200">Advertising:</strong> We use Google AdSense to show ads on some pages.
            Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or
            other websites. Google’s use of advertising cookies enables it and its partners to serve ads to you based on
            your visits to this Site and other sites on the internet.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>
              You can opt out of personalized advertising in Google’s{' '}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="link">
                Ads Settings
              </a>
              .
            </li>
            <li>
              You can opt out of some third-party vendors’ use of cookies for personalized advertising at{' '}
              <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer" className="link">
                aboutads.info/choices
              </a>
              .
            </li>
            <li>
              To see how Google uses data from sites that show its ads, read{' '}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                How Google uses information from sites or apps that use its services
              </a>
              .
            </li>
          </ul>
          <p className="text-slate-300">
            <strong className="text-slate-200">Your choice in our banner:</strong> If you choose “Accept all”, Google may
            show personalized ads. If you choose “Reject optional”, we ask Google to show
            non-personalized ads only. Non-personalized ads still use cookies to limit how often you see an ad, to count
            ads in aggregate, and to stop fraud. You can change your choice at any time with the{' '}
            <strong className="text-slate-200">Cookie settings</strong> link in the footer. In some regions, such as the
            EEA, the UK, and Switzerland, Google may also show its own consent message before ads load.
          </p>
          <p className="text-slate-300">
            <strong className="text-slate-200">Where ads appear:</strong> Ads load only on our long-form articles: About
            BayanWin, Methodology, and the individual Blog articles. We don’t show ads on the prediction dashboard, the
            Blog list, Responsible Play, Privacy, Terms, Contact, or error pages.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="pp-use">
          <h2 id="pp-use" className="text-xl font-semibold text-white">
            How we use information
          </h2>
          <p className="text-slate-300">
            We process personal information for <strong className="text-slate-200">lawful purposes</strong> compatible with the
            DPA: to run and improve the Site, keep it secure, understand aggregate usage, and meet legal obligations. We do not
            trade or sell your personal information as a commodity. If we share data with processors or partners (such as
            hosting or ad networks), we do so for defined purposes and expect them to protect data in line with their
            contracts and applicable law. If our practices change materially, we will update this policy.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="pp-retention">
          <h2 id="pp-retention" className="text-xl font-semibold text-white">
            Retention
          </h2>
          <p className="text-slate-300">
            Server and application logs are kept only as long as needed for operations, security, and legal obligations.
            Retention for third-party services is governed by those providers’ policies.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="pp-rights">
          <h2 id="pp-rights" className="text-xl font-semibold text-white">
            Your rights (Philippines — Data Privacy Act)
          </h2>
          <p className="text-slate-300">
            If you are a <strong className="text-slate-200">data subject</strong> under the DPA, you may have rights
            including, where applicable: to be informed of processing; to <strong className="text-slate-200">access</strong>{' '}
            certain personal data; to <strong className="text-slate-200">rectify</strong> inaccurate or incomplete data; to
            suspend, withdraw, or seek <strong className="text-slate-200">erasure or blocking</strong> of processing in
            prescribed cases; to <strong className="text-slate-200">object</strong> to processing; and, where applicable, to{' '}
            <strong className="text-slate-200">data portability</strong>. You may also lodge a concern with the{' '}
            <strong className="text-slate-200">National Privacy Commission (NPC)</strong> as provided under Philippine law.
          </p>
          <p className="text-slate-300">
            To exercise rights or ask questions about processing, contact us using the email below. We may need reasonable
            steps to verify your identity before responding.
          </p>
          <p className="text-slate-400 text-xs">
            Official NPC resources:{' '}
            <a
              href="https://privacy.gov.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              privacy.gov.ph
            </a>
            . This summary is for convenience and is not a complete list of legal rights or NPC procedures.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="pp-children">
          <h2 id="pp-children" className="text-xl font-semibold text-white">
            Children
          </h2>
          <p className="text-slate-300">
            The Site is <strong className="text-slate-200">not directed at minors</strong>. We do not knowingly collect
            personal information from children in a manner inconsistent with the DPA and its rules on sensitive personal
            information. Lottery and wagering are restricted for minors under Philippine law; parents and guardians should
            supervise minors’ use of the internet.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="pp-international">
          <h2 id="pp-international" className="text-xl font-semibold text-white">
            Cross-border processing
          </h2>
          <p className="text-slate-300">
            We primarily serve users in the <strong className="text-slate-200">Philippines</strong>. Some of our service
            providers (for example, cloud hosting or database services) may process data in other countries. Where personal
            information is transferred subject to the DPA, we aim to use arrangements that respect applicable Philippine
            requirements. If you access the Site from abroad, both Philippine law and the laws of your location may apply.
          </p>
        </section>

        <section className="space-y-3 rounded-lg border border-slate-600/40 bg-slate-900/50 px-4 py-4" aria-labelledby="pp-contact">
          <h2 id="pp-contact" className="text-xl font-semibold text-white">
            Contact
          </h2>
          <p className="text-slate-300">
            Questions about this policy or privacy requests:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link break-all">
              {CONTACT_EMAIL}
            </a>
            . You may also use our <Link to="/contact" className="link">Contact</Link>{' '}
            page.
          </p>
        </section>

        <p className="text-xs text-slate-500 pt-4 border-t border-slate-600/50">
          This policy is provided for transparency. It is{' '}
          <strong className="text-slate-400">not legal advice</strong>. For official lottery results and rules, refer to PCSO
          and applicable Philippine regulators. For privacy complaints in the Philippines, you may contact the NPC at{' '}
          <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="text-slate-400 underline">
            privacy.gov.ph
          </a>
          .
        </p>
      </article>
    </main>
  );
}

export default PrivacyPolicy;
