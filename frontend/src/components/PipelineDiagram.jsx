import React, { useLayoutEffect, useRef } from 'react';
import { gsap, MOTION_OK } from './motion/gsap';

/*
 * How a pick is made, as hand-written SVG. Every stroke uses a CSS class or
 * currentColor so colours can be edited in one place and paths animated with
 * GSAP DrawSVG. Two layouts: wide (md+) and tall (mobile).
 */

const MODELS = ['XGBoost', 'Random Forest', 'Markov Chain', 'Normal Dist.', 'NashHotFilter', 'Deep RL'];

const WIDE = {
  viewBox: '0 0 1000 380',
  source: { x: 0, y: 160, w: 190, h: 60 },
  models: MODELS.map((_, i) => ({ x: 300, y: 18 + i * 58, w: 190, h: 42 })),
  miro: { x: 600, y: 156, w: 170, h: 68 },
  out: { x: 850, y: 160, w: 150, h: 60 },
  flow: 'x',
};

const TALL = {
  viewBox: '0 0 360 640',
  source: { x: 70, y: 0, w: 220, h: 56 },
  models: MODELS.map((_, i) => ({ x: i % 2 ? 190 : 10, y: 130 + Math.floor(i / 2) * 62, w: 160, h: 44 })),
  miro: { x: 80, y: 440, w: 200, h: 64 },
  out: { x: 90, y: 580, w: 180, h: 56 },
  flow: 'y',
};

const anchorOut = (n, flow) => (flow === 'x' ? [n.x + n.w, n.y + n.h / 2] : [n.x + n.w / 2, n.y + n.h]);
const anchorIn = (n, flow) => (flow === 'x' ? [n.x, n.y + n.h / 2] : [n.x + n.w / 2, n.y]);

/** Cubic bezier that leaves and enters along the flow direction. */
const curve = (a, b, flow) => {
  const [x1, y1] = a;
  const [x2, y2] = b;
  if (flow === 'x') {
    const mx = (x1 + x2) / 2;
    return `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
  }
  const my = (y1 + y2) / 2;
  return `M${x1} ${y1}C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
};

const Node = ({ n, title, sub, tone = 'default' }) => (
  <g className="pd-node">
    <rect
      x={n.x + 0.5}
      y={n.y + 0.5}
      width={n.w - 1}
      height={n.h - 1}
      rx={12}
      className={tone === 'accent' ? 'pd-box-accent' : tone === 'primary' ? 'pd-box-primary' : 'pd-box'}
    />
    <text x={n.x + n.w / 2} y={n.y + n.h / 2 + (sub ? -4 : 5)} textAnchor="middle" className="pd-title">
      {title}
    </text>
    {sub && (
      <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 15} textAnchor="middle" className="pd-sub">
        {sub}
      </text>
    )}
  </g>
);

const Layout = ({ L, className }) => (
  <svg viewBox={L.viewBox} className={className} role="img" aria-labelledby="pd-title pd-desc">
    <title id="pd-title">How BayanWin makes a pick</title>
    <desc id="pd-desc">
      PCSO draw history feeds six statistical models. Their picks go to Miro, a language-model synthesis step, which
      produces the lines you see along with its caveats.
    </desc>
    <g className="pd-edges" fill="none">
      {L.models.map((m, i) => (
        <path key={`in${i}`} className="pd-edge" d={curve(anchorOut(L.source, L.flow), anchorIn(m, L.flow), L.flow)} />
      ))}
      {L.models.map((m, i) => (
        <path key={`out${i}`} className="pd-edge" d={curve(anchorOut(m, L.flow), anchorIn(L.miro, L.flow), L.flow)} />
      ))}
      <path className="pd-edge pd-edge-strong" d={curve(anchorOut(L.miro, L.flow), anchorIn(L.out, L.flow), L.flow)} />
    </g>
    <Node n={L.source} title="Draw history" sub="every PCSO draw" />
    {L.models.map((m, i) => (
      <Node key={MODELS[i]} n={m} title={MODELS[i]} />
    ))}
    <Node n={L.miro} title="Miro" sub="reads all six" tone="primary" />
    <Node n={L.out} title="Your 7 lines" sub="plus caveats" tone="accent" />
  </svg>
);

const PipelineDiagram = () => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const svgs = ref.current.querySelectorAll('svg');
      svgs.forEach((svg) => {
        gsap.fromTo(
          svg.querySelectorAll('.pd-edge'),
          { drawSVG: '0%' },
          {
            drawSVG: '100%',
            ease: 'none',
            stagger: 0.04,
            scrollTrigger: { trigger: svg, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
          }
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className="pipeline-diagram text-silver-400">
      <Layout L={WIDE} className="hidden h-auto w-full md:block" />
      <Layout L={TALL} className="mx-auto block h-auto w-full max-w-sm md:hidden" />
    </div>
  );
};

export default PipelineDiagram;
