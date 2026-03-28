import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { postSankeyGraph } from '../services/api';

function predictionsForSankey(predictions) {
  if (!predictions) return {};
  const o = {};
  Object.entries(predictions).forEach(([k, v]) => {
    if (v && typeof v === 'object' && Array.isArray(v.numbers) && v.numbers.length === 6) {
      o[k] = { numbers: v.numbers };
    }
  });
  return o;
}

/** Simple two-column ribbon diagram: hot/cold band → models */
const HotModelSankey = ({ gameType, predictions }) => {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  const sankeyPayload = useMemo(
    () => (predictions ? predictionsForSankey(predictions) : {}),
    [predictions]
  );
  const hasSankeyInput = Boolean(gameType && Object.keys(sankeyPayload).length);

  useEffect(() => {
    if (!hasSankeyInput) return;
    const payload = sankeyPayload;

    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await postSankeyGraph(gameType, payload);
        if (cancelled) return;
        setError(null);
        draw(data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.detail || e.message);
      }
    };

    const draw = (sankeyData) => {
      const el = ref.current;
      if (!el) return;
      const w = el.clientWidth || 600;
      const h = 360;
      d3.select(el).selectAll('*').remove();
      const svg = d3.select(el).append('svg').attr('width', w).attr('height', h).attr('viewBox', [0, 0, w, h]);

      const nodes = sankeyData.nodes || [];
      const links = sankeyData.links || [];
      if (!nodes.length || !links.length) {
        svg.append('text').attr('x', 16).attr('y', 28).attr('fill', '#94a3b8').text('No Sankey data');
        return;
      }

      const leftNodes = nodes.filter((n) => n.id === 'hot_band' || n.id === 'cold_band');
      const rightNodes = nodes.filter((n) => n.id.startsWith('model_'));
      const xL = 32;
      const xR = w - 140;
      const ly = d3.scalePoint().domain(leftNodes.map((n) => n.id)).range([48, h - 48]);
      const ry = d3.scalePoint().domain(rightNodes.map((n) => n.id)).range([40, h - 40]);

      const maxVal = d3.max(links, (d) => d.value) || 1;
      const sw = d3.scaleLinear().domain([0, maxVal]).range([2, 14]);

      const linkG = svg.append('g').attr('fill', 'none');

      links.forEach((L) => {
        const srcN = nodes.find((n) => n.id === L.source);
        const tgtN = nodes.find((n) => n.id === L.target);
        if (!srcN || !tgtN) return;
        const y0 = srcN.id.startsWith('model') ? ry(srcN.id) : ly(srcN.id);
        const y1 = tgtN.id.startsWith('model') ? ry(tgtN.id) : ly(tgtN.id);
        const x0 = srcN.id.startsWith('model') ? xR : xL;
        const x1 = tgtN.id.startsWith('model') ? xR : xL;
        const pth = d3.path();
        pth.moveTo(x0, y0);
        pth.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1);
        linkG
          .append('path')
          .attr('d', pth.toString())
          .attr('stroke', '#e67e22')
          .attr('stroke-opacity', 0.55)
          .attr('stroke-width', sw(L.value));
      });

      leftNodes.forEach((n) => {
        const g = svg.append('g').attr('transform', `translate(${xL},${ly(n.id)})`);
        g.append('rect').attr('x', -8).attr('y', -12).attr('width', 100).attr('height', 24).attr('rx', 4).attr('fill', '#1e3a5f');
        g.append('text').attr('x', 42).attr('y', 4).attr('text-anchor', 'middle').attr('fill', '#e2e8f0').attr('font-size', 11).text(n.label);
      });

      rightNodes.forEach((n) => {
        const g = svg.append('g').attr('transform', `translate(${xR},${ry(n.id)})`);
        g.append('rect').attr('x', -50).attr('y', -12).attr('width', 100).attr('height', 24).attr('rx', 4).attr('fill', '#334155');
        g.append('text').attr('x', 0).attr('y', 4).attr('text-anchor', 'middle').attr('fill', '#f8fafc').attr('font-size', 10).text(n.label);
      });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [gameType, hasSankeyInput, sankeyPayload]);

  return (
    <div className="bg-charcoal-800 rounded-xl border border-silver-600/30 p-4">
      <h3 className="text-lg font-bold text-electric-400 mb-2">Hot band → models (D3)</h3>
      <p className="text-xs text-silver-400 mb-2">Flow from hot/other buckets into each model&apos;s current pick.</p>
      {error && <p className="text-red-400 text-sm">{String(error)}</p>}
      {!hasSankeyInput && !error && (
        <div className="w-full min-h-[360px] rounded-lg border border-dashed border-silver-600/40 bg-charcoal-900/50 flex items-center justify-center px-6 text-center">
          <p className="text-sm text-silver-400 max-w-md">
            {!predictions
              ? 'This chart needs the latest model picks. Use Generate predictions above, then the hot vs other flow into each model appears here.'
              : 'No six-number model picks were found in the current response (models may have errored). Generate again or check the prediction panel.'}
          </p>
        </div>
      )}
      {hasSankeyInput && <div ref={ref} className="w-full min-h-[360px]" />}
    </div>
  );
};

export default HotModelSankey;
