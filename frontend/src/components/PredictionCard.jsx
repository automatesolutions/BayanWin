import React, { useState } from 'react';
import NumberBall from './NumberBall';

const PredictionCard = ({ modelName, numbers, previousPredictions, predictionId, error, loading }) => {
  const [showPrevious, setShowPrevious] = useState(false);

  const modelDescriptions = {
    XGBoost: 'Gradient boosting model using historical patterns',
    DecisionTree: 'Random Forest classifier based on frequency analysis',
    MarkovChain: 'State transition model for sequence prediction',
    AnomalyDetection: 'Normal Distribution - highest probability patterns',
    DRL: 'Deep Reinforcement Learning with 3 feedback loops'
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-silver-600/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-silver-400 flex items-center">
            <span className="w-2 h-2 bg-silver-500 rounded-full mr-2 animate-pulse"></span>
            {modelName}
          </h3>
        </div>
        <p className="text-sm text-silver-400 mb-4">
          {modelDescriptions[modelName] || 'ML-based prediction model'}
        </p>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-electric-500 mb-3"></div>
          <span className="text-electric-400 font-semibold text-lg animate-pulse">Learning...</span>
          <span className="text-silver-400 text-sm mt-2">Analyzing patterns</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-red-500/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-400 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            {modelName}
          </h3>
          <span className="text-xs text-red-400 font-mono">ERROR</span>
        </div>
        <p className="text-sm text-silver-300 mb-4">
          {modelDescriptions[modelName] || 'ML-based prediction model'}
        </p>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-300 font-mono">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 hover:shadow-electric transition-all border-2 border-electric-500/30 transform hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-electric-300 flex items-center">
          <span className="w-2 h-2 bg-electric-500 rounded-full mr-2 tech-glow"></span>
          {modelName}
        </h3>
      </div>

      <p className="text-sm text-silver-300 mb-4 leading-relaxed">
        {modelDescriptions[modelName] || 'ML-based prediction model'}
      </p>

      <div className="flex flex-wrap gap-2 justify-center mb-4 p-4 bg-gradient-to-br from-charcoal-700/50 to-charcoal-600/30 rounded-lg border border-silver-600/20">
        {numbers && numbers.map((num, idx) => (
          <NumberBall key={idx} number={num} size="md" />
        ))}
      </div>

      {previousPredictions && previousPredictions.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowPrevious(!showPrevious)}
            className="text-sm text-electric-400 hover:text-electric-300 font-semibold transition-colors"
          >
            {showPrevious ? '▼ Hide' : '▶ Show'} Previous Predictions ({previousPredictions.length})
          </button>

          {showPrevious && (
            <div className="mt-3 space-y-2">
              {previousPredictions.map((prevNums, idx) => (
                prevNums && (
                  <div key={idx} className="flex flex-wrap gap-1 justify-center">
                    {prevNums.map((num, numIdx) => (
                      <NumberBall key={numIdx} number={num} size="sm" />
                    ))}
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionCard;

