import React from 'react';
import PredictionCard from './PredictionCard';

const PredictionDisplay = ({ predictions, loading }) => {
  if (loading) {
    return (
      <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-gradient-to-r from-charcoal-700 to-charcoal-600 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!predictions || Object.keys(predictions).length === 0) {
    return (
      <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-8 text-center border-2 border-electric-500/30">
        <div className="text-electric-500 text-5xl mb-4">🎯</div>
        <p className="text-electric-300 text-lg font-medium">No predictions available.</p>
        <p className="text-silver-400 text-sm mt-2">Generate predictions to see results.</p>
      </div>
    );
  }

  const modelOrder = ['XGBoost', 'DecisionTree', 'MarkovChain', 'AnomalyDetection', 'DRL'];

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-electric-400 mb-6 flex items-center">
        <span className="w-1 h-8 bg-orange-500 rounded-full mr-3 tech-glow"></span>
        ML Model Predictions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {modelOrder.map((modelName) => {
          const prediction = predictions[modelName];
          if (!prediction || prediction.error) {
            return (
              <div key={modelName} className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-red-500/30">
                <h3 className="text-lg font-bold text-electric-300 mb-2">{modelName}</h3>
                <p className="text-sm text-red-400">{prediction?.error || 'No prediction available'}</p>
              </div>
            );
          }

          return (
            <PredictionCard
              key={modelName}
              modelName={modelName}
              numbers={prediction.numbers}
              previousPredictions={prediction.previous_predictions}
              predictionId={prediction.prediction_id}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PredictionDisplay;

