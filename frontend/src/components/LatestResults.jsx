import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getResults, scrapeData } from '../services/api';
import NumberBall from './NumberBall';
import { formatDate, formatCurrency } from '../utils/formatters';

/** Single lightweight fetch: most recent draws only (no full history / pagination). */
const LATEST_COUNT = 5;

/** Background incremental pull from Google Sheet → DB; keeps UI fresh without manual clicks. */
const AUTO_SHEET_SYNC_MS = 90 * 1000;

const LatestResults = ({ gameType, refreshKey = 0, onSheetSynced }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickSyncing, setQuickSyncing] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);
  const [backgroundSyncing, setBackgroundSyncing] = useState(false);
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
    }
    try {
      await scrapeData({ game_type: gameType, full_sync: false });
      onSheetSyncedRef.current?.();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg =
        typeof detail === 'string' ? detail : error.response?.data?.message || error.message;
      console.error('Sheet sync failed:', msg);
      if (!opts.silent) {
        window.alert(`Could not update from Google Sheet.\n\n${msg}`);
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
    try {
      await scrapeData({ game_type: gameType, full_sync: true });
      onSheetSyncedRef.current?.();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg =
        typeof detail === 'string' ? detail : error.response?.data?.message || error.message;
      console.error('Full sheet sync failed:', msg);
      window.alert(`Could not run full sheet sync.\n\n${msg}`);
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

  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <h2 className="text-xl font-bold text-electric-400 flex items-center">
          <span className="w-1 h-8 bg-electric-500 rounded-full mr-3 tech-glow"></span>
          Latest results
        </h2>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {backgroundSyncing && (
            <span className="text-[10px] text-silver-500 whitespace-nowrap" aria-live="polite">
              Auto-sync…
            </span>
          )}
          <button
            type="button"
            onClick={() => runIncrementalScrape({ silent: false })}
            disabled={loading || quickSyncing || fullSyncing || backgroundSyncing}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-electric-600/30 border border-electric-400/60 text-electric-200 hover:bg-electric-600/45 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {quickSyncing ? 'Updating…' : 'Update from sheet'}
          </button>
          <button
            type="button"
            onClick={handleFullSheetSync}
            disabled={loading || quickSyncing || fullSyncing || backgroundSyncing}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-silver-600 text-silver-300 hover:bg-charcoal-700/80 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Re-reads the entire Google Sheet. Use only if a normal update did not show new rows."
          >
            {fullSyncing ? 'Full sync…' : 'Full re-sync'}
          </button>
        </div>
      </div>
      <p className="text-xs text-silver-500 mb-4 ml-4 max-w-3xl leading-relaxed">
        This list comes from the app database (not the live sheet). The server pulls your Google Sheet
        in the background about every 90s while this page is open, and when you return to this tab.
        Use <strong>Update from sheet</strong> for a fast check; use <strong>Full re-sync</strong> only
        if new rows still do not show (re-reads the whole sheet and is slower).
      </p>

      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-electric-500 mx-auto"></div>
        </div>
      ) : results.length === 0 ? (
        <p className="text-silver-300 text-center py-6">No results available</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-silver-600/30">
            <thead className="bg-gradient-to-r from-electric-900/50 to-charcoal-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Draw #</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Numbers</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Jackpot</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Winners</th>
              </tr>
            </thead>
            <tbody className="bg-charcoal-700/30 divide-y divide-silver-600/20">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-electric-900/20 transition-colors">
                  <td className="px-3 py-2 text-sm text-silver-200 font-medium">{formatDate(result.draw_date)}</td>
                  <td className="px-3 py-2 text-sm text-silver-200 font-mono">{result.draw_number || 'N/A'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {result.numbers && result.numbers.length > 0 ? (
                        result.numbers.map((num, idx) => (
                          <NumberBall key={idx} number={num} size="sm" />
                        ))
                      ) : (
                        <span className="text-silver-400 text-sm">No numbers</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-orange-300 font-semibold">
                    {result.jackpot ? formatCurrency(result.jackpot) : 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-sm text-silver-200">
                    {result.winners !== null && result.winners !== undefined ? result.winners : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LatestResults;
