import React, { useState, useEffect } from 'react';
import { getResults } from '../services/api';
import NumberBall from './NumberBall';
import { formatDate, formatCurrency } from '../utils/formatters';

const HistoricalResults = ({ gameType }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (gameType) {
      fetchResults();
    }
  }, [gameType, page]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await getResults(gameType, page, 20);
      setResults(response.data.results);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!gameType) {
    return null;
  }

  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
      <h2 className="text-xl font-bold text-electric-400 mb-4 flex items-center">
        <span className="w-1 h-8 bg-electric-500 rounded-full mr-3 tech-glow"></span>
        Historical Results
      </h2>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500 mx-auto"></div>
        </div>
      ) : results.length === 0 ? (
        <p className="text-silver-300 text-center py-8">No results available</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-silver-600/30">
              <thead className="bg-gradient-to-r from-electric-900/50 to-charcoal-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Draw #</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Numbers</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Jackpot</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Winners</th>
                </tr>
              </thead>
              <tbody className="bg-charcoal-700/30 divide-y divide-silver-600/20">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-electric-900/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-silver-200 font-medium">{formatDate(result.draw_date)}</td>
                    <td className="px-4 py-3 text-sm text-silver-200 font-mono">{result.draw_number || 'N/A'}</td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-sm text-orange-300 font-semibold">
                      {result.jackpot ? formatCurrency(result.jackpot) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-silver-200">{result.winners !== null && result.winners !== undefined ? result.winners : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-charcoal-700 hover:bg-electric-600 text-silver-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors border border-silver-600/30"
            >
              ← Previous
            </button>
            <span className="text-sm text-silver-300 font-semibold">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-4 py-2 bg-charcoal-700 hover:bg-electric-600 text-silver-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors border border-silver-600/30"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoricalResults;

