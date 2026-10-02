import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TbChartBar, TbClockHour4, TbFlame, TbRefresh, TbSnowflake } from 'react-icons/tb';
import { getStatistics } from '../services/api';
import CardHeader from './ui/CardHeader';
import EmptyState from './ui/EmptyState';
import { CHART, tooltipStyle, gridProps, axisProps } from '../utils/chartTheme';

const TABS = [
  ['frequency', 'Frequency'],
  ['general', 'Overview'],
];

const FrequencyChart = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="number" {...axisProps} interval={0} />
      <YAxis {...axisProps} allowDecimals={false} />
      <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Times drawn']} labelFormatter={(l) => `Number ${l}`} />
      <Bar dataKey="frequency" fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
    </BarChart>
  </ResponsiveContainer>
);

const SubHeading = ({ icon: Icon, children, iconClass }) => (
  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
    <Icon className={`h-4 w-4 ${iconClass}`} aria-hidden />
    {children}
  </h3>
);

const StatisticsPanel = ({ gameType }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('frequency');

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getStatistics(gameType);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [gameType]);

  useEffect(() => {
    if (gameType) fetchStatistics();
  }, [gameType, fetchStatistics]);

  if (!gameType) return null;

  const header = (
    <CardHeader
      icon={TbChartBar}
      title="Number statistics"
      description="How often each number has come up across the full draw history."
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

  if (!stats) {
    return (
      <section className="card">
        {header}
        <EmptyState
          icon={TbChartBar}
          title="Statistics didn't load"
          action={
            <button type="button" onClick={fetchStatistics} className="btn-secondary btn-sm">
              <TbRefresh aria-hidden /> Try again
            </button>
          }
        >
          The server didn't respond. This is usually temporary.
        </EmptyState>
      </section>
    );
  }

  const toChart = (list) => list?.slice(0, 15).map(({ number, frequency }) => ({ number, frequency })) || [];
  const hotNumbersData = toChart(stats.hot_numbers);
  const coldNumbersData = toChart(stats.cold_numbers);

  return (
    <section className="card">
      {header}

      <div role="tablist" aria-label="Statistics view" className="tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`stats-tab-${id}`}
            aria-selected={activeTab === id}
            aria-controls={`stats-panel-${id}`}
            onClick={() => setActiveTab(id)}
            className="tab"
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'frequency' && (
        <div role="tabpanel" id="stats-panel-frequency" aria-labelledby="stats-tab-frequency" className="space-y-8">
          <div>
            <SubHeading icon={TbFlame} iconClass="text-orange-400">Hot numbers · drawn most often</SubHeading>
            <FrequencyChart data={hotNumbersData} color={CHART.accent} />
          </div>

          <div>
            <SubHeading icon={TbSnowflake} iconClass="text-electric-400">Cold numbers · drawn least often</SubHeading>
            <FrequencyChart data={coldNumbersData} color={CHART.primary} />
          </div>

          {stats.overdue_numbers?.length > 0 && (
            <div>
              <SubHeading icon={TbClockHour4} iconClass="text-silver-400">Overdue · longest since last drawn</SubHeading>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                {stats.overdue_numbers.slice(0, 20).map((item) => (
                  <li key={item.number} className="card-inset p-3 text-center">
                    <div className="font-mono text-lg font-semibold text-white tabular">{item.number}</div>
                    <div className="mt-0.5 text-2xs text-silver-500 tabular">{item.days_since} days</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'general' && (
        <div role="tabpanel" id="stats-panel-general" aria-labelledby="stats-tab-general">
          <dl className="grid grid-cols-2 gap-3">
            <div className="card-inset">
              <dt className="text-sm text-silver-400">Total draws</dt>
              <dd className="mt-1 font-mono text-3xl font-semibold text-white tabular">
                {(stats.total_draws || 0).toLocaleString('en-US')}
              </dd>
            </div>
            <div className="card-inset">
              <dt className="text-sm text-silver-400">Average jackpot</dt>
              <dd className="mt-1 font-mono text-3xl font-semibold text-orange-300 tabular">
                {stats.average_jackpot ? `₱${(stats.average_jackpot / 1000000).toFixed(1)}M` : '—'}
              </dd>
            </div>
            {stats.date_range && (
              <div className="card-inset col-span-2">
                <dt className="text-sm text-silver-400">Date range</dt>
                <dd className="mt-1 font-medium text-white">
                  {new Date(stats.date_range.start).toLocaleDateString()} –{' '}
                  {new Date(stats.date_range.end).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </section>
  );
};

export default StatisticsPanel;
