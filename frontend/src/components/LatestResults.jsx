import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TbListNumbers, TbRefresh } from 'react-icons/tb';
import { getResults, scrapeData } from '../services/api';
import NumberBall from './NumberBall';
import CardHeader from './ui/CardHeader';
import EmptyState from './ui/EmptyState';
import Notice from './ui/Notice';
import Spinner from './ui/Spinner';
import { formatDate, formatCurrency } from '../utils/formatters';

/** Single lightweight fetch: most recent draws only (no full history / pagination). */
const LATEST_COUNT = 5;

/** Background incremental pull from Google Sheet → DB; keeps UI fresh without manual clicks. */
const AUTO_SHEET_SYNC_MS = 90 * 1000;

const errorText = (error) => {
  const detail = error.response?.data?.detail;
  return typeof detail === 'string' ? detail : error.response?.data?.message || error.message;
};

const LatestResults = ({ gameType, refreshKey = 0, onSheetSynced }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickSyncing, setQuickSyncing] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);
  const [backgroundSyncing, setBackgroundSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const busyRef = useRef(false);
  const onSheetSyncedRef = useRef(onSheetSynced);
  onSheetSyncedRef.current = onSheetSynced;

  useEffect(() => {
    if (!gameType) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const response = await getResults(gameType, 1, LATEST_COUNT);
        if (!cancelled) {
          setResults(response.data.results || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching latest results:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [gameType, refreshKey]);

  const runIncrementalScrape = useCallback(async (opts = { silent: false }) => {
    if (!gameType) return;
    if (busyRef.current) return;
    busyRef.current = true;
    if (opts.silent) {
      setBackgroundSyncing(true);
    } else {
      setQuickSyncing(true);
      setSyncError(null);
    }
    try {
      await scrapeData({ game_type: gameType, full_sync: false });
      onSheetSyncedRef.current?.();
    } catch (error) {
      const msg = errorText(error);
      console.error('Sheet sync failed:', msg);
      if (!opts.silent) {
        setSyncError(`Couldn't check for new draws. ${msg}`);
      }
    } finally {
      busyRef.current = false;
      if (opts.silent) {
        setBackgroundSyncing(false);
      } else {
        setQuickSyncing(false);
      }
    }
  }, [gameType]);

  const handleFullSheetSync = async () => {
    if (!gameType) return;
    if (busyRef.current) return;
    busyRef.current = true;
    setFullSyncing(true);
    setSyncError(null);
    try {
      await scrapeData({ game_type: gameType, full_sync: true });
      onSheetSyncedRef.current?.();
    } catch (error) {
      const msg = errorText(error);
      console.error('Full sheet sync failed:', msg);
      setSyncError(`Full re-sync didn't finish. ${msg}`);
    } finally {
      busyRef.current = false;
      setFullSyncing(false);
    }
  };

  /** One extra pull shortly after choosing a game (parent already scrapes once; this catches slow writes). */
  useEffect(() => {
    if (!gameType) return;
    const t = setTimeout(() => {
      if (!document.hidden) {
        runIncrementalScrape({ silent: true });
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [gameType, runIncrementalScrape]);

  /** Periodic + tab-focus incremental sync so you do not have to press a button for normal updates. */
  useEffect(() => {
    if (!gameType) return;

    const id = setInterval(() => {
      if (document.hidden) return;
      runIncrementalScrape({ silent: true });
    }, AUTO_SHEET_SYNC_MS);

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        runIncrementalScrape({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [gameType, runIncrementalScrape]);

  if (!gameType) {
    return null;
  }

  const busy = loading || quickSyncing || fullSyncing || backgroundSyncing;

  return (
    <section className="card" aria-busy={loading}>
      <CardHeader
        icon={TbListNumbers}
        title="Latest results"
        description="The 5 most recent official draws. New results sync on their own every 90 seconds while this page is open."
        actions={
          <>
            {backgroundSyncing && (
              <span className="inline-flex items-center gap-1.5 text-xs text-silver-500" aria-live="polite">
                <Spinner className="h-3 w-3" label="Syncing" /> Syncing
              </span>
            )}
            <button
              type="button"
              onClick={() => runIncrementalScrape({ silent: false })}
              disabled={busy}
              className="btn-secondary btn-sm"
            >
              <TbRefresh className={quickSyncing ? 'animate-spin' : ''} aria-hidden />
              {quickSyncing ? 'Checking…' : 'Check for new draws'}
            </button>
            <button
              type="button"
              onClick={handleFullSheetSync}
              disabled={busy}
              className="btn-ghost btn-sm"
              title="Re-reads the whole source sheet. Slower. Use only if a normal check misses new rows."
            >
              {fullSyncing ? 'Re-syncing…' : 'Full re-sync'}
            </button>
          </>
        }
      />

      {syncError && (
        <Notice tone="error" title="Sync failed" onDismiss={() => setSyncError(null)} className="mb-4">
          {syncError}
        </Notice>
      )}

      {loading ? (
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: LATEST_COUNT }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={TbListNumbers}
          title="No draws loaded yet"
          compact
          action={
            <button
              type="button"
              onClick={() => runIncrementalScrape({ silent: false })}
              disabled={busy}
              className="btn-secondary btn-sm"
            >
              <TbRefresh aria-hidden /> Check for new draws
            </button>
          }
        >
          The first sync can take a few seconds. Check again, or come back shortly.
        </EmptyState>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Draw</th>
                <th scope="col">Numbers</th>
                <th scope="col" className="text-right">Jackpot</th>
                <th scope="col" className="text-right">Winners</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="whitespace-nowrap font-medium">{formatDate(result.draw_date)}</td>
                  <td className="font-mono text-silver-400">{result.draw_number || '—'}</td>
                  <td>
                    <div className="flex min-w-[17rem] flex-wrap gap-1">
                      {result.numbers?.length > 0 ? (
                        result.numbers.map((num, idx) => <NumberBall key={idx} number={num} size="sm" />)
                      ) : (
                        <span className="text-silver-500">—</span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-right font-mono font-semibold text-orange-300 tabular">
                    {result.jackpot ? formatCurrency(result.jackpot) : '—'}
                  </td>
                  <td className="text-right font-mono tabular">
                    {result.winners !== null && result.winners !== undefined ? result.winners : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default LatestResults;
