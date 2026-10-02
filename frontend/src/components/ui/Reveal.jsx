import React, { useLayoutEffect, useRef } from 'react';
import { gsap, EASE, MOTION_OK } from '../motion/gsap';

/**
 * Scroll-triggered rise. Transform only: content is visible at rest, so nothing
 * is hidden from readers, crawlers, or anyone who never scrolls. Children marked
 * [data-reveal] stagger; otherwise the wrapper itself moves.
 */
const Reveal = ({ as: Tag = 'div', children, className = '', y = 32, stagger = 0.06, ...rest }) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const items = el.querySelectorAll('[data-reveal]');
      gsap.from(items.length ? items : el, {
        y,
        duration: 1.1,
        ease: EASE,
        stagger,
        clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
    return () => mm.revert();
  }, [y, stagger]);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
};

export default Reveal;
