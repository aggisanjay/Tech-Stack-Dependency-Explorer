/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d0d0d',
          raised: '#1a1a1a',
          overlay: '#141414',
          modal: '#111111',
        },
        accent: {
          DEFAULT: '#00d4d4',
          dim: '#00a3a3',
          glow: 'rgba(0, 212, 212, 0.15)',
          muted: 'rgba(0, 212, 212, 0.08)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.07)',
          subtle: 'rgba(255, 255, 255, 0.04)',
          bright: 'rgba(255, 255, 255, 0.12)',
          accent: 'rgba(0, 212, 212, 0.3)',
        },
        // Keep brand colors as aliases so existing Tailwind classes still resolve
        brand: {
          50: '#e0fffe',
          100: '#b3fffc',
          200: '#80fff9',
          300: '#4dfff6',
          400: '#00d4d4',
          500: '#00d4d4',
          600: '#00b3b3',
          700: '#009999',
          800: '#007a7a',
          900: '#005c5c',
          950: '#003d3d',
        },
        cyan: {
          400: '#00d4d4',
          500: '#00b3b3',
        },
      },
      fontFamily: {
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(0, 212, 212, 0.25)',
        'glow-md': '0 0 25px -5px rgba(0, 212, 212, 0.35)',
        'glow-cyan': '0 0 20px -4px rgba(0, 212, 212, 0.3)',
        'card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
