import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TbArrowDown, TbArrowRight, TbAlertTriangle } from 'react-icons/tb';
import GameSelector from '../components/GameSelector';
import PredictionDisplay from '../components/PredictionDisplay';
import LatestResults from '../components/LatestResults';
import LatestDrawsBoard from '../components/LatestDrawsBoard';
import TicketChecker from '../components/TicketChecker';
import PipelineDiagram from '../components/PipelineDiagram';
import StatisticsPanel from '../components/StatisticsPanel';
import ErrorDistanceAnalysis from '../components/ErrorDistanceAnalysis';
import CooccurrenceGraph from '../components/CooccurrenceGraph';
import MarkovGraph from '../components/MarkovGraph';
import CouncilPanel from '../components/CouncilPanel';
import ParticleReveal from '../components/canvasui/ParticleReveal';
import Notice from '../components/ui/Notice';
import Reveal from '../components/ui/Reveal';
import ScrollWords from '../components/motion/ScrollWords';
import { scrollToElement } from '../components/motion/SmoothScroll';
import { gsap, SplitText, ScrollTrigger, EASE, MOTION_OK, DESKTOP_MOTION } from '../components/motion/gsap';
import { GAMES, GAME_ORDER } from '../utils/constants';
import { drawDaysLabel } from '../utils/drawSchedule';
import { generatePredictionsStream, scrapeData } from '../services/api';

const errorText = (error) => {
  const detail = error?.response?.data?.detail;
  return typeof detail === 'string' ? detail : error?.response?.data?.message || error?.message || 'Unknown error';
};

const combinations = (n, k) => {
  let r = 1;
  for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
  return Math.round(r);
};

const GAME_NOTES = {
  lotto_6_42: 'The most accessible PCSO game with 42 balls. Lower jackpots but the best odds among the six-ball draws.',
  mega_lotto_6_45: 'Mid-tier six-ball draw with 45 numbers. Jackpots start at ₱9 million and roll over until someone matches all six.',
  super_lotto_6_49: 'A popular game with 49 numbers and a ₱16 million minimum jackpot.',
  grand_lotto_6_55: 'One of the biggest PCSO jackpot games, with 55 numbers. Jackpots often climb into the hundreds of millions of pesos.',
  ultra_lotto_6_58: 'The largest PCSO jackpot game with 58 balls. Historic jackpots have passed ₱1 billion, making it the most-watched draw in the Philippines.',
};

const METHODS = [
  ['Markov chains', 'Treats consecutive draws as a sequence and models transition probabilities between states: how outcomes relate to the draws before them.', '/blog/markov-chains-lottery'],
  ['NashHotFilter', 'Borrows from game theory. It balances hot-number pressure against stability rules to produce structured candidate lines.', '/blog/nash-hotfilter'],
  ['Deep reinforcement learning', 'An agent that updates its strategy from prediction-vs-result feedback stored in the database, shifting as more data comes in.', '/blog/deep-reinforcement-learning'],
  ['XGBoost and Random Forest', 'Gradient-boosted and tree-based models trained on features derived from draw history. Good at finding non-linear relationships.', null],
  ['Normal distribution', 'Monte Carlo and distribution analysis that flags unusual combinations or outliers against historical baselines.', null],
  ['Miro synthesis', 'A multi-step language model workflow that reads the output of every numeric model and writes one final line, with validation.', '/blog/miro-prediction'],
];

function HomePage() {
  useEffect(() => {
    document.title = 'BayanWin - Algorithmic Lottery Prediction Philippines | PCSO Analysis';
  }, []);

  const [selectedGame, setSelectedGame] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultsRefresh, setResultsRefresh] = useState(0);
  const [syncError, setSyncError] = useState(null);
  const [runError, setRunError] = useState(null);
  const heroRef = useRef(null);
  const headingRef = useRef(null);
  const toolRef = useRef(null);
  const dashboardRef = useRef(null);

  // One authored moment: the headline rises line by line on load, then the hero
  // pins while the dashboard slides over it (desktop only).
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const split = SplitText.create(headingRef.current, { type: 'lines', mask: 'lines', aria: 'auto' });
      gsap.from(split.lines, { yPercent: 105, duration: 1.2, ease: EASE, stagger: 0.09, delay: 0.1 });
      return () => split.revert();
    });
    mm.add(DESKTOP_MOTION, () => {
      const hero = heroRef.current;
      ScrollTrigger.create({ trigger: hero, start: 'top top+=64', end: 'bottom top+=64', pin: true, pinSpacing: false });
      gsap.to(hero.querySelector('[data-hero-inner]'), {
        scale: 0.96,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top+=64', end: 'bottom top+=64', scrub: true },
      });
    });
    return () => mm.revert();
  }, []);

  const handleGameSelect = (gameType) => {
    setSelectedGame(gameType);
    setPredictions(null);
    setSyncError(null);
    setRunError(null);
    setResultsRefresh((n) => n + 1);
    scrapeData({ game_type: gameType })
      .then(() => setResultsRefresh((n) => n + 1))
      .catch((error) => {
        const msg = errorText(error);
        console.error('Sheet ingest failed:', msg);
        setSyncError(msg);
      });
  };

  const analyzeFromBoard = (gameType) => {
    handleGameSelect(gameType);
    scrollToElement(toolRef.current);
  };

  // Dashboard height changes as panels load; keep ScrollTrigger positions true.
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => clearTimeout(id);
  }, [selectedGame]);

  const handleGeneratePredictions = async () => {
    if (!selectedGame) return;
    setLoading(true);
    setRunError(null);
    setPredictions({});
    scrollToElement(dashboardRef.current);
    try {
      await generatePredictionsStream(selectedGame, {
        onEvent: (msg) => {
          if (msg.event === 'model' && msg.predictions) {
            setPredictions((prev) => ({ ...(prev || {}), ...msg.predictions }));
          }
          if (msg.event === 'done' && msg.predictions) {
            setPredictions(msg.predictions);
          }
          if (msg.event === 'error') {
            setRunError(msg.detail || 'Unknown error');
          }
        },
      });
    } catch (error) {
      console.error('Error generating predictions:', error);
      setRunError(errorText(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main" className="flex-1">
      {/* ── Screen 1: results first ── */}
      <section ref={heroRef} className="relative bg-charcoal-900" aria-labelledby="hero-heading">
        <div data-hero-inner className="container mx-auto grid items-center gap-10 px-4 py-12 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-16">
          <div>
            <ParticleReveal radius={420} background="#0C1119" scatter={18} aberration={18}>
              <h1
                id="hero-heading"
                ref={headingRef}
                className="max-w-xl text-4xl font-semibold leading-[1.05] text-white sm:text-5xl xl:text-6xl"
              >
                PCSO lotto results and the numbers behind them
              </h1>
            </ParticleReveal>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-silver-300">
              Every 6/42 to 6/58 draw, run through seven statistical models. Free to use, and honest about the odds.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#tool"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToElement(toolRef.current);
                }}
                className="btn-primary btn-lg"
              >
                Analyze a game
                <TbArrowDown aria-hidden />
              </a>
              <Link to="/methodology" className="btn-secondary btn-lg">
                How the models work
              </Link>
            </div>
            <p className="mt-6 text-sm text-silver-500">No sign-up. Results sync from PCSO draws every 90 seconds.</p>
          </div>

          <LatestDrawsBoard onAnalyze={analyzeFromBoard} />
        </div>
      </section>

      {/* Everything below slides over the pinned hero. */}
      <div className="relative z-10 bg-charcoal-900 shadow-[0_-24px_48px_-24px_rgba(0,0,0,0.8)]">
        {/* ── Screen 2: the tool ── */}
        <section
          id="tool"
          ref={toolRef}
          className="container mx-auto space-y-6 border-t border-white/[0.06] px-4 py-14 sm:px-6 sm:py-20"
          aria-labelledby="tool-heading"
        >
          <div className="max-w-2xl space-y-3">
            <h2 id="tool-heading" className="section-title">
              Run seven models on one game
            </h2>
            <p className="lede">
              Pick a game. Each model reads its full draw history and returns one line of six numbers.
            </p>
          </div>

          <GameSelector
            selectedGame={selectedGame}
            onGameSelect={handleGameSelect}
            onGeneratePredictions={handleGeneratePredictions}
            loading={loading}
          />

          {syncError && (
            <Notice tone="warning" title="Couldn't fetch the newest draws" onDismiss={() => setSyncError(null)}>
              <p>You&apos;re seeing the latest results we already have. Try again later.</p>
              <details className="mt-1 text-xs opacity-80">
                <summary className="cursor-pointer">Technical details</summary>
                <p className="mt-1 font-mono">{syncError}</p>
              </details>
            </Notice>
          )}

          {selectedGame && (
            <div ref={dashboardRef} className="space-y-6">
              {runError && (
                <Notice tone="error" title="The model run stopped early" onDismiss={() => setRunError(null)}>
                  {runError}
                </Notice>
              )}

              <PredictionDisplay predictions={predictions} loading={loading} />
              <CouncilPanel gameType={selectedGame} />

              <LatestResults
                key={selectedGame}
                gameType={selectedGame}
                refreshKey={resultsRefresh}
                onSheetSynced={() => setResultsRefresh((n) => n + 1)}
              />
              <TicketChecker key={`ticket-${selectedGame}`} gameType={selectedGame} />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <CooccurrenceGraph gameType={selectedGame} />
                <MarkovGraph gameType={selectedGame} />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <StatisticsPanel gameType={selectedGame} />
                <ErrorDistanceAnalysis gameType={selectedGame} />
              </div>
            </div>
          )}
        </section>

        {/* ── Screen 3: how a pick is made ── */}
        <section className="border-t border-white/[0.06] py-16 sm:py-24" aria-labelledby="pipeline-heading">
          <div className="container mx-auto px-4 sm:px-6">
            <Reveal className="mb-10 max-w-2xl space-y-3">
              <h2 id="pipeline-heading" className="section-title">
                How a pick is made
              </h2>
              <p className="lede">
                Six models work on their own. Miro reads all six, then writes one line and the reasons to doubt it.
              </p>
            </Reveal>
            <PipelineDiagram />
          </div>
        </section>

        {/* ── Screen 4: the honest part ── */}
        <section className="border-t border-white/[0.06] bg-charcoal-950/50 py-20 sm:py-28" aria-labelledby="honest-heading">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 id="honest-heading" className="sr-only">
              What BayanWin can and can&apos;t do
            </h2>
            <ScrollWords className="max-w-4xl font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              A lottery draw is random. No model here can change your odds. What it can do is show how each game has
              behaved, and let you check that for yourself.
            </ScrollWords>
            <Reveal className="mt-14 grid gap-8 text-base leading-relaxed text-silver-300 md:grid-cols-2">
              <p data-reveal className="max-w-prose">
                BayanWin is a free analytics dashboard for Philippine PCSO lottery draws. We collect years of official
                draw history for <strong className="text-white">6/42, 6/45, 6/49, 6/55, and 6/58</strong> and run it
                through statistical and machine-learning models: Markov chains, game-theory filters, deep reinforcement
                learning, XGBoost, anomaly detection, and a language-model synthesis layer.
              </p>
              <p data-reveal className="max-w-prose">
                Every output comes with its reasoning and a link to the methodology, so you can judge the tools instead of
                trusting a black box. Students, data hobbyists, and players get the same interactive charts,
                co-occurrence graphs, Markov transition maps, and model picks.{' '}
                <Link to="/responsible-play" className="link">
                  Play responsibly
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Screen 5: the games ── */}
        <section className="border-t border-white/[0.06] py-16 sm:py-24" aria-labelledby="games-heading">
          <div className="container mx-auto px-4 sm:px-6">
            <Reveal className="mb-8 max-w-2xl space-y-3">
              <h2 id="games-heading" className="section-title">
                Five PCSO games, side by side
              </h2>
              <p className="lede">Every game is pick 6. The more balls, the bigger the jackpot and the longer the odds.</p>
            </Reveal>
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr>
                    <th scope="col">Game</th>
                    <th scope="col" className="text-right">Jackpot odds</th>
                    <th scope="col">Draw days</th>
                    <th scope="col">About</th>
                  </tr>
                </thead>
                <tbody>
                  {GAME_ORDER.map((id) => {
                    const g = GAMES[id];
                    return (
                      <tr key={id}>
                        <th scope="row" className="whitespace-nowrap py-4 pr-6 text-left align-top font-normal">
                          <span className="block font-mono text-base font-semibold text-white tabular">6/{g.maxNumber}</span>
                          <span className="text-sm text-silver-400">{g.name.replace(/\s*6\/\d+$/, '')}</span>
                        </th>
                        <td className="whitespace-nowrap py-4 text-right align-top font-mono tabular">
                          1 in {combinations(g.maxNumber, 6).toLocaleString('en-US')}
                        </td>
                        <td className="whitespace-nowrap py-4 align-top">{drawDaysLabel(g.drawDays)}</td>
                        <td className="max-w-md py-4 align-top text-silver-400">{GAME_NOTES[id]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Screen 6: the models ── */}
        <section className="border-t border-white/[0.06] py-16 sm:py-24" aria-labelledby="methods-heading">
          <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <Reveal className="space-y-3">
              <h2 id="methods-heading" className="section-title">
                The seven models
              </h2>
              <p className="lede">
                Where they agree is worth a look. Where they disagree is a reason for caution. None is the best.
              </p>
              <Link to="/methodology" className="inline-flex items-center gap-1 pt-2 text-sm font-medium text-electric-300 hover:text-electric-200">
                Read the full methodology <TbArrowRight aria-hidden />
              </Link>
            </Reveal>
            <Reveal as="dl" className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {METHODS.map(([name, desc, href]) => (
                <div key={name} data-reveal className="grid gap-1 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <dt className="font-display text-base font-semibold text-white">{name}</dt>
                  <dd className="text-sm leading-relaxed text-silver-400">
                    {desc}{' '}
                    {href && (
                      <Link to={href} className="link whitespace-nowrap">
                        Read more
                      </Link>
                    )}
                  </dd>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Screen 7: disclaimer ── */}
        <section className="container mx-auto px-4 pb-20 sm:px-6" aria-label="Important notice">
          <div className="flex flex-col gap-4 rounded-card border border-amber-400/20 bg-amber-500/[0.05] p-6 sm:flex-row sm:items-start">
            <TbAlertTriangle className="h-6 w-6 shrink-0 text-amber-300" aria-hidden />
            <div className="space-y-3 text-sm leading-relaxed text-amber-50/85">
              <p>
                <strong className="text-amber-100">For education and entertainment only.</strong> Past patterns don&apos;t
                predict future draws, and there are <strong className="text-amber-100">no guaranteed wins</strong>. Play
                only with money you can afford to lose. 18+ only. BayanWin isn&apos;t affiliated with or endorsed by PCSO
                or any government agency.
              </p>
              <Link to="/responsible-play" className="inline-flex items-center gap-1 font-medium text-amber-200 hover:text-amber-100">
                Responsible play <TbArrowRight aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default HomePage;
