import React, { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, ScrollSmoother, ScrollTrigger, DESKTOP_MOTION } from './gsap';

/**
 * GSAP ScrollSmoother for desktop pointers. Touch devices and reduced-motion
 * users keep native scrolling. Fixed UI (header, cookie banner) must live
 * outside this wrapper because the content layer is transformed.
 */
const SmoothScroll = ({ children }) => {
  const wrapper = useRef(null);
  const content = useRef(null);
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(DESKTOP_MOTION, () => {
      const smoother = ScrollSmoother.create({
        wrapper: wrapper.current,
        content: content.current,
        smooth: 1,
        effects: true,
        normalizeScroll: false,
      });
      return () => smoother.kill();
    });
    return () => mm.revert();
  }, []);

  // New routes start at the top; #anchors scroll to their target.
  useLayoutEffect(() => {
    const smoother = ScrollSmoother.get();
    if (hash) {
      const el = document.querySelector(hash);
      if (el) (smoother ? smoother.scrollTo(el, true, 'top 80px') : el.scrollIntoView({ behavior: 'smooth' }));
    } else if (smoother) {
      smoother.scrollTop(0);
    } else {
      window.scrollTo(0, 0);
    }
    // Lazy routes change page height after mount.
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => clearTimeout(id);
  }, [pathname, hash]);

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content" ref={content} className="flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
};

/** Scroll to an element, through the smoother when it is active. */
export const scrollToElement = (el) => {
  if (!el) return;
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(el, true, 'top 80px');
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default SmoothScroll;
