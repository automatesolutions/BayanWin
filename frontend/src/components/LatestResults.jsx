import React, { useState, useEffect } from 'react';
import { getResults } from '../services/api';
import NumberBall from './NumberBall';
import { formatDate, formatCurrency } from '../utils/formatters';

/** Single lightweight fetch: most recent draws only (no full history / pagination). */
const LATEST_COUNT = 5;

const LatestResults = ({ gameType, refreshKey = 0 }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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

  if (!gameType) {
    return null;
  }

  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
      <h2 className="text-xl font-bold text-electric-400 mb-1 flex items-center">
        <span className="w-1 h-8 bg-electric-500 rounded-full mr-3 tech-glow"></span>
        Latest results
      </h2>
      <p className="text-xs text-silver-500 mb-4 ml-4">
        Most recent {LATEST_COUNT} draws (full history not loaded for speed).
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
