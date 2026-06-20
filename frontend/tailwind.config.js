/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        darkBg: '#090d16',
        cardBg: '#111827',
        borderBg: '#1f2937',
        brandIndigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#11102f'
        },
        ravo: {
          cream: '#F3F6EB',
          midnight: '#1D1136',
          border: '#2E1A47',
          lavender: '#A48FE1',
          neon: '#4ADE80',
          purple: '#2E1A47',
          lightpurple: '#9A7ED1'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out both',
        'card-enter': 'card-enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scan': 'scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'card-enter': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scan: {
          '0%': { top: '-150px', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        }
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(ellipse at top, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
