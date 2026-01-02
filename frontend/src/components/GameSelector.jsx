import React from 'react';
import { GAMES } from '../utils/constants';

const GameSelector = ({ selectedGame, onGameSelect, onGeneratePredictions, autoScraping }) => {
  const gameList = Object.values(GAMES);

  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 mb-6 border-2 border-electric-500/30">
      <h2 className="text-2xl font-bold text-electric-400 mb-6 flex items-center">
        <span className="w-1 h-8 bg-electric-500 rounded-full mr-3 tech-glow"></span>
        Select Game
        {autoScraping && (
          <span className="ml-auto text-sm text-orange-400 animate-pulse flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking for new data...
          </span>
        )}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {gameList.map((game) => (
          <button
            key={game.id}
            onClick={() => onGameSelect(game.id)}
            disabled={autoScraping}
            className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
              selectedGame === game.id
                ? 'border-electric-500 bg-gradient-to-br from-electric-900/50 to-electric-800/30 text-electric-300 shadow-electric'
                : 'border-silver-600/50 hover:border-electric-400 bg-charcoal-700/50 hover:bg-charcoal-700 text-silver-300'
            } ${autoScraping ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="font-bold text-lg">{game.name}</div>
            <div className={`text-xs mt-2 font-medium ${
              selectedGame === game.id ? 'text-electric-400' : 'text-silver-400'
            }`}>
              Pick {game.numbersCount} from {game.maxNumber}
            </div>
          </button>
        ))}
      </div>

      {selectedGame && (
        <button
          onClick={onGeneratePredictions}
          className="w-full bg-orange-gradient hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-orange hover:shadow-tech-lg transition-all transform hover:scale-[1.02] text-lg border-2 border-orange-400/50"
        >
          ⚡ Generate Predictions
        </button>
      )}
    </div>
  );
};

export default GameSelector;

