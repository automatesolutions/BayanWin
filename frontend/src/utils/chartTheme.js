/** Shared Recharts styling so every chart matches the design system tokens. */
export const CHART = {
  primary: '#5EAEFF', // electric-400
  accent: '#F59331', // orange-500
  positive: '#34D399',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#768295', // silver-600
  tick: { fill: '#A6B0BE', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' },
};

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#131A25',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#EDF1F5',
    boxShadow: '0 8px 24px -12px rgba(0,0,0,0.6)',
    fontSize: 13,
  },
  labelStyle: { color: '#A6B0BE', marginBottom: 4 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

export const legendStyle = { wrapperStyle: { color: '#A6B0BE', fontSize: 13, paddingTop: 8 } };

export const gridProps = { strokeDasharray: '3 3', stroke: CHART.grid, vertical: false };

export const axisProps = { stroke: CHART.axis, tick: CHART.tick, tickLine: false, axisLine: { stroke: CHART.grid } };
