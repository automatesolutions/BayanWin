import React, { useEffect, useState } from 'react';
import { TbArrowRight, TbRefresh } from 'react-icons/tb';
import { getResults } from '../services/api';
import { GAMES, GAME_ORDER } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import { nextDrawLabel } from '../utils/drawSchedule';
import NumberBall from './NumberBall';

/**
 * First-screen results board: latest draw for every game, its jackpot, and when
 * the next draw happens. Mirrors the results-first pattern of the strongest
 * lottery sites (National Lottery, Lottery.net, LottoNumbers).
 */
const LatestDrawsBoard = ({ onAnalyze }) => {
  const [rows, setRows] = useState({});
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    Promise.allSettled(GAME_ORDER.map((id) => getResults(id, 1, 1))).then((settled) => {
      if (cancelled) return;
      const next = {};
      settled.forEach((r, i) => {
        if (r.status === 'fulfilled') next[GAME_ORDER[i]] = r.value.data.results?.[0] || null;
      });
      setRows(next);
      setStatus(Object.keys(next).length ? 'ready' : 'error');
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <div className="overflow-hidden rounded-card border border-white/[0.08] bg-charcoal-800/90 shadow-tech-lg">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <h2 className="font-display text-base font-semibold text-white">Latest PCSO results</h2>
        <span className="text-xs text-silver-500">Draws at 9 PM, Manila time</span>
      </div>

      {status === 'error' ? (
        <div className="flex flex-col items-start gap-3 px-5 py-8">
          <p className="text-sm text-silver-300">Results didn&apos;t load. The results server may be waking up.</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn-secondary btn-sm">
            <TbRefresh aria-hidden /> Try again
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {GAME_ORDER.map((id) => {
            const game = GAMES[id];
            const draw = rows[id];
            const next = nextDrawLabel(game.drawDays);
            return (
              <li key={id} className="grid grid-cols-[4.5rem_1fr] items-center gap-x-4 gap-y-2 px-5 py-4 sm:grid-cols-[5rem_1fr_auto]">
                <div>
                  <p className="font-mono text-lg font-semibold leading-none text-white tabular">6/{game.maxNumber}</p>
                  <p className="mt-1 text-2xs text-silver-500">{game.name.replace(/\s*6\/\d+$/, '')}</p>
                </div>

                <div className="min-w-0">
                  {status === 'loading' ? (
                    <div className="flex gap-1.5" aria-hidden>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <span key={i} className="skeleton h-8 w-8 rounded-full" />
                      ))}
                    </div>
                  ) : draw ? (
                    <>
                      <div className="flex flex-wrap gap-1.5" aria-label={`Latest ${game.name} numbers`}>
                        {draw.numbers?.map((n, i) => (
                          <NumberBall key={i} number={n} size="sm" />
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-silver-500">
                        {formatDate(draw.draw_date)}
                        {draw.jackpot ? (
                          <>
                            {' · '}
                            <span className="font-mono text-orange-300 tabular">{formatCurrency(draw.jackpot)}</span>
                          </>
                        ) : null}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-silver-500">No draw on record yet</p>
                  )}
                </div>

                <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:gap-1">
                  {next && (
                    <p className="text-xs text-silver-400">
                      Next: <span className="font-medium text-silver-100">{next}</span>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onAnalyze(id)}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2 text-sm font-medium text-electric-300 hover:bg-white/[0.05] hover:text-electric-200"
                  >
                    Analyze 6/{game.maxNumber}
                    <TbArrowRight aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LatestDrawsBoard;
