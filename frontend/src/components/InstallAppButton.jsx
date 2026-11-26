import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { TbDeviceMobileDown, TbShare2, TbSquarePlus } from 'react-icons/tb';
import { isAdEligiblePath } from '../constants/adsense';
import {
  dismissInstall,
  getInstallServerSnapshot,
  getInstallSnapshot,
  promptInstall,
  subscribeInstall,
} from '../utils/installPrompt';

/**
 * "Add to home screen" button.
 * - Chrome and Edge (Android, desktop): opens the browser's install dialog.
 * - iPhone and iPad: no install API, so it opens a sheet with the Share steps.
 * Renders nothing when already installed, dismissed in the last 14 days, during
 * prerender, and on ad pages, so it never sits next to an ad.
 */
function InstallAppButton({ className = 'btn-ghost' }) {
  const { pathname } = useLocation();
  const { mode, mobile } = useSyncExternalStore(subscribeInstall, getInstallSnapshot, getInstallServerSnapshot);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (mode === 'hidden' || isAdEligiblePath(pathname)) return null;

  const onClick = () => (mode === 'prompt' ? promptInstall() : setSheetOpen(true));
  const closeSheet = () => {
    setSheetOpen(false);
    dismissInstall();
  };

  return (
    <>
      <button type="button" onClick={onClick} className={className}>
        <TbDeviceMobileDown aria-hidden />
        {mobile ? 'Add to your phone' : 'Install BayanWin'}
      </button>
      {sheetOpen && <IosInstallSheet onClose={closeSheet} />}
    </>
  );
}

/** Bottom sheet with the Safari steps. Portalled to <body>: the smooth-scroll layer is transformed. */
function IosInstallSheet({ onClose }) {
  const doneRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    doneRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      // One focusable control: keep Tab inside the sheet.
      if (e.key === 'Tab') {
        e.preventDefault();
        doneRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-charcoal-950/70" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-sheet-title"
        className="safe-bottom safe-x relative w-full max-w-md rounded-t-2xl border border-b-0 border-white/10 bg-charcoal-700 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.7)]"
      >
        <div className="space-y-4 p-5 sm:p-6">
          <h2 id="install-sheet-title" className="card-title">
            Add BayanWin to your home screen
          </h2>
          <p className="text-sm leading-relaxed text-silver-300">Tap Share, then Add to Home Screen.</p>
          <ol className="space-y-3 text-sm text-silver-300">
            <li className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-electric-300">
                <TbShare2 className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <strong className="text-white">Share</strong> is in the Safari toolbar.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-electric-300">
                <TbSquarePlus className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <strong className="text-white">Add to Home Screen</strong> is in the list. Scroll down if you don&apos;t
                see it.
              </span>
            </li>
          </ol>
          <p className="text-xs text-silver-500">BayanWin then opens full screen from its icon, like an app.</p>
          <button ref={doneRef} type="button" onClick={onClose} className="btn-secondary w-full">
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default InstallAppButton;
