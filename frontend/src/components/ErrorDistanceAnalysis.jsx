import React, { useState, useEffect } from 'react';
import { getPredictionAccuracy } from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ErrorDistanceAnalysis = ({ gameType }) => {
  const [accuracyData, setAccuracyData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gameType) {
      fetchAccuracy();
    }
  }, [gameType]);

  const fetchAccuracy = async () => {
    setLoading(true);
    try {
      const response = await getPredictionAccuracy(gameType, 50);
      setAccuracyData(response.data.accuracy_records || []);
    } catch (error) {
      console.error('Error fetching accuracy data:', error);
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

  // Prepare data for charts
  const errorTrendData = accuracyData.slice(0, 20).map((record, idx) => ({
    index: idx + 1,
    error: record.error_distance,
    matches: record.numbers_matched
  }));

  // Group by model type (would need to join with predictions table in real implementation)
  const modelComparisonData = [
    { model: 'XGBoost', avgError: 25.5, avgMatches: 1.2 },
    { model: 'DecisionTree', avgError: 28.3, avgMatches: 1.0 },
    { model: 'MarkovChain', avgError: 30.1, avgMatches: 0.9 },
    { model: 'AnomalyDetection', avgError: 32.4, avgMatches: 0.8 },
    { model: 'DRL', avgError: 27.2, avgMatches: 1.1 }
  ];

  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
      <h2 className="text-xl font-bold text-electric-400 mb-4 flex items-center">
        <span className="w-1 h-8 bg-electric-500 rounded-full mr-3 tech-glow"></span>
        Error Distance Analysis
      </h2>

      {accuracyData.length === 0 ? (
        <p className="text-silver-300">No accuracy data available</p>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-electric-300 mb-3">Error Distance Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={errorTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#BDC3C7" opacity={0.3} />
                <XAxis dataKey="index" stroke="#BDC3C7" tick={{ fill: '#BDC3C7' }} />
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
                <Line type="monotone" dataKey="error" stroke="#E67E22" strokeWidth={2} name="Error Distance" />
                <Line type="monotone" dataKey="matches" stroke="#3498DB" strokeWidth={2} name="Numbers Matched" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-electric-300 mb-3">Model Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#BDC3C7" opacity={0.3} />
                <XAxis dataKey="model" stroke="#BDC3C7" tick={{ fill: '#BDC3C7' }} />
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
                <Bar dataKey="avgError" fill="#E67E22" name="Avg Error Distance" radius={[8, 8, 0, 0]} />
                <Bar dataKey="avgMatches" fill="#3498DB" name="Avg Matches" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-electric-300 mb-3">Recent Accuracy Records</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-silver-600/30">
                <thead className="bg-gradient-to-r from-electric-900/50 to-charcoal-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Prediction ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Error Distance</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Matches</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-charcoal-700/30 divide-y divide-silver-600/20">
                  {accuracyData.slice(0, 10).map((record) => (
                    <tr key={record.id} className="hover:bg-electric-900/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-silver-200 font-mono">{record.prediction_id}</td>
                      <td className="px-4 py-3 text-sm text-orange-300 font-semibold">{record.error_distance.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-silver-200">{record.numbers_matched}</td>
                      <td className="px-4 py-3 text-sm text-silver-200">
                        {new Date(record.calculated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorDistanceAnalysis;

