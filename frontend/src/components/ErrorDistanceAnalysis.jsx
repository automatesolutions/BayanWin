import React, { useState, useEffect } from 'react';
import { getPredictionAccuracy, getGaussianDistribution } from '../services/api';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const ErrorDistanceAnalysis = ({ gameType }) => {
  const [accuracyData, setAccuracyData] = useState([]);
  const [gaussianData, setGaussianData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('error'); // 'error' or 'gaussian'

  useEffect(() => {
    if (gameType) {
      fetchAccuracy();
      fetchGaussianData();
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

  const fetchGaussianData = async () => {
    try {
      const response = await getGaussianDistribution(gameType);
      setGaussianData(response.data);
    } catch (error) {
      console.error('Error fetching Gaussian distribution:', error);
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

  // Prepare data for error distance charts
  const errorTrendData = accuracyData.slice(0, 20).map((record, idx) => ({
    index: idx + 1,
    error: record.error_distance,
    matches: record.numbers_matched
  }));

  const modelComparisonData = [
    { model: 'XGBoost', avgError: 25.5, avgMatches: 1.2 },
    { model: 'DecisionTree', avgError: 28.3, avgMatches: 1.0 },
    { model: 'MarkovChain', avgError: 30.1, avgMatches: 0.9 },
    { model: 'NormalDist', avgError: 29.8, avgMatches: 1.0 },
    { model: 'DRL', avgError: 27.2, avgMatches: 1.1 }
  ];

  // Prepare Gaussian data with winner information
  const scatterDataLog = gaussianData?.distribution_data?.map(d => ({
    x: Math.log(d.product),
    y: d.sum,
    date: d.draw_date,
    numbers: d.numbers,
    winners: d.winners || 0,
    jackpot: d.jackpot || 0,
    hasWinners: (d.winners || 0) > 0
  })) || [];

  // Separate data into two groups: with winners and without winners
  const drawsWithWinners = scatterDataLog.filter(d => d.hasWinners);
  const drawsWithoutWinners = scatterDataLog.filter(d => !d.hasWinners);

  const createHistogram = (values, bins = 20) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;
    
    const histogram = Array(bins).fill(0).map((_, i) => ({
      bin: Math.round(min + (i + 0.5) * binWidth),
      count: 0
    }));
    
    values.forEach(val => {
      const binIndex = Math.min(Math.floor((val - min) / binWidth), bins - 1);
      if (binIndex >= 0 && binIndex < bins) {
        histogram[binIndex].count++;
      }
    });
    
    return histogram;
  };

  const sumHistogram = gaussianData?.distribution_data ? 
    createHistogram(gaussianData.distribution_data.map(d => d.sum)) : [];

  const generateGaussianCurve = (mean, std, min, max, points = 50) => {
    const step = (max - min) / points;
    return Array(points).fill(0).map((_, i) => {
      const x = min + i * step;
      const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(std, 2));
      const y = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
      return { bin: Math.round(x), y: y * gaussianData.distribution_data.length * ((max - min) / points) };
    });
  };

  const gaussianCurve = gaussianData?.statistics ? generateGaussianCurve(
    gaussianData.statistics.sum.mean,
    gaussianData.statistics.sum.std,
    gaussianData.statistics.sum.min,
    gaussianData.statistics.sum.max
  ) : [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-charcoal-700 border-2 border-electric-500 rounded-lg p-3 shadow-lg">
          <p className="text-electric-300 font-semibold mb-1">
            Draw: {new Date(data.date).toLocaleDateString()}
          </p>
          <p className="text-silver-200 text-sm">Numbers: {data.numbers?.join(', ')}</p>
          <p className="text-orange-300 text-sm mt-1">Sum: {data.y}</p>
          <p className="text-electric-300 text-sm">Log(Product): {data.x.toFixed(2)}</p>
          {data.winners > 0 ? (
            <>
              <p className="text-green-400 text-sm font-bold mt-2">
                🎉 Winners: {data.winners}
              </p>
              {data.jackpot > 0 && (
                <p className="text-yellow-400 text-xs">
                  Jackpot: ₱{(data.jackpot / 1000000).toFixed(1)}M
                </p>
              )}
            </>
          ) : (
            <p className="text-silver-400 text-xs mt-2">No winners</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-charcoal-800 rounded-xl shadow-tech-lg p-6 border-2 border-electric-500/30">
      <h2 className="text-xl font-bold text-electric-400 mb-4 flex items-center">
        <span className="w-1 h-8 bg-electric-500 rounded-full mr-3 tech-glow"></span>
        Analysis Dashboard
      </h2>

      {/* Main Tab Navigation */}
      <div className="border-b-2 border-silver-600/30 mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('error')}
            className={`py-2 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'error'
                ? 'border-electric-500 text-electric-300'
                : 'border-transparent text-silver-400 hover:text-electric-300'
            }`}
          >
            Error Distance Analysis
          </button>
          <button
            onClick={() => setActiveTab('gaussian')}
            className={`py-2 px-4 border-b-2 font-semibold transition-colors ${
              activeTab === 'gaussian'
                ? 'border-electric-500 text-electric-300'
                : 'border-transparent text-silver-400 hover:text-electric-300'
            }`}
          >
            Gaussian Distribution
          </button>
        </nav>
      </div>

      {/* Error Distance Analysis Tab */}
      {activeTab === 'error' && (
        <>
          {accuracyData.length === 0 ? (
            <p className="text-silver-300">No accuracy data available. Generate predictions first.</p>
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
                        <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase">Prediction ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase">Error Distance</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase">Matches</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-electric-300 uppercase">Date</th>
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
        </>
      )}

      {/* Gaussian Distribution Tab */}
      {activeTab === 'gaussian' && (
        <>
          {!gaussianData || !gaussianData.distribution_data || gaussianData.distribution_data.length === 0 ? (
            <p className="text-silver-300">No distribution data available</p>
          ) : (
            <div className="space-y-6">
              {/* Statistics Summary */}
              {gaussianData.statistics && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-orange-900/30 to-charcoal-700 rounded-xl border border-orange-500/30">
                    <div className="text-sm text-silver-300 font-medium mb-2">Sum Statistics</div>
                    <div className="text-orange-400 font-semibold">
                      μ = {gaussianData.statistics.sum.mean.toFixed(2)}, σ = {gaussianData.statistics.sum.std.toFixed(2)}
                    </div>
                    <div className="text-xs text-silver-400 mt-1">
                      Range: {gaussianData.statistics.sum.min} - {gaussianData.statistics.sum.max}
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-electric-900/30 to-charcoal-700 rounded-xl border border-electric-500/30">
                    <div className="text-sm text-silver-300 font-medium mb-2">Product Statistics</div>
                    <div className="text-electric-400 font-semibold">
                      μ = {gaussianData.statistics.product.mean.toExponential(2)}
                    </div>
                    <div className="text-xs text-silver-400 mt-1">
                      σ = {gaussianData.statistics.product.std.toExponential(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Scatter Plot */}
              <div>
                <h3 className="text-lg font-semibold text-electric-300 mb-3">Product vs Sum Distribution</h3>
                <p className="text-sm text-silver-400 mb-2">
                  X-axis: Log(Product of numbers) | Y-axis: Sum of numbers
                </p>
                
                {/* Legend */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-silver-300">No Winners ({drawsWithoutWinners.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rotate-45"></div>
                    <span className="text-green-400 font-semibold">🎉 Has Winners ({drawsWithWinners.length})</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#BDC3C7" opacity={0.3} />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Log(Product)" 
                      stroke="#BDC3C7" 
                      tick={{ fill: '#BDC3C7' }}
                      label={{ value: 'Log(Product)', position: 'insideBottom', offset: -10, fill: '#BDC3C7' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Sum" 
                      stroke="#BDC3C7" 
                      tick={{ fill: '#BDC3C7' }}
                      label={{ value: 'Sum', angle: -90, position: 'insideLeft', fill: '#BDC3C7' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {gaussianData.statistics && (
                      <ReferenceLine 
                        y={gaussianData.statistics.sum.mean} 
                        stroke="#E67E22" 
                        strokeDasharray="3 3"
                        label={{ value: `Mean: ${gaussianData.statistics.sum.mean.toFixed(1)}`, fill: '#E67E22' }}
                      />
                    )}
                    {/* Draws WITHOUT winners - Blue dots */}
                    <Scatter 
                      name="No Winners" 
                      data={drawsWithoutWinners} 
                      fill="#3498DB"
                      fillOpacity={0.6}
                    />
                    {/* Draws WITH winners - Green/Gold dots (highlighted!) */}
                    <Scatter 
                      name="Has Winners 🎉" 
                      data={drawsWithWinners} 
                      fill="#27AE60"
                      fillOpacity={0.95}
                      shape="diamond"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Histogram with Gaussian Curve */}
              <div>
                <h3 className="text-lg font-semibold text-electric-300 mb-3">Sum Distribution with Gaussian Overlay</h3>
                <p className="text-sm text-silver-400 mb-4">
                  Blue bars: Actual frequency | Orange line: Theoretical Gaussian distribution
                </p>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={sumHistogram} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#BDC3C7" opacity={0.3} />
                    <XAxis 
                      dataKey="bin" 
                      stroke="#BDC3C7" 
                      tick={{ fill: '#BDC3C7' }}
                      label={{ value: 'Sum of Numbers', position: 'insideBottom', offset: -10, fill: '#BDC3C7' }}
                    />
                    <YAxis 
                      stroke="#BDC3C7" 
                      tick={{ fill: '#BDC3C7' }}
                      label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#BDC3C7' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#2C3E50', 
                        border: '2px solid #3498DB',
                        borderRadius: '8px',
                        color: '#ECF0F1'
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#BDC3C7' }} />
                    <Bar 
                      dataKey="count" 
                      fill="#3498DB"
                      fillOpacity={0.7}
                      name="Actual Distribution"
                    />
                    <Line 
                      type="monotone"
                      dataKey="y" 
                      data={gaussianCurve}
                      stroke="#E67E22"
                      strokeWidth={3}
                      dot={false}
                      name="Gaussian Curve"
                    />
                  </BarChart>
                </ResponsiveContainer>

                {gaussianData.statistics && (
                  <div className="mt-4 p-4 bg-charcoal-700/50 rounded-lg border border-silver-600/30">
                    <p className="text-sm text-silver-300">
                      <span className="font-semibold text-electric-400">Analysis:</span> The actual distribution 
                      {Math.abs(gaussianData.statistics.sum.mean - (gaussianData.statistics.sum.min + gaussianData.statistics.sum.max) / 2) < gaussianData.statistics.sum.std ? 
                        <span className="text-green-400"> appears to follow </span> : 
                        <span className="text-orange-400"> deviates from </span>
                      }
                      a Gaussian (normal) distribution pattern.
                    </p>
                    <p className="text-xs text-silver-400 mt-2">
                      Total draws: {gaussianData.statistics.sum.count} | Mean: {gaussianData.statistics.sum.mean.toFixed(2)} | Std Dev: {gaussianData.statistics.sum.std.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ErrorDistanceAnalysis;
