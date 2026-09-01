import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#FAFAF7',
          warm: '#F3EFE7',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#14120F',
          2: '#6B6560',
          3: '#B5B0A8',
        },
        gold: {
          DEFAULT: '#B8965A',
          lt: '#D4B07A',
          dk: '#8A6E3A',
        },
        border: {
          DEFAULT: '#E4DFD8',
          lt: '#EEEAE3',
        },
      },
      fontFamily: {
        sans:  ['var(--font-jost)', 'system-ui', 'sans-serif'],
        // Single-family site — see app/layout.tsx. `serif` is aliased to the
        // same face on purpose so a stray font-serif can't quietly drop a
        // Georgia heading back into the page.
        serif: ['var(--font-jost)', 'system-ui', 'sans-serif'],
        logo:  ['Joane', 'Georgia', 'serif'],
      },
      animation: {
        'marquee':            'marquee 30s linear infinite',
        'modal-enter':        'modal-enter 0.4s cubic-bezier(0.34,1.4,0.64,1) forwards',
        'slide-in':           'slide-in 0.38s cubic-bezier(0.4,0,0.2,1) forwards',
        'fade-in':            'fade-in 0.3s ease forwards',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        'modal-enter': {
          from: { opacity: '0', transform: 'translateY(28px) scale(0.96)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      boxShadow: {
        'sm':  '0 2px 16px rgba(20,18,15,0.06)',
        'md':  '0 8px 40px rgba(20,18,15,0.10)',
        'lg':  '0 24px 64px rgba(20,18,15,0.14)',
        'xl':  '0 40px 100px rgba(20,18,15,0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
