/** @type {import('tailwindcss').Config} */
// BayanWin design system tokens — see .claude/skills/bayanwin-design/SKILL.md.
// Palette names are kept (electric / orange / charcoal / silver) so existing
// class names across the app pick up the refined values automatically.

const electric = {
  DEFAULT: '#3B9EFF',
  50: '#EEF6FF',
  100: '#D9ECFF',
  200: '#B5DAFF',
  300: '#8CC5FF',
  400: '#5EAEFF',
  500: '#3B9EFF',
  600: '#1F7FE0',
  700: '#1963B0',
  800: '#174C85',
  900: '#123A66',
};

const orange = {
  DEFAULT: '#F59331',
  50: '#FFF5EB',
  100: '#FFE8D1',
  200: '#FFCFA0',
  300: '#FDB56E',
  400: '#FBA24D',
  500: '#F59331',
  600: '#DB7718',
  700: '#B35E12',
  800: '#8A4810',
  900: '#66360E',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"General Sans"', 'Satoshi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        // Legacy alias: anything still using font-montserrat gets the display face.
        montserrat: ['"General Sans"', 'Satoshi', 'sans-serif'],
      },
      fontSize: {
        // Type scale (1.2 minor third), body defaults to 16px for readability.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      colors: {
        electric,
        orange,
        // Surfaces: deep ink, slightly blue, low saturation.
        charcoal: {
          DEFAULT: '#1A2331',
          50: '#E9EDF3',
          100: '#CDD5E0',
          200: '#A3AFC0',
          300: '#7A889C',
          400: '#4F5D72',
          500: '#2A3546',
          600: '#222C3B',
          700: '#1A2331',
          800: '#131A25',
          900: '#0C1119',
          950: '#080B11',
        },
        // Text neutrals. Lower steps meet WCAG AA on charcoal-800/900.
        silver: {
          DEFAULT: '#C3CBD6',
          50: '#F7F9FB',
          100: '#EDF1F5',
          200: '#DCE2EA',
          300: '#C3CBD6',
          400: '#A6B0BE',
          500: '#8D98A8',
          600: '#768295',
          700: '#5E6A7D',
          800: '#465166',
          900: '#323B4D',
        },
        primary: electric,
        secondary: orange,
        success: '#34D399',
        error: '#F87171',
      },
      backgroundImage: {
        'tech-gradient': 'linear-gradient(135deg, #131A25 0%, #0C1119 100%)',
        'orange-gradient': 'linear-gradient(180deg, #FBA24D 0%, #DB7718 100%)',
        'hero-glow':
          'radial-gradient(60% 80% at 15% 0%, rgba(59,158,255,0.16) 0%, rgba(12,17,25,0) 60%), radial-gradient(50% 70% at 100% 10%, rgba(245,147,49,0.12) 0%, rgba(12,17,25,0) 60%), linear-gradient(#0C1119, #0C1119)',
      },
      boxShadow: {
        tech: '0 1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.2)',
        'tech-lg': '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        electric: '0 0 0 1px rgba(59,158,255,0.35), 0 8px 24px -12px rgba(59,158,255,0.45)',
        orange: '0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 16px -8px rgba(245,147,49,0.6)',
        ball: 'inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 2px 3px rgba(255,255,255,0.35)',
      },
      borderRadius: {
        card: '1rem',
      },
      maxWidth: {
        prose: '38rem',
      },
    },
  },
  plugins: [],
};
