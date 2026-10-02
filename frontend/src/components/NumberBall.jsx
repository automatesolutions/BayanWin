import React from 'react';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-base',
  lg: 'h-14 w-14 text-lg',
};

const TONES = {
  accent: 'bg-orange-gradient text-charcoal-950 shadow-ball',
  muted: 'border border-white/10 bg-charcoal-600 text-silver-100',
};

const NumberBall = ({ number, size = 'md', tone = 'accent' }) => (
  <span
    className={`${SIZES[size] || SIZES.md} ${TONES[tone] || TONES.accent} inline-flex shrink-0 select-all items-center justify-center rounded-full font-mono font-semibold tabular`}
  >
    {String(number).padStart(2, '0')}
  </span>
);

export default NumberBall;
