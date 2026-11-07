/** @type {import('tailwindcss').Config} */

// Every colour is a role backed by a CSS variable in src/index.css, so light and
// dark are two compositions of the same roles rather than one theme inverted.
const role = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        bg: role('bg'),
        surface: role('surface'),
        raised: role('raised'),
        sunk: role('sunk'),
        ink: role('ink'),
        'ink-2': role('ink-2'),
        muted: role('muted'),
        line: role('line'),
        brand: {
          // fill: buttons, active chips, slider tracks
          DEFAULT: role('brand'),
          press: role('brand-press'),
          // brand-coloured text and icons on the canvas
          ink: role('brand-ink'),
          // text that sits on brand-soft / brand-wash
          deep: role('brand-deep'),
          mid: role('brand-mid'),
          soft: role('brand-soft'),
          wash: role('brand-wash'),
        },
        good: { DEFAULT: role('good'), ink: role('good-ink'), soft: role('good-soft') },
        warn: { DEFAULT: role('warn'), ink: role('warn-ink'), soft: role('warn-soft') },
        // 1 -> 10. Cool = light / easy / calm, warm = heavy / watch out.
        // Fills only; score text goes through .tone-text so it stays readable.
        scale: {
          1: '#14A08A',
          2: '#29A472',
          3: '#50A95B',
          4: '#7CAE48',
          5: '#A3AF3B',
          6: '#C6A435',
          7: '#DE8C35',
          8: '#E6713C',
          9: '#DE5440',
          10: '#CE3B3F',
        },
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        bar: 'var(--shadow-bar)',
        glow: 'var(--shadow-glow)',
      },
      borderRadius: {
        xl2: '1.15rem',
        '4xl': '1.9rem',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'rise-in': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(0.94)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'sheet-up': { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        bump: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.28)' }, '100%': { transform: 'scale(1)' } },
        'draw-in': { '0%': { strokeDashoffset: 'var(--len, 40)' }, '100%': { strokeDashoffset: '0' } },
        nudge: { '0%': { transform: 'scale(1)' }, '35%': { transform: 'scale(1.14)' }, '100%': { transform: 'scale(1)' } },
        ring: { '0%': { opacity: '0.55', transform: 'scale(0.85)' }, '100%': { opacity: '0', transform: 'scale(1.7)' } },
        burst: {
          '0%': { opacity: '0', transform: 'translate(0, 0) scale(0.4)' },
          '15%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translate(var(--dx), var(--dy)) scale(1)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.42s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.3s ease both',
        'pop-in': 'pop-in 0.36s cubic-bezier(0.16,1,0.3,1) both',
        'sheet-up': 'sheet-up 0.42s cubic-bezier(0.16,1,0.3,1) both',
        bump: 'bump 0.38s cubic-bezier(0.16,1,0.3,1)',
        'draw-in': 'draw-in 0.5s cubic-bezier(0.16,1,0.3,1) 0.12s both',
        nudge: 'nudge 0.28s cubic-bezier(0.16,1,0.3,1)',
        ring: 'ring 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both',
        burst: 'burst 0.9s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}
