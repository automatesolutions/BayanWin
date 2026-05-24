import React from 'react';
import { Link } from 'react-router-dom';

function Methodology() {
  return (
    <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <nav className="mb-6 text-sm text-slate-400">
        <Link to="/" className="text-electric-400 hover:text-electric-300 underline">
          Home
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-300">Methodology</span>
      </nav>

      <article className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-5 py-8 text-slate-200 shadow-sm space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-white">BayanWin Methodology</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
            A detailed explanation of how BayanWin collects Philippine PCSO lottery data, processes
            historical draw sequences, applies six distinct analytical models, and presents results
            responsibly for educational use.
          </p>
          <p className="text-xs text-slate-500">Last updated: May 2026</p>
        </header>

        {/* Data Sources */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-data">
          <h2 id="method-data" className="text-xl font-semibold text-white">1. Data Sources and Collection</h2>
          <p>
            BayanWin's analytical pipeline begins with <strong className="text-slate-200">official PCSO draw history</strong>{' '}
            for five lottery games: Lotto 6/42, Mega Lotto 6/45, Super Lotto 6/49, Grand Lotto 6/55,
            and Ultra Lotto 6/58. These draws have been conducted by the Philippine Charity Sweepstakes
            Office (PCSO) for years, generating thousands of six-number draw results per game.
          </p>
          <p>
            Historical data is ingested from curated sources maintained in structured spreadsheets and
            synchronized into our database through two mechanisms:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">Scheduled background ingestion</strong> — a Cloud Scheduler
              job calls our backend API at regular intervals (every 20–30 minutes) to pull new draw results
              as they are added to source records. This keeps the database current without requiring user
              interaction.
            </li>
            <li>
              <strong className="text-slate-200">On-demand sync</strong> — when a user selects a game on the
              homepage, the app triggers a data sync to ensure the latest available results are reflected
              in all dashboards before analysis begins.
            </li>
          </ul>
          <p>
            The synchronized data is stored in <strong className="text-slate-200">InstantDB</strong>, a
            real-time database that supports fast queries and live updates, allowing dashboards to refresh
            without full page reloads. For official draw verification, schedule information, and prize
            claims, always refer to <strong className="text-slate-200">pcso.gov.ph</strong>. BayanWin is
            an independent informational platform and not an official PCSO source.
          </p>
        </section>

        {/* Feature Engineering */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-features">
          <h2 id="method-features" className="text-xl font-semibold text-white">2. Feature Engineering from Draw History</h2>
          <p>
            Raw draw results (six numbers per draw, dated and ordered) are transformed into a rich set of
            numerical features before being passed to the analytical models. This feature engineering step
            is what allows machine learning models to find patterns that are not visible in raw number lists.
          </p>
          <p>Key feature categories include:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-200">Frequency features</strong> — how often each number has
              appeared in recent windows (last 50, 100, and full-history draws), relative to its expected
              frequency under a uniform distribution.
            </li>
            <li>
              <strong className="text-slate-200">Gap features</strong> — the number of draws since each
              number last appeared. Numbers with unusually long gaps are flagged as "overdue" for
              exploratory purposes (though past gaps do not affect future probability).
            </li>
            <li>
              <strong className="text-slate-200">Co-occurrence features</strong> — how often pairs of
              numbers appear together in the same draw, represented as a co-occurrence matrix. Strong
              co-occurrence patterns across thousands of draws are visualised in the graph view.
            </li>
            <li>
              <strong className="text-slate-200">Sum and product features</strong> — aggregate properties
              of each six-number draw result, used to identify the typical range and distribution of
              winning combinations.
            </li>
            <li>
              <strong className="text-slate-200">Transition features</strong> — which numbers followed which
              numbers across consecutive draws, forming the basis for Markov chain analysis.
            </li>
            <li>
              <strong className="text-slate-200">Positional features</strong> — whether certain numbers
              tend to appear more often in specific sorted positions (lowest, middle, highest) within
              winning combinations.
            </li>
          </ul>
        </section>

        {/* Model Family */}
        <section className="space-y-6 text-sm leading-relaxed text-slate-300" aria-labelledby="method-models">
          <h2 id="method-models" className="text-xl font-semibold text-white">3. Analytical Model Family</h2>
          <p>
            BayanWin uses an <strong className="text-slate-200">ensemble of six independent models</strong>,
            each encoding a different set of assumptions about lottery draw sequences. No single model is
            treated as authoritative. Comparing where models agree and disagree is itself an analytical
            signal.
          </p>

          <div className="space-y-6 border-l-2 border-electric-500/30 pl-5">

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">3.1 XGBoost (Gradient Boosted Trees)</h3>
              <p>
                XGBoost trains an ensemble of decision trees on tabular feature vectors derived from draw
                history. Each tree corrects the residual error of the previous iteration, making the
                model progressively better at capturing non-linear relationships between features and
                draw outcomes. The model is retrained periodically as new draw data accumulates.
              </p>
              <p>
                Output: six candidate numbers selected by scoring each number across the feature space
                and picking the top-ranked outputs. The model has no notion of sequence — it treats each
                prediction as an independent scoring problem.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">3.2 Decision Tree</h3>
              <p>
                A single interpretable decision tree trained on the same feature set as XGBoost. While
                less accurate than the boosted ensemble, the tree structure is transparent — you can
                trace which feature splits led to each prediction. It serves as a simpler, more
                explainable baseline alongside the more complex models.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">3.3 Markov Chain Model</h3>
              <p>
                The Markov model treats the draw sequence as a stochastic process where the probability
                of seeing a number in the next draw depends (in part) on which numbers appeared in
                recent draws. A transition matrix is built from the full draw history: each cell
                represents the empirical probability of number B appearing in the draw immediately after
                number A appeared.
              </p>
              <p>
                In steady-state, the Markov chain converges to a stationary distribution — a long-run
                frequency estimate for each number. BayanWin uses this stationary distribution alongside
                short-window transition probabilities to rank candidates. The Markov graph visualisation
                shows the strongest positive and negative transition relationships in the dataset.
              </p>
              <p>
                Read more in the{' '}
                <Link to="/blog/markov-chains-lottery" className="text-electric-400 hover:text-electric-300 underline">
                  Markov chains lottery article
                </Link>
                .
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">3.4 NashHotFilter (Game Theory Heuristic)</h3>
              <p>
                NashHotFilter is a hybrid heuristic inspired by equilibrium concepts from game theory —
                specifically the Nash equilibrium idea that a stable strategy is one where no participant
                can improve by unilaterally changing their approach. Applied to lottery analysis, this
                translates into finding a "balanced" set of numbers that are neither excessively hot
                (overrepresented recently) nor extremely cold (absent for long periods).
              </p>
              <p>
                The filter blends frequency pressure, gap pressure, and co-occurrence weight into a
                composite score, then selects the six numbers that best satisfy an equilibrium-inspired
                balance criterion. It is purely heuristic and exploratory. Read more in the{' '}
                <Link to="/blog/nash-hotfilter" className="text-electric-400 hover:text-electric-300 underline">
                  NashHotFilter article
                </Link>
                .
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">3.5 Deep Reinforcement Learning (DRL)</h3>
              <p>
                The DRL model frames number selection as a sequential decision problem: an agent picks
                numbers one at a time, receiving a reward signal based on how close the prediction was
                to the actual draw result (measured via error/distance metrics stored in the database
                after each draw). Over time, the agent's policy shifts based on what combination of
                features and selections has historically produced lower error distances.
              </p>
              <p>
                This creates an adaptive model that can update its strategy as new prediction-vs-result
                data accumulates, unlike the static ML models above. The DRL model uses a warm-start
                weight file to avoid retraining from scratch with each new data batch. Learn more in
                the{' '}
                <Link to="/blog/deep-reinforcement-learning" className="text-electric-400 hover:text-electric-300 underline">
                  deep reinforcement learning article
                </Link>
                .
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">3.6 Miro — LLM Synthesis Layer</h3>
              <p>
                Miro is a multi-step large language model (LLM) pipeline that synthesises output from
                all five numeric models above into a final six-number recommendation. The LLM receives
                a structured context bundle containing: each model's candidate numbers, confidence
                scores, feature summaries, error distance history, and the current statistical state
                of the game (hot/cold numbers, top pairs, transition highlights).
              </p>
              <p>
                Rather than generating numbers from raw intuition, Miro performs a structured
                deliberation: it reasons through model agreement, flags outliers, applies responsible
                range checks (no duplicate numbers, all numbers within the pool), and outputs a final
                synthesised line with a brief reasoning trace. The Miro layer is separated from the
                numeric models in the UI to make clear that it is an integrative perspective, not a
                seventh independent model.
              </p>
            </div>
          </div>
        </section>

        {/* Ensemble Comparison */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-ensemble">
          <h2 id="method-ensemble" className="text-xl font-semibold text-white">4. Ensemble Comparison and the Council Panel</h2>
          <p>
            After all six models produce their candidate lines, the <strong className="text-slate-200">Council Panel</strong>{' '}
            in the BayanWin UI displays them side by side. Numbers that appear in multiple model outputs
            are highlighted as "agreement" picks — not because agreement guarantees correctness, but
            because it reveals where different modelling assumptions converge.
          </p>
          <p>
            This comparative view is intentional: users who study the distribution of agreement and
            disagreement across models gain a more nuanced understanding of the data than users who
            follow a single "system." The ensemble design discourages over-reliance on any one output.
          </p>
        </section>

        {/* Error Distance */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-error">
          <h2 id="method-error" className="text-xl font-semibold text-white">5. Error Distance Analysis and Feedback</h2>
          <p>
            After each draw, BayanWin stores the distance between each model's prediction and the actual
            result. "Distance" here refers to metrics like the number of matching numbers, sum difference,
            and positional offset — not a single binary win/loss indicator. The{' '}
            <strong className="text-slate-200">Error Distance Analysis</strong> dashboard visualises this
            history per model, allowing users to see which models have been consistently closer (on
            average) and which have been more variable.
          </p>
          <p>
            This feedback loop also feeds the DRL model's reward signal, meaning the DRL agent
            can genuinely improve over time on the metric it is optimised for — minimising prediction
            distance. It does not, however, change the fundamental randomness of the underlying draw.
          </p>
        </section>

        {/* Update Cadence */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-cadence">
          <h2 id="method-cadence" className="text-xl font-semibold text-white">6. Update Cadence and Data Freshness</h2>
          <p>
            PCSO holds draws on specific days per week for each game. BayanWin's scheduler polls for
            new results every 20–30 minutes during draw days, so new results typically appear within
            one to two polling cycles of the official draw time. During non-draw periods, the
            background job runs at a lower cadence to conserve resources.
          </p>
          <p>
            If a sync is delayed (e.g. due to a source feed interruption), dashboards will display the
            most recently ingested data with a timestamp indicating the last update. Users can also
            trigger a manual sync by selecting a game on the homepage, which forces an on-demand
            ingestion before the dashboards load.
          </p>
        </section>

        {/* Limitations */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300" aria-labelledby="method-limits">
          <h2 id="method-limits" className="text-xl font-semibold text-white">7. Limitations and Responsible Interpretation</h2>
          <div className="rounded-lg bg-amber-950/25 border border-amber-500/20 px-4 py-4 space-y-2 text-amber-100/85 text-xs">
            <p>
              <strong className="text-amber-200">Critical limitation:</strong> PCSO lottery draws are
              certified random processes. No statistical model — however sophisticated — can predict the
              outcome of a certified random draw. The patterns BayanWin surfaces are historical regularities
              in a finite dataset, not evidence of exploitable structure in future draws.
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong className="text-slate-200">Randomness is not negotiable</strong> — each PCSO draw
              is conducted under certified random procedures. Past frequency, gaps, and transitions do not
              create obligations for future draws. Every number in the pool has equal probability of being
              drawn on any given occasion.
            </li>
            <li>
              <strong className="text-slate-200">Small sample sizes for some models</strong> — some feature
              relationships require large historical windows to be meaningful. Games with shorter draw
              histories (fewer data points) will produce less reliable model outputs.
            </li>
            <li>
              <strong className="text-slate-200">Model drift</strong> — the XGBoost and DRL models are
              trained on historical data and may not adapt instantly to structural changes (e.g. if PCSO
              modifies a game's number pool or draw frequency).
            </li>
            <li>
              <strong className="text-slate-200">Data quality variability</strong> — draw history data
              is sourced from curated records and may occasionally contain transcription errors. Users
              who notice inconsistencies are encouraged to{' '}
              <Link to="/contact" className="text-electric-400 hover:text-electric-300 underline">
                contact us
              </Link>{' '}
              with the specific draw date and game.
            </li>
            <li>
              <strong className="text-slate-200">Interpretation risk</strong> — a model output that
              closely matches a past draw does not imply it will be accurate for future draws. Always
              read the error distance history to calibrate expectations before acting on any output.
            </li>
          </ul>
        </section>

        {/* FAQ */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-300 border-t border-slate-600/50 pt-6" aria-labelledby="method-faq">
          <h2 id="method-faq" className="text-xl font-semibold text-white">Frequently Asked Questions</h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-slate-200">How often are models retrained?</h3>
              <p className="text-slate-400 mt-1">
                XGBoost and Decision Tree models are retrained periodically as new draw data accumulates.
                The DRL model updates incrementally via its reward feedback loop after each new draw is
                recorded. The Markov transition matrix is recomputed whenever new data is ingested.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Why do different models give different numbers?</h3>
              <p className="text-slate-400 mt-1">
                Each model encodes different assumptions and uses different feature subsets or learning
                mechanisms. Disagreement is expected and healthy — it reflects genuine uncertainty in the
                data rather than a bug. The ensemble approach is specifically designed to surface this
                diversity so users can see it clearly.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Can these models predict the jackpot?</h3>
              <p className="text-slate-400 mt-1">
                No. Jackpot prediction would require predicting all six numbers in the correct combination
                from a pool of 42–58 numbers. The probability of a single ticket matching all six numbers
                ranges from approximately 1 in 5 million (6/42) to 1 in 40.5 million (6/58). No
                algorithmic model can reliably overcome these odds; the draws are random.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">What does the error distance metric mean?</h3>
              <p className="text-slate-400 mt-1">
                Error distance measures how many of a model's predicted numbers matched the actual draw,
                and by how much the non-matching numbers differed numerically. A lower average error
                distance over many draws indicates a model that has been relatively closer to actual
                results — but this is a historical measure, not a guarantee of future performance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Is BayanWin affiliated with PCSO?</h3>
              <p className="text-slate-400 mt-1">
                No. BayanWin is a fully independent informational and analytical platform. It is not
                affiliated with, endorsed by, or operated by the Philippine Charity Sweepstakes Office
                or any government agency. For official results and ticket purchases, always use authorised
                PCSO channels.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-600/50 pt-5 text-sm text-slate-400 space-y-2">
          <p>
            For deeper reading on individual methods, visit the{' '}
            <Link to="/blog" className="text-electric-400 hover:text-electric-300 underline">
              BayanWin Blog
            </Link>
            . For responsible use guidance, see the{' '}
            <Link to="/responsible-play" className="text-electric-400 hover:text-electric-300 underline">
              Responsible Play
            </Link>{' '}
            page. To report data issues or ask questions, use the{' '}
            <Link to="/contact" className="text-electric-400 hover:text-electric-300 underline">
              Contact
            </Link>{' '}
            page.
          </p>
        </section>
      </article>
    </main>
  );
}

export default Methodology;
