import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import GameSelector from './components/GameSelector';
import PredictionDisplay from './components/PredictionDisplay';
import ScraperControl from './components/ScraperControl';
import HistoricalResults from './components/HistoricalResults';
import StatisticsPanel from './components/StatisticsPanel';
import ErrorDistanceAnalysis from './components/ErrorDistanceAnalysis';
import { generatePredictions } from './services/api';

function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGameSelect = (gameType) => {
    setSelectedGame(gameType);
    setPredictions(null);
  };

  const handleGeneratePredictions = async () => {
    if (!selectedGame) return;

    setLoading(true);
    try {
      const response = await generatePredictions(selectedGame);
      setPredictions(response.data.predictions);
    } catch (error) {
      console.error('Error generating predictions:', error);
      alert('Failed to generate predictions: ' + (error.response?.data?.error || error.message));
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                  <HistoricalResults gameType={selectedGame} />
                  <StatisticsPanel gameType={selectedGame} />
                  <ErrorDistanceAnalysis gameType={selectedGame} />
                </div>

                <div>
                  <ScraperControl />
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

