import React from 'react';
import { TbBolt, TbCheck } from 'react-icons/tb';
import { GAMES } from '../utils/constants';
import Spinner from './ui/Spinner';

/** Number of possible 6-number tickets: C(n, k). */
const combinations = (n, k) => {
  let r = 1;
  for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
  return Math.round(r);
};

const GameSelector = ({ selectedGame, onGameSelect, onGeneratePredictions, loading = false }) => {
  const gameList = Object.values(GAMES);
  const selected = selectedGame ? GAMES[selectedGame] : null;

  return (
    <div className="card">
      <div className="mb-5 space-y-1">
        <h2 className="card-title">1. Pick a game</h2>
        <p className="text-sm text-silver-400">
          Results, charts, and model runs all use the game you pick.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="PCSO game"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {gameList.map((game) => {
          const active = selectedGame === game.id;
          return (
            <button
              key={game.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onGameSelect(game.id)}
              className={`group relative flex min-h-[88px] flex-col items-start justify-between rounded-xl border p-4 text-left transition-colors ${
                active
                  ? 'border-electric-400/70 bg-electric-500/[0.12] ring-1 ring-inset ring-electric-400/40'
                  : 'border-white/[0.08] bg-charcoal-700/60 hover:border-white/20 hover:bg-charcoal-600/70'
              }`}
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span className="font-mono text-xl font-semibold text-white tabular">
                  6/{game.maxNumber}
                </span>
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                    active ? 'border-electric-400 bg-electric-400 text-charcoal-950' : 'border-white/20'
                  }`}
                  aria-hidden
                >
                  {active && <TbCheck className="h-3.5 w-3.5" />}
                </span>
              </span>
              <span className="mt-2 block">
                <span className={`block text-sm font-medium ${active ? 'text-white' : 'text-silver-200'}`}>
                  {game.name.replace(/\s*6\/\d+$/, '')}
                </span>
                <span className="block text-2xs text-silver-500 tabular">
                  1 in {combinations(game.maxNumber, game.numbersCount).toLocaleString('en-US')}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <p className="card-title text-base">2. Run the models</p>
          <p className="text-sm text-silver-400">
            {selected
              ? `Runs all 7 models on ${selected.name} history. Results appear as each one finishes.`
              : 'Pick a game first.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onGeneratePredictions}
          disabled={!selectedGame || loading}
          className="btn-primary btn-lg w-full sm:w-auto"
        >
          {loading ? <Spinner className="h-4 w-4" label="Running models" /> : <TbBolt aria-hidden />}
          {loading ? 'Running models…' : 'Run all 7 models'}
        </button>
      </div>
    </div>
  );
};

export default GameSelector;
