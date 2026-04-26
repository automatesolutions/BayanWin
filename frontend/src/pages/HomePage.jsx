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
    document.title = 'BayanWin - PCSO results & AI driven predictions';
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
      <p className="mb-6 text-slate-400 text-sm max-w-3xl">
        Select a game below to view results, statistics, and predictions.{' '}
        <Link to="/about" className="text-electric-400 hover:text-electric-300 underline">
          About BayanWin
        </Link>{' '}
        explains how the models and dashboards work. The{' '}
        <Link to="/blog" className="text-electric-400 hover:text-electric-300 underline">
          Blog
        </Link>{' '}
        has longer articles (e.g. NashHotFilter &amp; <em>A Beautiful Mind</em>).
      </p>

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
