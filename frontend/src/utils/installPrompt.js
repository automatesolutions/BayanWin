/**
 * Shared state for "add to home screen". Chrome fires `beforeinstallprompt` once,
 * often before a lazy route mounts, so we catch it at import time (main bundle)
 * and every InstallAppButton reads the same snapshot.
 */
const DISMISS_KEY = 'bayanwin_install_dismissed_at';
const DISMISS_DAYS = 14;

const HIDDEN = Object.freeze({ mode: 'hidden', mobile: false });

let deferredPrompt = null;
let installed = false;
let snapshot = HIDDEN;
const listeners = new Set();

const isBrowser = typeof window !== 'undefined';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// iPadOS reports itself as a Mac, so check for touch as well.
function isIos() {
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1);
}

function isMobile() {
  return window.navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod/.test(window.navigator.userAgent);
}

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function compute() {
  let mode = 'hidden';
  if (!installed && !isStandalone() && !dismissedRecently()) {
    if (deferredPrompt) mode = 'prompt';
    else if (isIos()) mode = 'ios';
  }
  const mobile = isMobile();
  // Same object while nothing changed, as useSyncExternalStore requires.
  if (mode !== snapshot.mode || mobile !== snapshot.mobile) snapshot = { mode, mobile };
  return snapshot;
}

function emit() {
  compute();
  listeners.forEach((fn) => fn());
}

if (isBrowser) {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    emit();
  });
  compute();
}

export function subscribeInstall(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getInstallSnapshot = () => snapshot;

// Prerender and the first hydration pass always render nothing.
export const getInstallServerSnapshot = () => HIDDEN;

export function dismissInstall() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* private mode: hide for this visit only */
  }
  emit();
}

/** Shows Chrome's install dialog. Cancelling it counts as a dismissal. */
export async function promptInstall() {
  if (!deferredPrompt) return;
  const event = deferredPrompt;
  deferredPrompt = null; // Chrome allows one prompt() per event.
  event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === 'accepted') installed = true;
  else dismissInstall();
  emit();
}
