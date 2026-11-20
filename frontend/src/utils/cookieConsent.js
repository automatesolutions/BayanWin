/** Matches CookieConsentBanner storage shape */
export const CONSENT_STORAGE_KEY = 'bayanwin_cookie_consent_v1';

/** Fired by the footer's "Cookie settings" link to reopen the banner. */
export const OPEN_CONSENT_EVENT = 'open-cookie-preferences';

export function readCookieConsentPreferences() {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.preferences ?? null;
  } catch {
    return null;
  }
}

/** Ad personalization scripts load only when user opted into personalization (incl. "Accept all"). */
export function isPersonalizationConsentGranted() {
  const prefs = readCookieConsentPreferences();
  return prefs?.personalization === true;
}
