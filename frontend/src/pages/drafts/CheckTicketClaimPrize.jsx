import React from 'react';
import { Link } from '../../components/SiteLink';
import AuthorBio from '../../components/AuthorBio';
import Notice from '../../components/ui/Notice';

// Facts marked with <Verify> could not be confirmed against an official page on 2026-11-26.
// pcso.gov.ph refused automated requests, so the owner must check each one before this page goes live.
const Verify = ({ children }) => <mark className="bg-amber-500/20 text-amber-100">[verify: {children}]</mark>;

const CHECKED = 'Nov 26, 2026';
// Must match what TicketChecker.jsx compares against.
const CHECKER_DRAWS = 10;
const TAX_FREE_LIMIT = 10000;
const TAX_RATE = 0.2;
const examplePrize = 1000000;
const peso = (n) => `₱${n.toLocaleString('en-US')}`;

const sectionClass = 'space-y-3 text-sm leading-relaxed text-slate-300';
const h2Class = 'text-xl font-semibold text-white';
const h3Class = 'text-base font-semibold text-white';

function CheckTicketClaimPrize() {
  return (
    <main id="main" className="page max-w-4xl">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" className="link">
          Home
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <Link to="/blog" className="link">
          Blog
        </Link>
        <span aria-hidden className="text-silver-700">/</span>
        <span className="text-slate-300">Check and Claim</span>
      </nav>

      <Notice tone="warning" title="Draft for review">
        Not published. This page only exists in npm run dev.
      </Notice>

      <article className="article text-slate-200 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">How to check if your PCSO ticket won, and how to claim a prize</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            You have a PCSO lotto ticket and the draw is over. How do you check it, and what do you do if it won? This
            guide walks through both, step by step, and points out where to confirm the rules with PCSO.
          </p>
          <p className="mt-3 text-xs text-silver-500">
            By{' '}
            <Link to="/about#who-runs-bayanwin" className="link">
              Jonel Pericon
            </Link>
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className={h2Class}>Step 1: Check your numbers</h2>
          <p>
            Find the game and the draw date on your ticket first. A 6/49 line only counts against 6/49 results for that
            date.
          </p>
          <p>
            Order doesn’t matter. If the draw is 05 12 19 27 33 41 and your line reads 41 33 27 19 12 05, all 6
            match. Lines with fewer matches can win smaller prizes.{' '}
            <Verify>confirm which match counts win a prize in each game</Verify>
          </p>

          <h3 className={h3Class}>Use an official source</h3>
          <p>
            PCSO’s official website is pcso.gov.ph. It publishes lotto results for each game.{' '}
            <Verify>confirm the current results page URL on pcso.gov.ph</Verify>
          </p>
          <p>
            PCSO also posts results on its official social media pages.{' '}
            <Verify>name the official PCSO accounts, or remove this sentence</Verify> Check that a page is PCSO’s own
            before you trust it. Copycat pages exist for many lotteries.
          </p>
          <p>
            You can also ask at an authorized lotto outlet.{' '}
            <Verify>confirm that outlets check tickets for players</Verify>
          </p>

          <h3 className={h3Class}>Use BayanWin’s ticket checker</h3>
          <p>
            Our{' '}
            <Link to="/" className="link">
              homepage
            </Link>{' '}
            has a “Check your ticket” box. Here’s what it does:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Pick your game on the homepage.</li>
            <li>Enter your 6 numbers. Each must be different and inside the game’s range.</li>
            <li>Select “Check my numbers.”</li>
          </ol>
          <p>
            The checker compares your numbers with the last {CHECKER_DRAWS} draws of that game. It shows how many
            numbers matched in each draw, and your best match. Matched numbers are highlighted.
          </p>
          <p>
            It has limits. It doesn’t read your ticket, so it doesn’t know your draw date. If your draw is older than the
            last {CHECKER_DRAWS}, it won’t appear. It also doesn’t tell you prize amounts. Our results aren’t official,
            so confirm any match with PCSO before you go to claim.
          </p>

          <h3 className={h3Class}>Keep the ticket safe</h3>
          <p>These are general good habits, not PCSO rules:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Keep the ticket flat and dry, away from heat and sunlight.</li>
            <li>Take a photo of both sides and keep it private.</li>
            <li>Don’t post a winning ticket online. Anyone who sees it clearly could try to use it.</li>
            <li>Check your ticket soon after the draw, so you don’t miss a claim deadline.</li>
          </ul>
          <p>
            PCSO asks winners to write their name and sign the back of a winning ticket.{' '}
            <Verify>confirm on pcso.gov.ph that winners must sign the back of the ticket</Verify>
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Step 2: Claim your prize</h2>
          <p>Where you claim depends on how much you won. Use this as a starting point and confirm with PCSO first.</p>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[480px]">
              <thead>
                <tr>
                  <th scope="col">Prize</th>
                  <th scope="col">Where to claim</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Up to ₱10,000</th>
                  <td>
                    Any authorized lotto outlet, or a PCSO branch office <Verify>tier and places</Verify>
                  </td>
                </tr>
                <tr>
                  <th scope="row">₱10,001 to ₱300,000</th>
                  <td>
                    A PCSO branch office, or the PCSO main office <Verify>tier and places</Verify>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Above ₱300,000, including jackpots</th>
                  <td>
                    PCSO main office in Mandaluyong City <Verify>tier and address</Verify>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className={h3Class}>What to bring</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>The original winning ticket. A photo or copy isn’t a ticket.</li>
            <li>
              2 valid government-issued IDs. <Verify>confirm the number and accepted types of ID</Verify>
            </li>
            <li>
              If someone claims for you, a notarized special power of attorney and their own IDs.{' '}
              <Verify>confirm the rules for representatives</Verify>
            </li>
          </ul>

          <h3 className={h3Class}>Claim before the deadline</h3>
          <p>
            Lotto prizes must be claimed within 1 year of the draw date. Unclaimed prizes are forfeited.{' '}
            <Verify>confirm the 1-year deadline and whether it counts from the draw date</Verify>
          </p>
          <p>Don’t wait for the last month. Claim as soon as you’ve confirmed the result.</p>

          <h3 className={h3Class}>If you won a large prize</h3>
          <p>
            Take your time before you tell many people. Keep the ticket somewhere only you can reach. Think about
            talking to a lawyer or a financial adviser you choose yourself before you spend any of it. Ignore anyone
            who contacts you with an offer you didn’t ask for.
          </p>

          <h3 className={h3Class}>Taxes on lotto prizes</h3>
          <p>
            The TRAIN law, Republic Act No. 10963, sets the tax on lotto winnings. PCSO and lotto winnings of{' '}
            {peso(TAX_FREE_LIMIT)} or less are exempt from tax. Larger prizes and winnings face a{' '}
            {Math.round(TAX_RATE * 100)}% final tax.
          </p>
          <p>
            Here’s the arithmetic for a {peso(examplePrize)} prize. {Math.round(TAX_RATE * 100)}% is{' '}
            {peso(examplePrize * TAX_RATE)}, which leaves {peso(examplePrize * (1 - TAX_RATE))}. The tax applies to the
            whole prize, not only the part above {peso(TAX_FREE_LIMIT)}.{' '}
            <Verify>confirm that the 20% applies to the full amount and that PCSO deducts it before paying</Verify>
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Your claim checklist</h2>
          <p>Run through this list before you leave home to claim:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Confirm the result on an official PCSO source, for the right game and draw date.</li>
            <li>Find your prize amount, and from it, where you need to claim.</li>
            <li>Sign the back of the ticket if PCSO asks you to.</li>
            <li>Pack the original ticket and your IDs in a safe, dry place.</li>
            <li>Check the office hours of the branch or outlet before you travel.</li>
            <li>Count the days left before the claim deadline.</li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Step 3: Avoid prize scams</h2>
          <p>Scammers target lotto players because a prize message feels urgent. These habits protect you:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Ignore any message that asks you to pay a fee to release a prize.</li>
            <li>Don’t send your ticket, a photo of it, or your ID to anyone who contacts you first.</li>
            <li>Don’t share bank details, one-time codes, or passwords with someone who says you won.</li>
            <li>Be wary of any “win” you didn’t buy a ticket for. You can’t win a draw you didn’t enter.</li>
            <li>Go to a PCSO office or an authorized outlet yourself. Don’t rely on a contact who reached out to you.</li>
          </ul>
          <p>
            Lotto prizes come from the tickets you hold. Nobody needs to message you about a win, because you check the
            result yourself.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>A note on playing</h2>
          <p>
            Winning is rare. Every line has the same small chance, and no checker, pattern, or app changes that. Treat a
            ticket as a small cost for fun, and set a limit before you buy. Our{' '}
            <Link to="/responsible-play" className="link">
              responsible play guide
            </Link>{' '}
            has practical limits and where to get help.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>Sources</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Republic Act No. 10963 (TRAIN law), Section 24(B)(1) of the Tax Code as amended, on lawphil.net:{' '}
              <a
                href="https://www.lawphil.net/statutes/repacts/ra2017/ra_10963_2017.html"
                className="link break-all"
                rel="noopener noreferrer"
                target="_blank"
              >
                lawphil.net/statutes/repacts/ra2017/ra_10963_2017.html
              </a>
              . Checked {CHECKED}.
            </li>
          </ul>
          <p>
            <Verify>
              check claim places, IDs, signing, and the deadline against pcso.gov.ph/FAQs.aspx and the 2025 PCSO
              Citizen’s Charter, then add them here with the date checked
            </Verify>
          </p>
        </section>

        <AuthorBio />

        <section className="space-y-2 text-sm">
          <h2 className="text-lg font-semibold text-white">Related reading</h2>
          <ul className="list-disc space-y-1 pl-5 text-slate-300">
            <li>
              <Link to="/" className="link">
                Latest PCSO lotto results and ticket checker
              </Link>
            </li>
            <li>
              <Link to="/responsible-play" className="link">
                Responsible play
              </Link>
            </li>
            <li>
              <Link to="/methodology" className="link">
                How we collect and check our data
              </Link>
            </li>
            <li>
              <Link to="/blog" className="link">
                All articles
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </main>
  );
}

export default CheckTicketClaimPrize;
