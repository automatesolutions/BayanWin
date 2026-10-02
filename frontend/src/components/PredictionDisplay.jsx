import React from 'react';
import { TbSparkles, TbTargetArrow } from 'react-icons/tb';
import PredictionCard from './PredictionCard';
import CardHeader from './ui/CardHeader';
import EmptyState from './ui/EmptyState';

/** Six ML predictors; Miro (meta) shown below for clearer layout */
const CORE_MODELS = ['XGBoost', 'DecisionTree', 'MarkovChain', 'AnomalyDetection', 'NashHotFilter', 'DRL'];
const MIRO_MODEL = 'Miro';

const PredictionDisplay = ({ predictions, loading }) => {
  const hasAny = predictions && Object.keys(predictions).length > 0;

  const renderOneCard = (modelName) => {
    const prediction = predictions?.[modelName];
    if (prediction?.error) {
      return <PredictionCard key={modelName} modelName={modelName} error={prediction.error} />;
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
    if (!loading) {
      return <PredictionCard key={modelName} modelName={modelName} error="no result was returned. Try running again." />;
    }
    return <PredictionCard key={modelName} modelName={modelName} loading />;
  };

  const done = hasAny ? [...CORE_MODELS, MIRO_MODEL].filter((m) => predictions[m]).length : 0;

  return (
    <section className="card" aria-labelledby="forecast-heading" aria-busy={loading}>
      <CardHeader
        icon={TbTargetArrow}
        title={<span id="forecast-heading">Model picks</span>}
        description="Each model reads the same draw history in its own way. Numbers that come up in several models are worth a closer look. They are not more likely to be drawn."
        actions={
          (loading || hasAny) && (
            <span className="chip" aria-live="polite">
              {done}/7 done
            </span>
          )
        }
      />

      {!loading && !hasAny ? (
        <EmptyState icon={TbTargetArrow} title="No picks yet" compact>
          Press <strong className="text-silver-200">Run all 7 models</strong> above. Picks show up here as each
          model finishes, usually within a minute.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {CORE_MODELS.map(renderOneCard)}
          </div>
          <div className="rounded-xl border border-electric-400/20 bg-electric-500/[0.04] p-4 sm:p-5">
            <p className="eyebrow mb-3 flex items-center gap-1.5">
              <TbSparkles className="h-3.5 w-3.5" aria-hidden />
              Synthesis layer
            </p>
            {renderOneCard(MIRO_MODEL)}
          </div>
        </div>
      )}
    </section>
  );
};

export default PredictionDisplay;
