import React, { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getMarkovEdgesGraph } from '../services/api';

const DISPLAY_EDGE_CAP = 64;
const HEIGHT = 460;

const MarkovGraph = ({ gameType }) => {
  const ref = useRef(null);
  const rawId = useId();
  const markerId = `mk-arr-${rawId.replace(/[^a-zA-Z0-9-_]/g, '')}`;
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!gameType) return;
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await getMarkovEdgesGraph(gameType);
        if (cancelled) return;
        setMeta({ pairs: data.transition_pairs, edge_count: data.edges?.length || 0 });
        setError(null);
        draw(data.edges || []);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.detail || e.message);
      }
    };

    const draw = (edges) => {
      const el = ref.current;
      if (!el) return;
      const w = Math.max(el.clientWidth || 600, 320);
      const h = HEIGHT;
      d3.select(el).selectAll('*').remove();
      const svg = d3.select(el).append('svg').attr('width', w).attr('height', h).attr('viewBox', [0, 0, w, h]).attr('class', 'max-w-full');

      const defs = svg.append('defs');
      defs.append('radialGradient')
        .attr('id', `viz-bg-mv-${markerId}`)
        .attr('cx', '50%')
        .attr('cy', '45%')
        .attr('r', '75%')
        .call((g) => {
          g.append('stop').attr('offset', '0%').attr('stop-color', '#161d2a');
          g.append('stop').attr('offset', '100%').attr('stop-color', '#0e1218');
        });

      svg.append('rect').attr('width', w).attr('height', h).attr('fill', `url(#viz-bg-mv-${markerId})`).attr('rx', 8);

      // userSpaceOnUse: marker size does NOT blow up with thick strokes
      defs
        .append('marker')
        .attr('id', markerId)
        .attr('markerUnits', 'userSpaceOnUse')
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('refX', 6)
        .attr('refY', 3.5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,0 L7,3.5 L0,7 Z')
        .attr('fill', '#7dd3fc')
        .attr('opacity', 0.85);

      if (!edges.length) {
        svg.append('text').attr('x', w / 2).attr('y', h / 2).attr('text-anchor', 'middle').attr('fill', '#64748b').text('No transition data');
        return;
      }

      const cap = edges.slice(0, DISPLAY_EDGE_CAP);
      const weights = cap.map((e) => e.weight || 0);
      const wMax = d3.max(weights) || 1;
      const wScale = d3.scaleSqrt().domain([0, wMax]).range([0.5, 2.4]);
      const oScale = d3.scaleLinear().domain([0, wMax]).range([0.14, 0.38]);

      const idSet = new Set();
      cap.forEach((e) => {
        idSet.add(e.source);
        idSet.add(e.target);
      });
      const nodes = Array.from(idSet).map((id) => ({ id }));
      const nodeById = new Map(nodes.map((n) => [n.id, n]));
      const links = cap.map((e) => ({
        source: nodeById.get(e.source),
        target: nodeById.get(e.target),
        value: e.weight,
      }));

      const nodeR = 12;

      const sim = d3
        .forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d) => d.id).distance(62).strength(0.5))
        .force('charge', d3.forceManyBody().strength(-340))
        .force('center', d3.forceCenter(w / 2, h / 2))
        .force('collision', d3.forceCollide().radius(24))
        .alphaDecay(0.022)
        .velocityDecay(0.35);

      const linkG = svg.append('g').attr('fill', 'none');

      const line = linkG
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#64748b')
        .attr('stroke-linecap', 'round')
        .attr('marker-end', `url(#${markerId})`);

      const node = svg
        .append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .style('cursor', 'grab')
        .call(
          d3
            .drag()
            .on('start', (event, d) => {
              if (!event.active) sim.alphaTarget(0.25).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on('drag', (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on('end', (event, d) => {
              if (!event.active) sim.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );

      node
        .append('circle')
        .attr('r', nodeR)
        .attr('fill', '#0c1220')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.25)
        .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))');

      node
        .append('text')
        .text((d) => d.id)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', '#e2e8f0')
        .attr('font-size', 11)
        .attr('font-weight', '600')
        .attr('font-variant-numeric', 'tabular-nums')
        .style('pointer-events', 'none');

      sim.on('tick', () => {
        line.each(function (d) {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const padS = nodeR + 3;
          const padT = nodeR + 10;
          const x1 = d.source.x + (dx / len) * padS;
          const y1 = d.source.y + (dy / len) * padS;
          const x2 = d.target.x - (dx / len) * padT;
          const y2 = d.target.y - (dy / len) * padT;
          d3.select(this).attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2);
        })
          .attr('stroke-width', (d) => wScale(d.value || 0))
          .attr('stroke-opacity', (d) => oScale(d.value || 0));

        node.attr('transform', (d) => `translate(${d.x},${d.y})`);
      });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [gameType, markerId]);

  return (
    <div className="rounded-xl border border-slate-600/40 bg-[#0f1419] p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <h3 className="text-base font-semibold tracking-tight text-sky-300/95 mb-1">Cross-draw transitions</h3>
      <p className="text-[11px] leading-relaxed text-slate-400 mb-3">
        Directed flow between consecutive draws (top {DISPLAY_EDGE_CAP} links). Advisory only.
        {meta && (
          <span className="text-slate-500">
            {' '}
            — {meta.edge_count} available, {meta.pairs || 0} pair types in data.
          </span>
        )}
      </p>
      {error && <p className="text-red-400/90 text-sm mb-2">{String(error)}</p>}
      <div ref={ref} className="w-full min-h-[460px] rounded-lg overflow-hidden" />
    </div>
  );
};

export default MarkovGraph;
