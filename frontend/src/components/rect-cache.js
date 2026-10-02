/**
 * Missing helper for Canvas UI's ParticleReveal (the registry item imports
 * `../rect-cache` but does not ship it). Caches an element's bounding rect and
 * refreshes it on scroll/resize so pointer handlers avoid forced layout.
 */
export function createRectCache(element) {
  const cache = { current: element.getBoundingClientRect() };
  let frame = 0;

  const update = () => {
    frame = 0;
    cache.current = element.getBoundingClientRect();
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  window.addEventListener('resize', schedule, { passive: true });
  const observer = new ResizeObserver(schedule);
  observer.observe(element);

  return {
    get current() {
      return cache.current;
    },
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    },
  };
}
