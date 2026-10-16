/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        bg: '#F4F5F9',
        surface: '#FFFFFF',
        sunk: '#EFF1F7',
        ink: '#0E1020',
        'ink-2': '#394056',
        muted: '#747B91',
        line: '#E5E8F0',
        brand: {
          DEFAULT: '#4F46E5',
          deep: '#352FA8',
          mid: '#6D66EE',
          soft: '#E8E7FD',
          wash: '#F3F3FE',
        },
        good: { DEFAULT: '#0E9F7E', soft: '#DFF5EF' },
        warn: { DEFAULT: '#D9534A', soft: '#FDECEA' },
        // 1 -> 10. Cool = light / easy / calm, warm = heavy / watch out.
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
        card: '0 1px 2px rgba(14,16,32,0.04), 0 10px 30px -18px rgba(14,16,32,0.22)',
        lift: '0 2px 6px rgba(14,16,32,0.06), 0 22px 44px -22px rgba(14,16,32,0.32)',
        bar: '0 -10px 30px -18px rgba(14,16,32,0.25)',
      },
      borderRadius: {
        xl2: '1.15rem',
        '4xl': '1.9rem',
      },
      keyframes: {
        'rise-in': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(0.95)' }, '60%': { transform: 'scale(1.015)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'sheet-up': { '0%': { opacity: '0', transform: 'translateY(26px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'rise-in': 'rise-in 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.35s ease both',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'sheet-up': 'sheet-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
