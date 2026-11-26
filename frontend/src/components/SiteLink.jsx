import React, { forwardRef } from 'react';
import { Link as RouterLink, NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { isAdEligiblePath } from '../constants/adsense';

const pathOf = (to) => (typeof to === 'string' ? to : to?.pathname || '').split(/[?#]/)[0] || '/';

/**
 * Ad pages carry the AdSense script in their prerendered <head>. A client-side
 * route change would keep that script running on the next page, so any link
 * that starts or ends on an ad page is a full page load. Links between pages
 * without ads stay client-side.
 */
function useFullLoad(to) {
  const { pathname } = useLocation();
  return isAdEligiblePath(pathname) || isAdEligiblePath(pathOf(to));
}

export const Link = forwardRef(function Link({ to, reloadDocument, ...props }, ref) {
  const fullLoad = useFullLoad(to);
  return <RouterLink ref={ref} to={to} reloadDocument={fullLoad || reloadDocument} {...props} />;
});

export const NavLink = forwardRef(function NavLink({ to, reloadDocument, ...props }, ref) {
  const fullLoad = useFullLoad(to);
  return <RouterNavLink ref={ref} to={to} reloadDocument={fullLoad || reloadDocument} {...props} />;
});
