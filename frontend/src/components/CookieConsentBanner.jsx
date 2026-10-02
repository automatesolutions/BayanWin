import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONSENT_STORAGE_KEY } from '../utils/cookieConsent';

const readConsent = () => {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveConsent = (preferences) => {
  const payload = {
    preferences,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: payload }));
};

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const current = readConsent();
    if (!current) {
      setVisible(true);
    }
  }, []);

  const actions = useMemo(
    () => ({
      acceptAll: () => {
        saveConsent({ necessary: true, analytics: true, personalization: true });
        setVisible(false);
      },
      rejectOptional: () => {
        saveConsent({ necessary: true, analytics: false, personalization: false });
        setVisible(false);
      },
      analyticsOnly: () => {
        saveConsent({ necessary: true, analytics: true, personalization: false });
        setVisible(false);
      },
    }),
    []
  );

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      <div className="container mx-auto flex flex-col gap-4 rounded-2xl border border-white/10 bg-charcoal-700 p-4 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.7)] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-silver-300">
          We use necessary cookies to run BayanWin, plus optional ones for analytics and ad personalization. You can
          change this any time. See our{' '}
          <Link to="/privacy" className="link">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0">
          <button type="button" onClick={actions.rejectOptional} className="btn-ghost">
            Reject optional
          </button>
          <button type="button" onClick={actions.analyticsOnly} className="btn-secondary">
            Analytics only
          </button>
          <button type="button" onClick={actions.acceptAll} className="btn-primary">
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
