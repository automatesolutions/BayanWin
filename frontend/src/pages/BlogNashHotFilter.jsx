import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import posterImg from '../../assets/nash/A_Beautiful_Mind_Poster.jpg';
import gifSmart from '../../assets/nash/smart-beautiful-mind.gif';
import gifDiamond from '../../assets/nash/cardiachill-diamondhands.gif';

function MediaAside() {
  return (
    <aside className="lg:sticky lg:top-24 space-y-6" aria-label="Article media">
      <div className="rounded-xl overflow-hidden border-2 border-amber-500/30 shadow-[0_0_40px_-10px_rgba(251,191,36,0.35)] bg-black/40">
        <img src={posterImg} alt="A Beautiful Mind theatrical poster" className="w-full h-auto object-cover" />
        <p className="text-[11px] text-slate-500 px-3 py-2 bg-black/50 font-mono">A Beautiful Mind (2001) · poster</p>
      </div>

      <figure className="rounded-xl overflow-hidden border border-slate-600/60 bg-slate-900/80 p-2">
        <img src={gifSmart} alt="Animated tribute to A Beautiful Mind" className="w-full rounded-lg" />
        <figcaption className="text-[11px] text-slate-500 mt-2 px-1 leading-snug">
          Visual beat: strategy, cooperation, and the "beautiful" tension of competing ideas in one mind.
        </figcaption>
      </figure>

      <figure className="rounded-xl overflow-hidden border border-orange-500/25 bg-gradient-to-b from-slate-900 to-black p-2">
        <img src={gifDiamond} alt="Diamond hands meme animation" className="w-full rounded-lg" />
        <figcaption className="text-[11px] text-slate-500 mt-2 px-1 leading-snug">
          Pop-culture shorthand for stubborn commitment—fun contrast with Nash's mathematical notion of stable, mutual
          best responses (equilibrium), not financial advice.
        </figcaption>
      </figure>
    </aside>
  );
}

function BlogNashHotFilter() {
  useEffect(() => {
    document.title = 'NashHotFilter: Game Theory Lottery Analysis Philippines | BayanWin';
    return () => {};
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 flex-1 max-w-6xl">
      <nav className="mb-6 text-sm text-slate-400">
        <Link to="/" className="text-electric-400 hover:text-electric-300 underline">
          Home
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <Link to="/blog" className="text-electric-400 hover:text-electric-300 underline">
          Blog
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-300">NashHotFilter</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-10 xl:gap-12">
        <article className="min-w-0 space-y-10 text-slate-300 text-sm leading-relaxed">
          <header className="border-l-4 border-amber-500 pl-5 space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-400/90">Algorithms · Cinema · Game theory</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">NashHotFilter and the spirit of <em>A Beautiful Mind</em></h1>
            <p className="text-slate-400 max-w-3xl">
              BayanWin's <strong className="text-slate-200">NashHotFilter</strong> borrows its name from ideas associated
              with mathematician John Nash—especially <strong className="text-slate-200">equilibrium</strong> thinking in
              game theory—then mixes those ideas with hot/cold number heuristics. This article walks through Ron Howard's
              2001 film as popular storytelling (not a documentary), then connects why that story matters to how we talk
              about "balance" in prediction tools built on random draws.
            </p>
          </header>

          <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 px-4 py-3 text-xs text-amber-100/90">
            <strong className="text-amber-200">Note:</strong> The following is a <strong>plot summary</strong> of{' '}
            <em>A Beautiful Mind</em> (2001). It contains spoilers. The real John Nash's life differed in important ways
            from the screenplay; see biographies and his Nobel lecture for scholarly detail.
          </div>

          <section className="space-y-4" aria-labelledby="sec-film">
            <h2 id="sec-film" className="text-xl font-semibold text-white">
              The film: biographical drama, not a math textbook
            </h2>
            <p>
              <em>A Beautiful Mind</em> is a 2001 American biographical drama directed by Ron Howard about mathematician{' '}
              <strong className="text-slate-200">John Nash</strong>, who was awarded the Nobel Memorial Prize in Economic
              Sciences for his work on game theory. In the film, Nash is played by <strong className="text-slate-200">Russell Crowe</strong>.
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="sec-princeton">
            <h2 id="sec-princeton" className="text-xl font-semibold text-white">
              Princeton, 1947: ambition on a scholarship
            </h2>
            <p>
              In 1947, Nash arrives at <strong className="text-slate-200">Princeton University</strong> as co-recipient,
              with Martin Hansen, of the Carnegie Scholarship for Mathematics. He meets fellow graduate students Sol,
              Ainsley, and Bender, and his roommate <strong className="text-slate-200">Charles Herman</strong>, a literature
              student.
            </p>
            <p>
              Determined to publish something truly original, Nash listens as his classmates debate how to approach a group
              of women at a bar. He argues that a <strong className="text-slate-200">cooperative approach</strong> could
              improve everyone's odds—a storytelling spark that, in the film, leads him toward a new notion of governing
              dynamics.
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="sec-mit">
            <h2 id="sec-mit" className="text-xl font-semibold text-white">
              MIT, the Pentagon, and a second life in secrets
            </h2>
            <p>
              His breakthrough earns him a place at <strong className="text-slate-200">MIT</strong>, where he picks Sol and
              Bender over Hansen to join him. In 1953, Nash is summoned to the Pentagon to help decipher encrypted enemy
              communications. Restless with campus work, he is recruited by the mysterious{' '}
              <strong className="text-slate-200">William Parcher</strong> of the U.S. Department of Defense for a classified
              mission: spot hidden patterns in magazines and newspapers to counter a supposed Soviet plot. He believes he
              receives an implanted diode that unlocks a dead-drop at a mansion. Obsession and paranoia deepen.
            </p>
            <p>
              Nash falls in love with student <strong className="text-slate-200">Alicia Larde</strong>; they marry. After a
              violent episode between Parcher and imagined Soviet agents, Nash tries to quit but feels compelled to
              continue. While lecturing at Harvard, he flees perceived pursuers and is sedated; he wakes under the care of{' '}
              <strong className="text-slate-200">Dr. Rosen</strong>.
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="sec-truth">
            <h2 id="sec-truth" className="text-xl font-semibold text-white">
              Diagnosis, unopened envelopes, and the cost of clarity
            </h2>
            <p>
              Rosen explains to Alicia that Nash has <strong className="text-slate-200">schizophrenia</strong>—Charles,
              Marcee (Charles's niece), and Parcher are hallucinations. Alicia, Sol, and Bender comb his study, thick with
              news clippings. She finds unopened "classified" packets from the drop point and confronts him with the truth.
              Nash, shattered, tries to cut out the diode; there is nothing there. Insulin shock therapy follows, then
              release. Frustrated by medication side effects, he secretly stops treatment; Parcher returns, urging him back to
              a shed near home.
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="sec-relapse">
            <h2 id="sec-relapse" className="text-xl font-semibold text-white">
              Relapse, danger, and learning which voices are real
            </h2>
            <p>
              In 1956, Alicia finds Nash has relapsed. Their infant son is left in a filling bathtub while Nash believes
              Charles is watching—Alicia calls Rosen; in confusion Nash strikes out, thinking he is saving them from
              Parcher. Fleeing with the baby, Alicia forces a reckoning: Nash notices his phantoms never age—
              <strong className="text-slate-200">Marcee remains a girl</strong>—and accepts they are hallucinations.
              Against medical advice, he chooses community care with Alicia rather than another hospitalization.
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="sec-princeton2">
            <h2 id="sec-princeton2" className="text-xl font-semibold text-white">
              Return to Princeton, decades of discipline, and the Nobel stage
            </h2>
            <p>
              Nash returns to Princeton, humbly asking{' '}
              <strong className="text-slate-200">Hansen—now department head</strong>—for library space and permission to
              audit classes. Over twenty years he learns to disregard visions; by the late 1970s he teaches again. In 1994
              he receives the <strong className="text-slate-200">Nobel Memorial Prize in Economic Sciences</strong> for game
              theory; colleagues honor him, and in Stockholm he dedicates the prize to Alicia. The film closes as Charles,
              Marcee, and Parcher reappear—Nash simply walks past them, leaving with his family.
            </p>
          </section>

          <section className="space-y-4 rounded-xl border border-electric-500/25 bg-slate-800/50 px-5 py-6" aria-labelledby="sec-bayanwin">
            <h2 id="sec-bayanwin" className="text-xl font-semibold text-white">
              Why any of this shows up in BayanWin as NashHotFilter
            </h2>
            <p>
              The movie made Nash a household name for <strong className="text-slate-200">game theory</strong> and the
              image of a mind wrestling competing strategies at once. <strong className="text-slate-200">NashHotFilter</strong>{' '}
              in BayanWin is a nod to that cultural story: a hybrid heuristic that blends equilibrium-flavored balancing
              ideas with "hot" (frequently drawn) number pressure—useful for exploration, not proof of a winning system.
            </p>
            <p>
              More specifically, the NashHotFilter works by asking a question analogous to Nash equilibrium: given
              the current hot-number landscape (which numbers have appeared more frequently recently), what is the
              "stable" combination where no individual number preference would improve the overall balance of the
              selection? The algorithm iterates toward this balanced point while still weighting toward historically
              active numbers. The result is a six-number candidate line that is neither purely the most-frequent
              numbers nor a random spread—it occupies a middle ground guided by both frequency signal and
              equilibrium-style balance.
            </p>
            <p className="text-slate-500 text-xs">
              Lottery draws are legally random; past frequency does not create obligation for the next draw. Enjoy the
              models as experiments on history, not promises about the future.
            </p>
          </section>

          <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="sec-game-theory-context">
            <h2 id="sec-game-theory-context" className="text-xl font-semibold text-white">
              Game theory in the Philippines lottery context
            </h2>
            <p>
              The Philippines lottery — managed by PCSO for games including 6/42, 6/45, 6/49, 6/55, and 6/58 — is
              not a game in the game-theory sense: there is no strategic interaction between players. Each player
              independently selects numbers, and the outcome is determined by a certified random draw, not by what
              other players chose. So why apply game-theory-inspired thinking at all?
            </p>
            <p>
              The answer is that <strong className="text-slate-200">equilibrium concepts are useful for balancing
              competing objectives</strong> within a single decision process, even without strategic opponents.
              When choosing six numbers from a pool of 42 to 58, a purely hot-number approach may cluster predictions
              in a narrow range and miss broad coverage; a purely random approach ignores historical signal entirely.
              NashHotFilter uses the equilibrium idea as a <em>balancing metaphor</em>: find the point where the
              tension between "follow the hot numbers" and "maintain good spread" is resolved rather than dominated
              by either extreme.
            </p>
            <p>
              This is a creative application of mathematical thinking to an uncertain domain — genuinely interesting
              as an exploratory tool, but always with the understanding that no balancing heuristic changes the
              fundamental randomness of the next draw.
            </p>
          </section>

          <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="sec-faq-nash">
            <h2 id="sec-faq-nash" className="text-xl font-semibold text-white">
              FAQ: NashHotFilter and game theory in lottery analysis
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-200">Did John Nash actually work on lottery prediction?</h3>
                <p className="text-slate-400 mt-1">
                  No. John Nash's mathematical work was in game theory, specifically in proving the existence
                  of equilibria in non-cooperative games (Nash equilibrium). His ideas have been applied broadly
                  in economics, evolutionary biology, and computer science. BayanWin's NashHotFilter borrows
                  the conceptual spirit of equilibrium — balancing competing forces — not any actual Nash
                  work on lottery games.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Can the NashHotFilter predict winning PCSO numbers?</h3>
                <p className="text-slate-400 mt-1">
                  No. PCSO draws are random by design. NashHotFilter is an exploratory heuristic that produces
                  balanced candidate lines based on historical frequency data. It is one of six models in
                  BayanWin's ensemble — useful for exploration and comparison, but not a predictive system
                  that can overcome genuine randomness.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">How is NashHotFilter different from just picking the most frequent numbers?</h3>
                <p className="text-slate-400 mt-1">
                  A pure hot-number strategy would simply rank numbers by historical frequency and pick the
                  top six. NashHotFilter adds a balancing constraint: the candidate line should be in a
                  "stable" configuration where neither hot-number weighting nor spread coverage dominates
                  completely. This produces lines that consider frequency without being entirely driven by it.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">How did the film A Beautiful Mind influence modern views of game theory?</h3>
                <p className="text-slate-400 mt-1">
                  Ron Howard's 2001 film brought Nash equilibrium into popular consciousness far beyond academic
                  economics. The bar scene (simplified for dramatic purposes) introduced millions of viewers to
                  the idea that individual rational choices can lead to collectively suboptimal outcomes — a
                  concept that resonates in fields from traffic management to political science. The film
                  sparked widespread curiosity about game theory and is one reason the concept is recognizable
                  outside universities today.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-600/50 pt-6" aria-labelledby="related-articles">
            <h2 id="related-articles" className="text-lg font-semibold text-white">
              Related Articles
            </h2>
            <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
              <li>
                <Link to="/blog/markov-chains-lottery" className="text-amber-400 hover:text-amber-300 underline">
                  Markov chain lottery analysis in the Philippines
                </Link>
              </li>
              <li>
                <Link to="/blog/deep-reinforcement-learning" className="text-amber-400 hover:text-amber-300 underline">
                  AI lottery prediction methods with Deep RL
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="text-amber-400 hover:text-amber-300 underline">
                  BayanWin lottery methodology and limitations
                </Link>
              </li>
            </ul>
          </section>

          <p className="pt-4">
            <Link to="/blog" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
              ← Back to Blog
            </Link>
          </p>
        </article>

        <MediaAside />
      </div>
    </main>
  );
}

export default BlogNashHotFilter;
