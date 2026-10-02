import React from 'react';
import { TbAlertTriangle, TbCircleCheck, TbInfoCircle, TbX } from 'react-icons/tb';

const TONES = {
  info: {
    Icon: TbInfoCircle,
    box: 'border-electric-400/25 bg-electric-500/[0.08] text-electric-100',
    icon: 'text-electric-300',
  },
  success: {
    Icon: TbCircleCheck,
    box: 'border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-100',
    icon: 'text-emerald-300',
  },
  warning: {
    Icon: TbAlertTriangle,
    box: 'border-amber-400/25 bg-amber-500/[0.08] text-amber-100',
    icon: 'text-amber-300',
  },
  error: {
    Icon: TbAlertTriangle,
    box: 'border-red-400/30 bg-red-500/[0.08] text-red-100',
    icon: 'text-red-300',
  },
};

/** Inline status message. Replaces window.alert so feedback stays in context. */
const Notice = ({ tone = 'info', title, children, onDismiss, action, className = '' }) => {
  const t = TONES[tone] || TONES.info;
  const Icon = t.Icon;
  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${t.box} ${className}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${t.icon}`} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1 leading-relaxed">
        {title && <p className="font-semibold text-white">{title}</p>}
        {children && <div className="break-words opacity-90">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg opacity-70 hover:bg-white/10 hover:opacity-100"
          aria-label="Dismiss"
        >
          <TbX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Notice;
