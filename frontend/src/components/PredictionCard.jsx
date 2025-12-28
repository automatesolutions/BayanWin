import React, { useState } from 'react';
import NumberBall from './NumberBall';

const PredictionCard = ({ modelName, numbers, previousPredictions, predictionId }) => {
  const [showPrevious, setShowPrevious] = useState(false);

  const modelDescriptions = {
    XGBoost: 'Gradient boosting model using historical patterns',
    DecisionTree: 'Random Forest classifier based on frequency analysis',
    MarkovChain: 'State transition model for sequence prediction',
    AnomalyDetection: 'Gaussian distribution anomaly detection',
    DRL: 'Deep Reinforcement Learning with 3 feedback loops'
  };

  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 hover:shadow-electric transition-all border-2 border-electric-500/30 transform hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-electric-300 flex items-center">
          <span className="w-2 h-2 bg-electric-500 rounded-full mr-2 tech-glow"></span>
          {modelName}
        </h3>
        <span className="text-xs text-silver-400 font-mono">#{predictionId}</span>
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

