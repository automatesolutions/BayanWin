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
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-electric-500/40 bg-charcoal-900/95 backdrop-blur">
      <div className="container mx-auto px-4 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs sm:text-sm text-silver-200 leading-relaxed max-w-4xl">
          We use necessary cookies to run BayanWin and optional cookies for analytics and ad personalization. You can
          choose your preferences now and update them later in our{' '}
          <Link to="/privacy" className="text-electric-300 underline hover:text-electric-200">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={actions.rejectOptional}
            className="px-3 py-2 rounded-md border border-silver-600 text-silver-200 text-xs sm:text-sm hover:bg-charcoal-800"
          >
            Reject optional
          </button>
          <button
            type="button"
            onClick={actions.analyticsOnly}
            className="px-3 py-2 rounded-md border border-electric-500/60 text-electric-200 text-xs sm:text-sm hover:bg-electric-700/20"
          >
            Analytics only
          </button>
          <button
            type="button"
            onClick={actions.acceptAll}
            className="px-3 py-2 rounded-md bg-electric-500 text-charcoal-900 font-semibold text-xs sm:text-sm hover:bg-electric-400"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
