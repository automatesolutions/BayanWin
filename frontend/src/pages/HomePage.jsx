import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GameSelector from '../components/GameSelector';
import PredictionDisplay from '../components/PredictionDisplay';
import LatestResults from '../components/LatestResults';
import StatisticsPanel from '../components/StatisticsPanel';
import ErrorDistanceAnalysis from '../components/ErrorDistanceAnalysis';
import CooccurrenceGraph from '../components/CooccurrenceGraph';
import MarkovGraph from '../components/MarkovGraph';
import CouncilPanel from '../components/CouncilPanel';
import { generatePredictionsStream, scrapeData } from '../services/api';

function HomePage() {
  useEffect(() => {
    document.title = 'BayanWin - Algorithmic Lottery Prediction Philippines | PCSO Analysis';
  }, []);

  const [selectedGame, setSelectedGame] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultsRefresh, setResultsRefresh] = useState(0);

  const handleGameSelect = (gameType) => {
    setSelectedGame(gameType);
    setPredictions(null);
    setResultsRefresh((n) => n + 1);
    scrapeData({ game_type: gameType })
      .then(() => {
        setResultsRefresh((n) => n + 1);
      })
      .catch((error) => {
        const detail = error.response?.data?.detail;
        const msg =
          typeof detail === 'string'
            ? detail
            : error.response?.data?.message || error.message;
        console.error('Sheet ingest failed:', msg);
        window.alert(
          `Could not sync data from Google Sheets to InstantDB.\n\n${msg}\n\n` +
            'On Cloud Run, set GOOGLE_SERVICE_ACCOUNT_JSON (service account JSON) or make sheets public, ' +
            'and ensure INSTANTDB_APP_ID / INSTANTDB_ADMIN_TOKEN are correct.'
        );
      });
  };

  const handleGeneratePredictions = async () => {
    if (!selectedGame) return;

    setLoading(true);
    setPredictions({});
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
            alert('Prediction failed: ' + (msg.detail || 'Unknown error'));
          }
        },
      });
    } catch (error) {
      console.error('Error generating predictions:', error);
      alert('Failed to generate predictions: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 flex-1">

      {/* ── Hero / introductory content section ── */}
      <section className="mb-10 space-y-8" aria-labelledby="hero-heading">
        <header className="space-y-3">
          <h1 id="hero-heading" className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            BayanWin: Algorithmic Lottery Prediction Philippines
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            BayanWin is a free analytical dashboard for Philippine PCSO lottery draws. We collect years of
            official draw history for <strong className="text-slate-200">6/42, 6/45, 6/49, 6/55, and 6/58</strong> and run
            them through multiple statistical and machine-learning models — Markov chains, game-theoretic filters,
            deep reinforcement learning, XGBoost, anomaly detection, and an LLM synthesis layer — so you can study
            historical patterns and understand the <em>behaviour</em> of each game over time.
          </p>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            Our goal is transparency and education. Every model output comes with visible reasoning and links to
            methodology explanations, so you can evaluate the tools yourself rather than just trusting a black box.
            We do not claim guaranteed wins — no legitimate analysis tool can — but we do offer a richer view of
            PCSO history than a simple results table.
          </p>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            Whether you are a data enthusiast curious about probability, a student studying stochastic models, or
            a lottery player who wants to understand the numbers more deeply, BayanWin gives you interactive charts,
            co-occurrence graphs, Markov transition maps, and an ensemble of predictions to explore — all in one place,
            updated regularly from PCSO draw history.
          </p>
        </header>

        {/* How It Works */}
        <div className="rounded-xl border border-slate-600/50 bg-slate-800/40 px-5 py-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">How BayanWin Works</h2>
          <ol className="space-y-3 text-sm text-slate-300 leading-relaxed list-none">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-electric-500/20 border border-electric-500/40 text-electric-300 text-xs font-bold flex items-center justify-center">1</span>
              <span><strong className="text-slate-200">Select a PCSO game</strong> — choose from the five supported draws below. The app fetches the latest results and historical data from our database, which is regularly synced from curated PCSO sources.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-electric-500/20 border border-electric-500/40 text-electric-300 text-xs font-bold flex items-center justify-center">2</span>
              <span><strong className="text-slate-200">Explore the dashboards</strong> — view frequency statistics, overdue numbers, co-occurrence pairs, and Markov transition graphs. Each visualisation is interactive and based on the full historical window for that game.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-electric-500/20 border border-electric-500/40 text-electric-300 text-xs font-bold flex items-center justify-center">3</span>
              <span><strong className="text-slate-200">Generate algorithmic predictions</strong> — click the prediction button to run all analytical models simultaneously. Results stream in as each model (XGBoost, Decision Tree, Markov, NashHotFilter, Deep RL, and Miro LLM synthesis) completes its computation.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-electric-500/20 border border-electric-500/40 text-electric-300 text-xs font-bold flex items-center justify-center">4</span>
              <span><strong className="text-slate-200">Compare and learn</strong> — review the Council Panel for model agreement, then check the Error Distance Analysis to see how past predictions compared with actual draw outcomes. Use this to understand each model's strengths and blind spots.</span>
            </li>
          </ol>
        </div>

        {/* Supported Games */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Supported PCSO Lottery Games</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              { name: 'Lotto 6/42', tag: '6/42', desc: 'The most accessible PCSO game with 42 balls. Lower jackpots but the best odds among the six-ball draws — draws are held three times a week.' },
              { name: 'Mega Lotto 6/45', tag: '6/45', desc: 'Mid-tier six-ball draw with 45 numbers. Jackpots start at ₱9 million and roll over until someone wins the six-number combination.' },
              { name: 'Super Lotto 6/49', tag: '6/49', desc: 'A popular Philippine lottery game with 49 numbers and a ₱16 million minimum jackpot. Draws are held three times per week.' },
              { name: 'Grand Lotto 6/55', tag: '6/55', desc: 'One of the biggest PCSO jackpot games, with 55 numbers. Jackpots frequently climb into the hundreds of millions of pesos.' },
              { name: 'Ultra Lotto 6/58', tag: '6/58', desc: 'The largest PCSO jackpot game with 58 balls. Historic jackpots have exceeded ₱1 billion, making it the most-watched draw in the Philippines.' },
            ].map((game) => (
              <div key={game.tag} className="rounded-lg border border-slate-600/50 bg-slate-800/30 px-4 py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-electric-500/20 text-electric-300 px-2 py-0.5 rounded border border-electric-500/30">{game.tag}</span>
                  <span className="font-semibold text-white">{game.name}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{game.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Analytical Methods */}
        <div className="rounded-xl border border-slate-600/50 bg-slate-800/40 px-5 py-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Our Analytical Methods</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            BayanWin uses an ensemble approach — multiple independent algorithms that each model lottery history
            differently. Comparing their outputs reveals where they agree (higher confidence for exploration) and
            where they diverge (a signal to be cautious). No single model is claimed to be superior.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { name: 'Markov Chains', desc: 'Treats consecutive draws as a sequence and models transition probabilities between states — capturing how draw outcomes relate to preceding results over the historical window.' },
              { name: 'Nash Equilibrium Filter', desc: 'Inspired by game-theoretic equilibrium concepts, NashHotFilter balances hot-number pressure with stability heuristics to produce structured candidate lines.' },
              { name: 'Deep Reinforcement Learning', desc: 'An adaptive agent model that updates its strategy based on prediction-vs-result feedback stored in the database, shifting behaviour as more data accumulates.' },
              { name: 'XGBoost & Decision Trees', desc: 'Gradient-boosted and tree-based models trained on tabular features derived from draw history — strong at detecting non-linear relationships in structured numerical inputs.' },
              { name: 'Anomaly Detection', desc: 'Monte Carlo and distribution-style analysis that highlights unusual number combinations or statistical outliers relative to historical baseline ranges.' },
              { name: 'Miro — LLM Synthesis', desc: 'A multi-step large language model workflow that reads the full context bundle from all numeric models and synthesises a final six-number line with validation.' },
            ].map((m) => (
              <div key={m.name} className="rounded-lg bg-slate-900/50 border border-slate-700/40 px-4 py-3 space-y-1">
                <h3 className="font-semibold text-white text-sm">{m.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Read longer explanations in the{' '}
            <Link to="/blog/markov-chains-lottery" className="text-electric-400 hover:text-electric-300 underline">Markov chains guide</Link>,{' '}
            <Link to="/blog/nash-hotfilter" className="text-electric-400 hover:text-electric-300 underline">NashHotFilter article</Link>, and{' '}
            <Link to="/blog/deep-reinforcement-learning" className="text-electric-400 hover:text-electric-300 underline">Deep RL overview</Link> on the blog.
          </p>
        </div>

        {/* Disclaimer + links */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-4 py-4 text-xs text-amber-100/80 space-y-1">
          <p>
            <strong className="text-amber-200">Important:</strong> BayanWin is for education and entertainment only.
            Lottery outcomes are random; historical patterns do not guarantee future results.
            There are <strong className="text-amber-200">no guaranteed wins</strong>. Play responsibly and only within your means.
            This site is not affiliated with or endorsed by PCSO or any government agency.
          </p>
          <p>
            <Link to="/responsible-play" className="text-amber-400 hover:text-amber-300 underline">Responsible Play</Link>
            {' · '}
            <Link to="/about" className="text-amber-400 hover:text-amber-300 underline">About BayanWin</Link>
            {' · '}
            <Link to="/methodology" className="text-amber-400 hover:text-amber-300 underline">Methodology</Link>
            {' · '}
            <Link to="/blog" className="text-amber-400 hover:text-amber-300 underline">Blog</Link>
          </p>
        </div>
      </section>

      {/* ── Interactive tool ── */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-1">Try the prediction tool</h2>
        <p className="text-slate-400 text-sm max-w-3xl mb-4">
          Select a game below to view results, statistics, and run algorithmic predictions.{' '}
          <Link to="/about" className="text-electric-400 hover:text-electric-300 underline">
            About BayanWin
          </Link>{' '}
          explains how the models and dashboards work. The{' '}
          <Link to="/blog" className="text-electric-400 hover:text-electric-300 underline">
            Blog
          </Link>{' '}
          has longer articles (e.g. NashHotFilter &amp; <em>A Beautiful Mind</em>).
        </p>
      </div>

      <GameSelector
        selectedGame={selectedGame}
        onGameSelect={handleGameSelect}
        onGeneratePredictions={handleGeneratePredictions}
      />

      {selectedGame && (
        <>
          <PredictionDisplay predictions={predictions} loading={loading} />

          <CouncilPanel gameType={selectedGame} />

          <div className="space-y-6 mt-6">
            <LatestResults
              key={selectedGame}
              gameType={selectedGame}
              refreshKey={resultsRefresh}
              onSheetSynced={() => setResultsRefresh((n) => n + 1)}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <CooccurrenceGraph gameType={selectedGame} />
              <MarkovGraph gameType={selectedGame} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatisticsPanel gameType={selectedGame} />
              <ErrorDistanceAnalysis gameType={selectedGame} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default HomePage;
