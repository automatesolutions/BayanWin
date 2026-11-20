import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TbListNumbers, TbRefresh } from 'react-icons/tb';
import { getResults, scrapeData, subscribeToResults } from '../services/api';
import NumberBall from './NumberBall';
import CardHeader from './ui/CardHeader';
import EmptyState from './ui/EmptyState';
import Notice from './ui/Notice';
import { formatDate, formatCurrency, formatUpdatedAgo } from '../utils/formatters';

/** Single lightweight fetch: most recent draws only (no full history / pagination). */
const LATEST_COUNT = 5;

/** Re-render the "Updated X min ago" label this often. */
const AGO_TICK_MS = 30 * 1000;

const errorText = (error) => {
  const detail = error.response?.data?.detail;
  return typeof detail === 'string' ? detail : error.response?.data?.message || error.message;
};

const LatestResults = ({ gameType, refreshKey = 0, onSheetSynced }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickSyncing, setQuickSyncing] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncedAt, setSyncedAt] = useState(null);
  const [liveKey, setLiveKey] = useState(0);
  const [, setAgoTick] = useState(0);
  const busyRef = useRef(false);
  const shownGameRef = useRef(null);
  const onSheetSyncedRef = useRef(onSheetSynced);
  onSheetSyncedRef.current = onSheetSynced;

  useEffect(() => {
    if (!gameType) return;
    let cancelled = false;

    const run = async () => {
      // Skeletons only when switching games; live refreshes swap rows in place.
      const firstLoad = shownGameRef.current !== gameType;
      if (firstLoad) setLoading(true);
      try {
        const response = await getResults(gameType, 1, LATEST_COUNT);
        if (!cancelled) {
          setResults(response.data.results || []);
          setSyncedAt(response.data.last_synced_at || null);
          shownGameRef.current = gameType;
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
  }, [gameType, refreshKey, liveKey]);

  /** New draws arrive over the live stream (Jev publishes them); refetch this game when it changes. */
  useEffect(() => {
    if (!gameType) return undefined;
    return subscribeToResults((msg) => {
      if (msg.game_type === gameType) setLiveKey((n) => n + 1);
    });
  }, [gameType]);

  useEffect(() => {
    const id = setInterval(() => setAgoTick((n) => n + 1), AGO_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const runIncrementalScrape = useCallback(async () => {
    if (!gameType) return;
    if (busyRef.current) return;
    busyRef.current = true;
    setQuickSyncing(true);
    setSyncError(null);
    try {
      await scrapeData({ game_type: gameType, full_sync: false });
      onSheetSyncedRef.current?.();
    } catch (error) {
      const msg = errorText(error);
      console.error('Sheet sync failed:', msg);
      setSyncError(`Couldn't check for new draws. ${msg}`);
    } finally {
      busyRef.current = false;
      setQuickSyncing(false);
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

  if (!gameType) {
    return null;
  }

  const busy = loading || quickSyncing || fullSyncing;
  const updatedLabel = formatUpdatedAgo(syncedAt);

  return (
    <section className="card" aria-busy={loading}>
      <CardHeader
        icon={TbListNumbers}
        title="Latest results"
        description="The 5 most recent official draws. New draws appear here on their own, usually within a minute of being entered."
        actions={
          <>
            {updatedLabel && (
              <span className="text-xs text-silver-500" aria-live="polite">
                {updatedLabel}
              </span>
            )}
            <button
              type="button"
              onClick={runIncrementalScrape}
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
              onClick={runIncrementalScrape}
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
