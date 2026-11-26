/** Matches CookieConsentBanner storage shape. prerender.mjs reads the same key in the ad pages' <head>. */
export const CONSENT_STORAGE_KEY = 'bayanwin_cookie_consent_v1';

/** Fired by the footer's "Cookie settings" link to reopen the banner. */
export const OPEN_CONSENT_EVENT = 'open-cookie-preferences';
