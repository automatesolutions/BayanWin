import React from 'react';

/** Consistent empty / zero-data state: icon, one-line title, what to do next. */
const EmptyState = ({ icon: Icon, title, children, action, compact = false }) => (
  <div className={`flex flex-col items-center text-center ${compact ? 'py-6' : 'py-10'}`}>
    {Icon && (
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-silver-400">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
    )}
    <p className="font-display text-base font-semibold text-white">{title}</p>
    {children && <p className="mt-1 max-w-sm text-sm leading-relaxed text-silver-400">{children}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
