import React, { useState } from 'react';
import { scrapeData } from '../services/api';

const ScraperControl = () => {
  const [scraping, setScraping] = useState(false);
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleScrape = async () => {
    setScraping(true);
    setStatus(null);
    
    try {
      const payload = {};
      
      if (useDateRange) {
        if (startDate) payload.start_date = startDate;
        if (endDate) payload.end_date = endDate;
      }
      
      const response = await scrapeData(payload);
      setStatus({ type: 'success', message: 'Scraping completed successfully!' });
      setStats(response.data.stats);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to scrape data';
      setStatus({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
      <h2 className="text-xl font-bold text-electric-400 mb-4 flex items-center">
        <span className="w-1 h-8 bg-electric-500 rounded-full mr-3 tech-glow"></span>
        Data Management
      </h2>
      
      <div className="mb-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useDateRange}
            onChange={(e) => setUseDateRange(e.target.checked)}
            className="rounded border-silver-600/50 bg-charcoal-700 text-electric-500 focus:ring-electric-500"
          />
          <span className="text-sm text-silver-300 font-medium">Use custom date range</span>
        </label>
      </div>

      {useDateRange && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-silver-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-silver-600/50 bg-charcoal-700 text-silver-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-silver-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-silver-600/50 bg-charcoal-700 text-silver-200 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            />
          </div>
          <p className="text-xs text-silver-400">
            Leave empty to use default (last 30 days to today)
          </p>
        </div>
      )}
      
      <button
        onClick={handleScrape}
        disabled={scraping}
        className={`w-full py-3 px-6 rounded-xl font-bold transition-all ${
          scraping
            ? 'bg-silver-600 cursor-not-allowed text-charcoal-800'
            : 'bg-electric-gradient hover:bg-electric-600 text-white shadow-electric hover:shadow-tech-lg transform hover:scale-[1.02] border-2 border-electric-400/50'
        }`}
      >
        {scraping ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Scraping...
          </span>
        ) : (
          'Scrape New Data'
        )}
      </button>

      {status && (
        <div className={`mt-4 p-4 rounded-lg border-2 ${
          status.type === 'success' 
            ? 'bg-green-900/30 border-green-500/50 text-green-300' 
            : 'bg-red-900/30 border-red-500/50 text-red-300'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">{status.type === 'success' ? '✅' : '❌'}</span>
            {status.message}
          </div>
        </div>
      )}

      {stats && (
        <div className="mt-4 space-y-2 p-4 bg-gradient-to-br from-electric-900/30 to-charcoal-700 rounded-lg border border-electric-500/30">
          <div className="text-sm text-silver-200 font-semibold">
            <span className="text-electric-400">📊</span> New Records: <span className="text-electric-300">{stats.total_new}</span>
          </div>
          <div className="text-sm text-silver-200 font-semibold">
            <span className="text-silver-400">🔄</span> Duplicates: <span className="text-silver-300">{stats.total_duplicates}</span>
          </div>
          {stats.games_updated && stats.games_updated.length > 0 && (
            <div className="text-sm text-silver-200 font-semibold">
              <span className="text-orange-400">🎮</span> Games Updated: <span className="text-orange-300">{stats.games_updated.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScraperControl;

