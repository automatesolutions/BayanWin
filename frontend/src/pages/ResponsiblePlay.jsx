import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function ResponsiblePlay() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Responsible Play Guide — Lottery Safety Philippines | BayanWin';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <nav className="mb-6 text-sm text-slate-400">
        <Link to="/" className="text-electric-400 hover:text-electric-300 underline">
          Home
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-300">Responsible Play</span>
      </nav>

      <article className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-5 py-8 text-slate-200 shadow-sm space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Responsible Play</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
            BayanWin is an analytical and informational platform, not a lottery operator. We support informed,
            moderate, and legally compliant use of lottery products. This page outlines our responsible play
            principles and provides guidance for users in the Philippines.
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="rp-understanding">
          <h2 id="rp-understanding" className="text-xl font-semibold text-white">
            Understanding lottery randomness
          </h2>
          <p>
            PCSO lottery games — including 6/42, 6/45, 6/49, 6/55, and 6/58 — use certified random draw
            mechanisms. Each draw is <strong className="text-slate-200">statistically independent</strong>: the
            balls drawn in one game have no memory of past results and cannot influence future draws. This is a
            fundamental property of the system by design.
          </p>
          <p>
            BayanWin's analytical tools show historical patterns, frequency distributions, and model predictions.
            These are useful for studying draw behaviour over time, but they{' '}
            <strong className="text-slate-200">do not — and cannot — change the randomness of the next draw</strong>.
            A number that has appeared frequently in the past is not more or less likely to appear in the next game
            than any other number in the pool.
          </p>
          <p>
            Understanding this distinction — between historical analysis (educational) and prediction of guaranteed
            outcomes (impossible) — is the foundation of responsible play. We encourage all users to approach our
            tools with curiosity, not financial expectation.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="rp-budget">
          <h2 id="rp-budget" className="text-xl font-semibold text-white">
            Setting a safe budget
          </h2>
          <p>
            The single most important step in responsible lottery play is deciding on a fixed, affordable budget
            before you purchase any ticket. This budget should be:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">Strictly entertainment money</strong> — only spend what you are
              genuinely comfortable losing entirely. Never use money needed for rent, food, bills, education, or
              emergency savings.
            </li>
            <li>
              <strong className="text-slate-200">Set in advance</strong> — decide the amount before you approach
              any outlet or terminal, not in the moment of excitement.
            </li>
            <li>
              <strong className="text-slate-200">Non-negotiable once set</strong> — if you reach your limit, stop.
              Do not borrow, dip into savings, or make promises to recover losses.
            </li>
            <li>
              <strong className="text-slate-200">Reviewed regularly</strong> — if your financial situation changes,
              adjust your budget accordingly, even if that means temporarily stopping altogether.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="rp-signs">
          <h2 id="rp-signs" className="text-xl font-semibold text-white">
            Warning signs of problem gambling
          </h2>
          <p>
            Lottery play is recreational for the vast majority of participants. However, for some individuals it
            can develop into a compulsive behaviour. Watch for these warning signs:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Spending more time or money on lottery than you planned, even after deciding to stop.</li>
            <li>
              <strong className="text-slate-200">Chasing losses</strong> — buying more tickets to try to recover
              money already lost.
            </li>
            <li>
              Feeling anxious, irritable, or preoccupied when you are not able to play, or when you cannot access
              results.
            </li>
            <li>Lying to family or friends about how much you are spending on lottery tickets.</li>
            <li>Borrowing money or selling belongings to fund lottery purchases.</li>
            <li>
              Neglecting work, family, health, or other responsibilities because of lottery activity.
            </li>
            <li>
              Believing that a "system", tool, or algorithm — including any feature on BayanWin — can reliably
              produce winning combinations.
            </li>
          </ul>
          <p>
            If you recognise these patterns in yourself or someone you care about, please seek support from a
            qualified professional. Play should remain recreational and should never compromise financial security
            or personal wellbeing.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="rp-practical">
          <h2 id="rp-practical" className="text-xl font-semibold text-white">
            Practical guidelines for moderate play
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">Play for fun, not profit</strong> — treat the ticket cost as
              the price of entertainment, like a movie or meal out, where you do not expect a financial return.
            </li>
            <li>
              <strong className="text-slate-200">Take regular breaks</strong> — avoid playing every draw
              automatically. Skipping rounds is healthy and helps maintain perspective.
            </li>
            <li>
              <strong className="text-slate-200">Do not play under emotional stress</strong> — decisions made
              when stressed, grieving, or anxious tend to lead to overspending. If you are in emotional difficulty,
              this is not the time to gamble.
            </li>
            <li>
              <strong className="text-slate-200">Keep records</strong> — track your lottery spending and winnings
              honestly. Seeing the net picture over months helps calibrate realistic expectations.
            </li>
            <li>
              <strong className="text-slate-200">Do not rely on "systems" or predictions</strong> — no algorithm,
              statistical method, or advisory service can guarantee a lottery win. Algorithmic outputs like those
              on BayanWin are educational tools, not financial strategies.
            </li>
            <li>
              <strong className="text-slate-200">Talk to someone you trust</strong> — if you feel your play is
              becoming a problem, talking openly with a trusted friend, family member, or counsellor is a positive
              first step.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="rp-age">
          <h2 id="rp-age" className="text-xl font-semibold text-white">
            Age and legal compliance
          </h2>
          <p>
            Under Philippine law, lottery ticket purchases are restricted to adults. BayanWin is not intended for
            use by minors. Parents and guardians are responsible for monitoring young people's internet activity
            and ensuring that lottery-related content is not accessible to children in their care.
          </p>
          <p>
            Use this site only where lawful for your location and age. If you are unsure about the legal requirements
            in your area, consult local regulations before participating in any lottery activity.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="rp-noaffil">
          <h2 id="rp-noaffil" className="text-xl font-semibold text-white">
            No affiliation with PCSO
          </h2>
          <p>
            BayanWin is an <strong className="text-slate-200">independent informational website</strong> and is not
            affiliated with, endorsed by, or operated by the Philippine Charity Sweepstakes Office (PCSO) or any
            other official lottery authority. For official draw schedules, prize structures, ticket purchase
            locations, and verified results, always refer to{' '}
            <strong className="text-slate-200">pcso.gov.ph</strong> and authorised PCSO outlets.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-300" aria-labelledby="rp-faq">
          <h2 id="rp-faq" className="text-xl font-semibold text-white">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-200">Can BayanWin's predictions help me win the lottery?</h3>
              <p className="text-slate-400 mt-1">
                No. Our algorithmic outputs are statistical explorations of historical draw data. Lottery draws are
                random by design, and no tool — however sophisticated — can predict the outcome of a certified
                random process. Use the tools for educational purposes only.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Is it safe to spend my savings on lottery tickets if I have a "good system"?</h3>
              <p className="text-slate-400 mt-1">
                No. Lottery spending should always come from a small, discretionary entertainment budget — never
                from savings, loans, or essential funds. No system, including anything on BayanWin, removes the
                inherent randomness of lottery draws.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Where can I get help for problem gambling in the Philippines?</h3>
              <p className="text-slate-400 mt-1">
                Seek support from qualified mental health professionals, community organisations, or counselling
                services in your area. You can also approach local barangay social welfare offices for referrals.
                The{' '}
                <a
                  href="https://www.doh.gov.ph"
                  target="_blank"
                  rel="noreferrer"
                  className="text-electric-400 hover:text-electric-300 underline"
                >
                  Department of Health (DOH)
                </a>{' '}
                provides guidance on mental health services in the Philippines.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">How do I know if I am playing responsibly?</h3>
              <p className="text-slate-400 mt-1">
                A simple check: if you never spend more than your pre-set entertainment budget, you play less often
                during stressful periods, you do not borrow money for tickets, and you feel comfortable telling
                others how much you spend — those are good indicators of responsible play.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-5">
          <h2 className="text-xl font-semibold text-white">Need help or have questions?</h2>
          <p>
            If you have concerns about this platform, the data we show, or responsible use, visit our{' '}
            <Link to="/contact" className="text-electric-400 hover:text-electric-300 underline">
              Contact
            </Link>{' '}
            page. For privacy concerns in the Philippines, you may also reach the National Privacy Commission at{' '}
            <a
              href="https://privacy.gov.ph"
              target="_blank"
              rel="noreferrer"
              className="text-electric-400 hover:text-electric-300 underline"
            >
              privacy.gov.ph
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}

export default ResponsiblePlay;
