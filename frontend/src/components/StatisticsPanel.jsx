import React, { useState, useEffect } from 'react';
import { getStatistics } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatisticsPanel = ({ gameType }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('frequency');

  useEffect(() => {
    if (gameType) {
      fetchStatistics();
    }
  }, [gameType]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await getStatistics(gameType);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!gameType) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
        <p className="text-silver-300">No statistics available</p>
      </div>
    );
  }

  const hotNumbersData = stats.hot_numbers?.slice(0, 15).map(item => ({
    number: item.number,
    frequency: item.frequency
  })) || [];

  const coldNumbersData = stats.cold_numbers?.slice(0, 15).map(item => ({
    number: item.number,
    frequency: item.frequency
  })) || [];

  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
      <h2 className="text-xl font-bold text-electric-400 mb-4 flex items-center">
        <span className="w-1 h-8 bg-electric-500 rounded-full mr-3 tech-glow"></span>
        Statistics & Analytics
      </h2>
      
      <div className="border-b-2 border-silver-600/30 mb-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('frequency')}
            className={`py-2 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'frequency'
                ? 'border-electric-500 text-electric-300'
                : 'border-transparent text-silver-400 hover:text-electric-300'
            }`}
          >
            Frequency Analysis
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'general'
                ? 'border-electric-500 text-electric-300'
                : 'border-transparent text-silver-400 hover:text-electric-300'
            }`}
          >
            General Statistics
          </button>
        </nav>
      </div>

      {activeTab === 'frequency' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-electric-300 mb-3 flex items-center">
              <span className="text-orange-500 mr-2">🔥</span>
              Hot Numbers (Most Frequent)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hotNumbersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#BDC3C7" opacity={0.3} />
                <XAxis dataKey="number" stroke="#BDC3C7" tick={{ fill: '#BDC3C7' }} />
                <YAxis stroke="#BDC3C7" tick={{ fill: '#BDC3C7' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2C3E50', 
                    border: '2px solid #3498DB',
                    borderRadius: '8px',
                    color: '#ECF0F1'
                  }} 
                />
                <Legend wrapperStyle={{ color: '#BDC3C7' }} />
                <Bar dataKey="frequency" fill="#E67E22" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-electric-300 mb-3 flex items-center">
              <span className="text-electric-500 mr-2">❄️</span>
              Cold Numbers (Least Frequent)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coldNumbersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#BDC3C7" opacity={0.3} />
                <XAxis dataKey="number" stroke="#BDC3C7" tick={{ fill: '#BDC3C7' }} />
                <YAxis stroke="#BDC3C7" tick={{ fill: '#BDC3C7' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2C3E50', 
                    border: '2px solid #3498DB',
                    borderRadius: '8px',
                    color: '#ECF0F1'
                  }} 
                />
                <Legend wrapperStyle={{ color: '#BDC3C7' }} />
                <Bar dataKey="frequency" fill="#3498DB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {stats.overdue_numbers && stats.overdue_numbers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-electric-300 mb-3 flex items-center">
                <span className="text-silver-400 mr-2">⏰</span>
                Overdue Numbers
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {stats.overdue_numbers.slice(0, 20).map((item) => (
                  <div key={item.number} className="p-3 bg-gradient-to-br from-charcoal-700 to-charcoal-600 rounded-lg text-center border border-silver-600/30 hover:border-electric-400 transition-colors">
                    <div className="font-bold text-electric-300 text-lg">{item.number}</div>
                    <div className="text-xs text-silver-400 mt-1">{item.days_since} days</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-electric-900/50 to-charcoal-700 rounded-xl border border-electric-500/30">
              <div className="text-sm text-silver-300 font-medium mb-2">Total Draws</div>
              <div className="text-3xl font-bold text-electric-400">{stats.total_draws || 0}</div>
            </div>
            <div className="p-5 bg-gradient-to-br from-orange-900/50 to-charcoal-700 rounded-xl border border-orange-500/30">
              <div className="text-sm text-silver-300 font-medium mb-2">Average Jackpot</div>
              <div className="text-3xl font-bold text-orange-400">
                {stats.average_jackpot ? `₱${(stats.average_jackpot / 1000000).toFixed(1)}M` : 'N/A'}
              </div>
            </div>
          </div>

          {stats.date_range && (
            <div className="p-5 bg-gradient-to-br from-charcoal-700 to-charcoal-600 rounded-xl border border-silver-600/30">
              <div className="text-sm text-silver-300 mb-2 font-medium">Date Range</div>
              <div className="text-electric-300 font-semibold">
                {new Date(stats.date_range.start).toLocaleDateString()} - {new Date(stats.date_range.end).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;

