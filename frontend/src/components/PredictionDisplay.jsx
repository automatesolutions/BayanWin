import React from 'react';
import PredictionCard from './PredictionCard';

const PredictionDisplay = ({ predictions, loading }) => {
  if (loading && (!predictions || Object.keys(predictions).length === 0)) {
    // Initial loading - show all models as "Learning..."
    const modelOrder = ['XGBoost', 'DecisionTree', 'MarkovChain', 'AnomalyDetection', 'DRL'];
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-electric-400 mb-6 flex items-center">
          <span className="w-1 h-8 bg-orange-500 rounded-full mr-3 tech-glow"></span>
          ML Model Predictions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {modelOrder.map((modelName) => (
            <PredictionCard
              key={modelName}
              modelName={modelName}
              loading={true}
            />
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
          
          // Pass error state to PredictionCard
          if (prediction?.error) {
            return (
              <PredictionCard
                key={modelName}
                modelName={modelName}
                error={prediction.error}
              />
            );
          }
          
          // Pass success state to PredictionCard
          if (prediction) {
            return (
              <PredictionCard
                key={modelName}
                modelName={modelName}
                numbers={prediction.numbers}
                previousPredictions={prediction.previous_predictions}
                predictionId={prediction.prediction_id}
              />
            );
          }
          
          // Loading or missing state
          return (
            <PredictionCard
              key={modelName}
              modelName={modelName}
              loading={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PredictionDisplay;

