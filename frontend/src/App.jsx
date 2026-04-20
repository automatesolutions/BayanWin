import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import GameSelector from './components/GameSelector';
import PredictionDisplay from './components/PredictionDisplay';
import LatestResults from './components/LatestResults';
import StatisticsPanel from './components/StatisticsPanel';
import ErrorDistanceAnalysis from './components/ErrorDistanceAnalysis';
import CooccurrenceGraph from './components/CooccurrenceGraph';
import MarkovGraph from './components/MarkovGraph';
import CouncilPanel from './components/CouncilPanel';
import { generatePredictionsStream, scrapeData } from './services/api';

function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultsRefresh, setResultsRefresh] = useState(0);

  const handleGameSelect = (gameType) => {
    setSelectedGame(gameType);
    setPredictions(null);
    // One refresh: load whatever is already in the DB for this game
    setResultsRefresh((n) => n + 1);
    scrapeData({ game_type: gameType })
      .then((res) => {
        const summary = res.data?.stats?.summary;
        const sheetsAdded = Number(summary?.total_added ?? 0);
        const apifyAdded = Number(res.data?.apify_ingest?.total_added ?? 0);
        // Second refresh only when ingest actually wrote rows (avoids duplicate GETs)
        if (sheetsAdded + apifyAdded > 0) {
          setResultsRefresh((n) => n + 1);
        }
      })
      .catch((error) => {
        console.error('Sheet ingest failed:', error.response?.data?.detail || error.message);
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
    <div className="min-h-screen flex flex-col bg-charcoal-900">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1">
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

      <Footer />
    </div>
  );
}

export default App;
