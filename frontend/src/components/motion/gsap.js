import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin);

/** Shared motion tokens (see .claude/skills/bayanwin-design). */
export const EASE = 'expo.out';
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
export const DESKTOP_MOTION = '(prefers-reduced-motion: no-preference) and (min-width: 768px) and (pointer: fine)';

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin };
