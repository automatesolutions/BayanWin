import React from 'react';
import PredictionCard from './PredictionCard';

/** Six ML predictors; Miro (meta) shown below for clearer layout */
const CORE_MODELS = [
  'XGBoost',
  'DecisionTree',
  'MarkovChain',
  'AnomalyDetection',
  'NashHotFilter',
  'DRL',
];
const MIRO_MODEL = 'Miro';

const PredictionDisplay = ({ predictions, loading }) => {
  const renderOneCard = (modelName) => {
    if (loading && (!predictions || Object.keys(predictions).length === 0)) {
      return (
        <PredictionCard key={modelName} modelName={modelName} loading={true} />
      );
    }

    const prediction = predictions?.[modelName];

    if (prediction?.error) {
      return (
        <PredictionCard key={modelName} modelName={modelName} error={prediction.error} />
      );
    }

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

    return <PredictionCard key={modelName} modelName={modelName} loading={true} />;
  };

  if (loading && (!predictions || Object.keys(predictions).length === 0)) {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-electric-400 mb-6 flex items-center">
          <span className="w-1 h-8 bg-orange-500 rounded-full mr-3 tech-glow"></span>
          ML Model Predictions
        </h2>
        <div className="space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-silver-500 mb-3">
              Core models
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CORE_MODELS.map((name) => renderOneCard(name))}
            </div>
          </div>
          <div className="rounded-xl border border-electric-500/25 bg-charcoal-900/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-electric-400/90 mb-3">
              Miro — LLM synthesis
            </p>
            <div className="w-full max-w-5xl mx-auto">{renderOneCard(MIRO_MODEL)}</div>
          </div>
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

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-electric-400 mb-6 flex items-center">
        <span className="w-1 h-8 bg-orange-500 rounded-full mr-3 tech-glow"></span>
        ML Model Predictions
      </h2>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-silver-500 mb-3">
            Core models
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{CORE_MODELS.map((name) => renderOneCard(name))}</div>
        </div>
        <div className="rounded-xl border border-electric-500/25 bg-charcoal-900/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric-400/90 mb-3">
            Miro — LLM synthesis
          </p>
          <div className="w-full max-w-5xl mx-auto">{renderOneCard(MIRO_MODEL)}</div>
        </div>
      </div>
    </div>
  );
};

export default PredictionDisplay;
