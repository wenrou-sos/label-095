/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      }
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d4af37',
          50: '#faf5e4',
          100: '#f5e6a8',
          200: '#eed16a',
          300: '#e6bc3c',
          400: '#d4af37',
          500: '#b8942d',
          600: '#8b6914',
          700: '#6b4e0f',
          800: '#4a350a',
          900: '#2a1e06',
        },
        secondary: {
          DEFAULT: '#1a1f2e',
          50: '#f5f6f8',
          100: '#e4e6ec',
          200: '#b7bccb',
          300: '#8a92aa',
          400: '#5d6889',
          500: '#303e68',
          600: '#1a1f2e',
          700: '#151a26',
          800: '#10141d',
          900: '#0a0d14',
        },
        accent: {
          wine: '#722f37',
          green: '#1f4d3c',
          purple: '#2e1a47',
          bronze: '#8b5a2b',
          brown: '#4a3728',
        },
        neutral: {
          ivory: '#f5f0e8',
          warmgray: '#8b8680',
          darkgray: '#252b3d',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'gold-sm': '0 0 10px rgba(212, 175, 55, 0.2)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(212, 175, 55, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
