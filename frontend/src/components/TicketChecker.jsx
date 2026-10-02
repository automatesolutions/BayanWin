import React, { useMemo, useState } from 'react';
import { TbTicket } from 'react-icons/tb';
import { getResults } from '../services/api';
import { GAMES } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import CardHeader from './ui/CardHeader';
import Notice from './ui/Notice';
import Spinner from './ui/Spinner';

const RECENT = 10;

/** Compare a ticket against the last few draws of the selected game. */
const TicketChecker = ({ gameType }) => {
  const game = GAMES[gameType];
  const [values, setValues] = useState(Array(6).fill(''));
  const [draws, setDraws] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const picked = useMemo(() => values.map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0), [values]);

  const validation = useMemo(() => {
    if (picked.length < 6) return null;
    if (picked.some((n) => n > game.maxNumber)) return `Each number must be from 1 to ${game.maxNumber}.`;
    if (new Set(picked).size !== 6) return 'Each number can only appear once on a ticket.';
    return null;
  }, [picked, game.maxNumber]);

  const setValue = (i, v) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    setValues((prev) => prev.map((x, j) => (j === i ? clean : x)));
    setDraws(null);
  };

  const check = async (e) => {
    e.preventDefault();
    if (picked.length < 6 || validation) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getResults(gameType, 1, RECENT);
      setDraws(data.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const ticket = new Set(picked);
  const best = draws?.reduce((m, d) => Math.max(m, d.numbers?.filter((n) => ticket.has(n)).length || 0), 0) ?? 0;

  return (
    <section className="card">
      <CardHeader
        icon={TbTicket}
        title="Check your ticket"
        description={`Enter your six ${game.name} numbers to compare them with the last ${RECENT} draws.`}
      />

      <form onSubmit={check} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <fieldset className="flex-1">
          <legend className="mb-2 text-sm text-silver-400">Your numbers (1 to {game.maxNumber})</legend>
          <div className="grid grid-cols-6 gap-2">
            {values.map((v, i) => (
              <input
                key={i}
                inputMode="numeric"
                aria-label={`Number ${i + 1}`}
                value={v}
                onChange={(e) => setValue(i, e.target.value)}
                className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-charcoal-900 text-center font-mono text-lg text-white tabular placeholder:text-silver-600 focus:border-electric-400 focus:outline-none"
                placeholder="—"
              />
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={picked.length < 6 || !!validation || loading} className="btn-secondary sm:min-w-[11rem]">
          {loading ? <Spinner className="h-4 w-4" /> : null}
          {loading ? 'Checking…' : 'Check my numbers'}
        </button>
      </form>

      {validation && <p className="mt-3 text-sm text-amber-200" role="alert">{validation}</p>}
      {error && (
        <Notice tone="error" title="Couldn't load recent draws" className="mt-4">
          {error}
        </Notice>
      )}

      {draws && (
        <div className="mt-5 space-y-2" aria-live="polite">
          <p className="text-sm text-silver-300">
            {best === 0
              ? `No matches in the last ${draws.length} draws.`
              : `Best result: ${best} of 6 numbers matched in one draw.`}{' '}
            <span className="text-silver-500">Check prize tiers with your PCSO outlet. This is not an official result.</span>
          </p>
          <ul className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.06]">
            {draws.map((d) => {
              const hits = d.numbers?.filter((n) => ticket.has(n)).length || 0;
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <span className="w-28 text-sm text-silver-400">{formatDate(d.draw_date)}</span>
                  <span className="flex gap-1.5">
                    {d.numbers?.map((n) => (
                      <span
                        key={n}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-semibold tabular ${
                          ticket.has(n) ? 'bg-orange-500 text-charcoal-950' : 'bg-charcoal-600 text-silver-300'
                        }`}
                      >
                        {String(n).padStart(2, '0')}
                      </span>
                    ))}
                  </span>
                  <span className={`ml-auto text-sm font-medium ${hits >= 3 ? 'text-orange-300' : 'text-silver-500'}`}>
                    {hits} matched
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};

export default TicketChecker;
