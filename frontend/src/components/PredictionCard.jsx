import React, { useState } from 'react';
import { TbAlertTriangle, TbChevronDown } from 'react-icons/tb';
import NumberBall from './NumberBall';

export const MODEL_INFO = {
  XGBoost: { label: 'XGBoost', desc: 'Gradient boosting on features built from past draws.' },
  DecisionTree: { label: 'Random Forest', desc: 'Tree ensemble trained on number frequency.' },
  MarkovChain: { label: 'Markov Chain', desc: 'Transition odds from one draw to the next.' },
  AnomalyDetection: { label: 'Normal Distribution', desc: 'Picks combinations near the most common sum range.' },
  NashHotFilter: { label: 'NashHotFilter', desc: 'Balances hot numbers with a 3 even / 3 odd split.' },
  DRL: { label: 'Deep RL', desc: 'Agent that adjusts from its own past hits and misses.' },
  Miro: {
    label: 'Miro',
    desc:
      'LLM synthesis. Six model voices and a chair read the graphs, stats, hot/cold and overdue numbers, then agree on one line. Advisory only.',
  },
};

const Shell = ({ children, tone = 'default' }) => (
  <div
    className={`flex h-full flex-col rounded-xl border p-5 ${
      tone === 'error' ? 'border-red-400/25 bg-red-500/[0.04]' : 'border-white/[0.07] bg-charcoal-700/50'
    }`}
  >
    {children}
  </div>
);

const Title = ({ info, status }) => (
  <div className="mb-1 flex items-center justify-between gap-2">
    <h3 className="font-display text-base font-semibold text-white">{info.label}</h3>
    {status}
  </div>
);

const PredictionCard = ({ modelName, numbers, previousPredictions, error, loading }) => {
  const [showPrevious, setShowPrevious] = useState(false);
  const info = MODEL_INFO[modelName] || { label: modelName, desc: 'Model output.' };

  if (loading) {
    return (
      <Shell>
        <Title
          info={info}
          status={<span className="font-mono text-2xs uppercase tracking-wider text-silver-500">Running</span>}
        />
        <p className="mb-4 text-sm text-silver-400">{info.desc}</p>
        <div className="mt-auto flex flex-wrap gap-2" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="skeleton h-11 w-11 rounded-full" />
          ))}
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell tone="error">
        <Title
          info={info}
          status={<TbAlertTriangle className="h-4 w-4 text-red-300" aria-label="Failed" />}
        />
        <p className="mb-3 text-sm text-silver-400">{info.desc}</p>
        <p className="mt-auto rounded-lg bg-black/20 p-3 font-mono text-xs leading-relaxed text-red-200">
          This model failed: {error}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <Title info={info} />
      <p className="mb-4 text-sm text-silver-400">{info.desc}</p>

      <div className="mt-auto flex flex-wrap gap-2" aria-label={`${info.label} numbers`}>
        {numbers?.map((num, idx) => (
          <NumberBall key={idx} number={num} size="md" />
        ))}
      </div>

      {previousPredictions?.length > 0 && (
        <div className="mt-4 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setShowPrevious((v) => !v)}
            aria-expanded={showPrevious}
            className="btn-ghost btn-sm -ml-3"
          >
            <TbChevronDown
              className={`transition-transform ${showPrevious ? 'rotate-180' : ''}`}
              aria-hidden
            />
            {showPrevious ? 'Hide' : 'Show'} earlier picks ({previousPredictions.length})
          </button>

          {showPrevious && (
            <ul className="mt-2 space-y-2">
              {previousPredictions.map(
                (prevNums, idx) =>
                  prevNums && (
                    <li key={idx} className="flex flex-wrap gap-1.5">
                      {prevNums.map((num, numIdx) => (
                        <NumberBall key={numIdx} number={num} size="sm" tone="muted" />
                      ))}
                    </li>
                  )
              )}
            </ul>
          )}
        </div>
      )}
    </Shell>
  );
};

export default PredictionCard;
