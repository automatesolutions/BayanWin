import React, { useState, useEffect } from 'react';
import { getPredictionAccuracy, getGaussianDistribution, autoCalculateAccuracy } from '../services/api';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart } from 'recharts';
import { TbCalculator, TbChartLine } from 'react-icons/tb';
import CardHeader from './ui/CardHeader';
import EmptyState from './ui/EmptyState';
import Notice from './ui/Notice';
import Spinner from './ui/Spinner';
import { CHART, tooltipStyle, legendStyle, gridProps, axisProps } from '../utils/chartTheme';

const ErrorDistanceAnalysis = ({ gameType }) => {
  const [accuracyData, setAccuracyData] = useState([]);
  const [gaussianData, setGaussianData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [autoCalculating, setAutoCalculating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('error'); // 'error' or 'gaussian'
  const [calcNotice, setCalcNotice] = useState(null); // { tone, text }

  useEffect(() => {
    if (!gameType) {
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [accuracyRes] = await Promise.all([
          getPredictionAccuracy(gameType, 50),
          fetchGaussianData(),
        ]);
        if (cancelled) {
          return;
        }
        const records = accuracyRes.data.accuracy_records || [];
        setAccuracyData(records);

        if (records.length > 0) {
          setStatusMessage('');
          setAutoCalculating(false);
          return;
        }

        setAutoCalculating(true);
        setStatusMessage('Matching predictions to results...');
        try {
          const calcResponse = await autoCalculateAccuracy(gameType);
          if (cancelled) {
            return;
          }
          if (calcResponse.data.success && calcResponse.data.total_calculated > 0) {
            setStatusMessage(`Matched ${calcResponse.data.total_calculated} predictions to draws.`);
            const refresh = await getPredictionAccuracy(gameType, 50);
            if (!cancelled) {
              setAccuracyData(refresh.data.accuracy_records || []);
            }
            setTimeout(() => {
              if (!cancelled) {
                setAutoCalculating(false);
                setStatusMessage('');
              }
            }, 1500);
          } else {
            setStatusMessage(
              calcResponse.data.message ||
                'No matches found. Make sure you have predictions and results with matching dates.'
            );
            setAutoCalculating(false);
          }
        } catch (error) {
          if (!cancelled) {
            setStatusMessage(error.response?.data?.detail || error.message || 'Calculation failed');
            setAutoCalculating(false);
            console.error('Auto-calculation failed:', error);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage('Error checking accuracy data');
          console.error('Error checking accuracy data:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
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

  const handleAutoCalculate = async () => {
    setCalculating(true);
    setCalcNotice(null);
    try {
      const response = await autoCalculateAccuracy(gameType);
      await fetchAccuracy();
      if (response.data.success && response.data.total_calculated > 0) {
        setCalcNotice({ tone: 'success', text: `Matched ${response.data.total_calculated} predictions to draws.` });
      } else if (response.data.success) {
        setCalcNotice({
          tone: 'info',
          text:
            response.data.message ||
            "Nothing new to match. Every prediction is already scored, or its draw hasn't happened yet.",
        });
      } else {
        setCalcNotice({ tone: 'warning', text: response.data.message || 'The check finished but no records were created.' });
      }
    } catch (error) {
      console.error('Error auto-calculating accuracy:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message;
      setCalcNotice({ tone: 'error', text: `Couldn't score predictions. ${errorMsg}` });
    } finally {
      setCalculating(false);
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

  const header = (
    <CardHeader
      icon={TbChartLine}
      title="Accuracy & distribution"
      description="How far past picks landed from the real draws, and how draw sums are spread."
    />
  );

  if (loading) {
    return (
      <section className="card" aria-busy="true">
        {header}
        <div className="skeleton h-10 rounded-xl" />
        <div className="skeleton mt-5 h-60 rounded-xl" />
      </section>
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

  // Normal curve evaluated at each histogram bin centre, so bars and line share one x-axis.
  const sumStats = gaussianData?.statistics?.sum;
  const sumValues = gaussianData?.distribution_data?.map((d) => d.sum) || [];
  const histBinWidth = sumValues.length && sumHistogram.length
    ? (Math.max(...sumValues) - Math.min(...sumValues)) / sumHistogram.length
    : 0;
  const histogramWithCurve = sumHistogram.map((b) => {
    if (!sumStats?.std) return b;
    const z = (b.bin - sumStats.mean) / sumStats.std;
    const pdf = Math.exp(-0.5 * z * z) / (sumStats.std * Math.sqrt(2 * Math.PI));
    return { ...b, y: Number((pdf * sumValues.length * histBinWidth).toFixed(2)) };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-white/10 bg-charcoal-800 p-3 text-sm shadow-tech-lg">
          <p className="mb-1 font-semibold text-white">Draw {new Date(data.date).toLocaleDateString()}</p>
          <p className="font-mono text-silver-300">{data.numbers?.join(' · ')}</p>
          <p className="mt-1 text-silver-400">
            Sum <span className="font-mono text-orange-300">{data.y}</span> · log(product){' '}
            <span className="font-mono text-electric-300">{data.x.toFixed(2)}</span>
          </p>
          {data.winners > 0 ? (
            <p className="mt-2 font-semibold text-emerald-300">
              {data.winners} jackpot winner{data.winners > 1 ? 's' : ''}
              {data.jackpot > 0 && (
                <span className="font-normal text-silver-400"> · ₱{(data.jackpot / 1000000).toFixed(1)}M</span>
              )}
            </p>
          ) : (
            <p className="mt-2 text-xs text-silver-500">No jackpot winner</p>
          )}
        </div>
      );
    }
    return null;
  };

  const TABS = [
    ['error', 'Error distance'],
    ['gaussian', 'Sum distribution'],
  ];

  return (
    <section className="card">
      {header}

      <div role="tablist" aria-label="Analysis view" className="tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`eda-tab-${id}`}
            aria-selected={activeTab === id}
            aria-controls={`eda-panel-${id}`}
            onClick={() => setActiveTab(id)}
            className="tab"
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'error' && (
        <div role="tabpanel" id="eda-panel-error" aria-labelledby="eda-tab-error" className="space-y-4">
          {calcNotice && (
            <Notice tone={calcNotice.tone} onDismiss={() => setCalcNotice(null)}>
              {calcNotice.text}
            </Notice>
          )}

          {accuracyData.length === 0 ? (
            autoCalculating ? (
              <div className="card-inset flex items-start gap-3" aria-live="polite">
                <Spinner className="h-5 w-5" />
                <div>
                  <p className="font-medium text-white">Scoring past predictions…</p>
                  {statusMessage && <p className="mt-1 text-sm text-silver-400">{statusMessage}</p>}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={TbCalculator}
                title="No scored predictions yet"
                action={
                  <button type="button" onClick={handleAutoCalculate} disabled={calculating} className="btn-secondary btn-sm">
                    {calculating ? <Spinner className="h-4 w-4" /> : <TbCalculator aria-hidden />}
                    {calculating ? 'Scoring…' : 'Score predictions now'}
                  </button>
                }
              >
                {statusMessage ||
                  'Each prediction is scored against the first real draw 1 to 7 days after it was made. Run the models, then check back after the next draw.'}
              </EmptyState>
            )
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-white">Error distance, last 20 predictions</h3>
                <p className="mb-3 text-sm text-silver-400">Lower is closer. Matches counts how many numbers hit.</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={errorTrendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="index" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip {...tooltipStyle} cursor={{ stroke: CHART.grid }} />
                    <Legend {...legendStyle} />
                    <Line type="monotone" dataKey="error" stroke={CHART.accent} strokeWidth={2} dot={false} name="Error distance" />
                    <Line type="monotone" dataKey="matches" stroke={CHART.primary} strokeWidth={2} dot={false} name="Numbers matched" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Model comparison</h3>
                  <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-2xs font-medium text-amber-200">
                    Illustrative values, not live data
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={modelComparisonData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="model" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip {...tooltipStyle} />
                    <Legend {...legendStyle} />
                    <Bar dataKey="avgError" fill={CHART.accent} name="Avg error distance" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="avgMatches" fill={CHART.primary} name="Avg matches" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-white">Recent scored predictions</h3>
                <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Prediction</th>
                        <th scope="col" className="text-right">Error</th>
                        <th scope="col" className="text-right">Matches</th>
                        <th scope="col" className="text-right">Scored</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accuracyData.slice(0, 10).map((record) => (
                        <tr key={record.id}>
                          <td className="max-w-[10rem] truncate font-mono text-xs text-silver-400" title={record.prediction_id}>
                            {record.prediction_id}
                          </td>
                          <td className="text-right font-mono font-semibold text-orange-300 tabular">
                            {record.error_distance.toFixed(2)}
                          </td>
                          <td className="text-right font-mono tabular">{record.numbers_matched}</td>
                          <td className="whitespace-nowrap text-right">{new Date(record.calculated_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'gaussian' && (
        <div role="tabpanel" id="eda-panel-gaussian" aria-labelledby="eda-tab-gaussian">
          {!gaussianData || !gaussianData.distribution_data || gaussianData.distribution_data.length === 0 ? (
            <EmptyState icon={TbChartLine} title="No distribution data yet">
              This fills in once draw history has loaded for this game.
            </EmptyState>
          ) : (
            <div className="space-y-8">
              {gaussianData.statistics && (
                <dl className="grid grid-cols-2 gap-3">
                  <div className="card-inset">
                    <dt className="text-sm text-silver-400">Sum of six numbers</dt>
                    <dd className="mt-1 font-mono text-lg font-semibold text-orange-300 tabular">
                      μ {gaussianData.statistics.sum.mean.toFixed(1)} · σ {gaussianData.statistics.sum.std.toFixed(1)}
                    </dd>
                    <dd className="mt-0.5 text-xs text-silver-500 tabular">
                      Range {gaussianData.statistics.sum.min}–{gaussianData.statistics.sum.max}
                    </dd>
                  </div>
                  <div className="card-inset">
                    <dt className="text-sm text-silver-400">Product of six numbers</dt>
                    <dd className="mt-1 font-mono text-lg font-semibold text-electric-300 tabular">
                      μ {gaussianData.statistics.product.mean.toExponential(2)}
                    </dd>
                    <dd className="mt-0.5 text-xs text-silver-500 tabular">
                      σ {gaussianData.statistics.product.std.toExponential(2)}
                    </dd>
                  </div>
                </dl>
              )}

              <div>
                <h3 className="mb-1 text-sm font-semibold text-white">Product vs. sum, every draw</h3>
                <p className="mb-3 text-sm text-silver-400">
                  Each dot is one draw. Green diamonds had a jackpot winner ({drawsWithWinners.length} of{' '}
                  {drawsWithWinners.length + drawsWithoutWinners.length}).
                </p>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
                    <CartesianGrid {...gridProps} vertical />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="log(product)"
                      {...axisProps}
                      domain={['auto', 'auto']}
                      label={{ value: 'log(product)', position: 'insideBottom', offset: -16, fill: CHART.axis, fontSize: 12 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Sum"
                      {...axisProps}
                      label={{ value: 'Sum', angle: -90, position: 'insideLeft', fill: CHART.axis, fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: CHART.grid }} />
                    {gaussianData.statistics && (
                      <ReferenceLine
                        y={gaussianData.statistics.sum.mean}
                        stroke={CHART.accent}
                        strokeDasharray="4 4"
                        label={{ value: `mean ${gaussianData.statistics.sum.mean.toFixed(1)}`, fill: CHART.accent, fontSize: 12, position: 'insideTopRight' }}
                      />
                    )}
                    <Scatter name="No jackpot winner" data={drawsWithoutWinners} fill={CHART.primary} fillOpacity={0.45} />
                    <Scatter name="Jackpot winner" data={drawsWithWinners} fill={CHART.positive} fillOpacity={0.95} shape="diamond" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-white">Sum distribution vs. normal curve</h3>
                <p className="mb-3 text-sm text-silver-400">Bars are real draw counts. The line is the normal curve with the same mean and spread.</p>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={histogramWithCurve} margin={{ top: 8, right: 8, bottom: 24, left: -8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis
                      dataKey="bin"
                      {...axisProps}
                      label={{ value: 'Sum of numbers', position: 'insideBottom', offset: -16, fill: CHART.axis, fontSize: 12 }}
                    />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Legend {...legendStyle} verticalAlign="top" height={32} />
                    <Bar dataKey="count" fill={CHART.primary} fillOpacity={0.7} name="Draws" radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="y" stroke={CHART.accent} strokeWidth={2.5} dot={false} name="Normal curve" />
                  </ComposedChart>
                </ResponsiveContainer>

                {gaussianData.statistics && (
                  <p className="mt-4 rounded-xl border border-white/[0.06] bg-charcoal-900/60 p-4 text-sm text-silver-300">
                    Draw sums
                    {Math.abs(
                      gaussianData.statistics.sum.mean -
                        (gaussianData.statistics.sum.min + gaussianData.statistics.sum.max) / 2
                    ) < gaussianData.statistics.sum.std ? (
                      <span className="font-semibold text-emerald-300"> roughly follow </span>
                    ) : (
                      <span className="font-semibold text-orange-300"> drift from </span>
                    )}
                    a normal distribution across{' '}
                    <span className="font-mono tabular">{gaussianData.statistics.sum.count}</span> draws. That&apos;s
                    expected for random draws and doesn&apos;t make any sum more likely next time.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ErrorDistanceAnalysis;
