import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import GameSelector from './components/GameSelector';
import PredictionDisplay from './components/PredictionDisplay';
import HistoricalResults from './components/HistoricalResults';
import StatisticsPanel from './components/StatisticsPanel';
import ErrorDistanceAnalysis from './components/ErrorDistanceAnalysis';
import { generatePredictions, scrapeData } from './services/api';

function App() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

  const handleGameSelect = async (gameType) => {
    setSelectedGame(gameType);
    setPredictions(null);
    
    // Auto-scrape for new data when game is selected
    setScraping(true);
    try {
      console.log(`Auto-scraping new data for ${gameType}...`);
      await scrapeData({ game_type: gameType });
      console.log(`Auto-scraping completed for ${gameType}`);
    } catch (error) {
      console.warn('Auto-scrape skipped or failed:', error.response?.data?.detail || error.message);
      // Don't show error to user - scraping is optional background task
    } finally {
      setScraping(false);
    }
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
            autoScraping={scraping}
          />

          {selectedGame && (
            <>
              <PredictionDisplay predictions={predictions} loading={loading} />

              <div className="space-y-6 mt-6">
                <HistoricalResults gameType={selectedGame} key={`${selectedGame}-${scraping}`} />
                
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

