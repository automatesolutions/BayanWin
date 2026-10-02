import React from 'react';

const Spinner = ({ className = 'h-5 w-5', label = 'Loading' }) => (
  <span role="status" className="inline-flex items-center">
    <span
      className={`animate-spin rounded-full border-2 border-white/15 border-t-electric-400 ${className}`}
      aria-hidden
    />
    <span className="sr-only">{label}</span>
  </span>
);

export default Spinner;
