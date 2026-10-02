import React, { useLayoutEffect, useRef } from 'react';
import { gsap, SplitText, MOTION_OK } from './gsap';

/**
 * Text that brightens word by word as it scrolls through the viewport.
 * At rest (no JS, reduced motion) it is fully legible; dimmed words never drop
 * below 40% opacity.
 */
const ScrollWords = ({ as: Tag = 'p', children, className = '' }) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const split = SplitText.create(ref.current, { type: 'words', aria: 'auto' });
      gsap.fromTo(
        split.words,
        { opacity: 0.4 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: ref.current, start: 'top 80%', end: 'bottom 45%', scrub: true },
        }
      );
      return () => split.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
};

export default ScrollWords;
