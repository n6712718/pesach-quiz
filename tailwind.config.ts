import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ba-blue': {
          50:  '#e8f0fe',
          100: '#c5d8fc',
          200: '#93b8f9',
          300: '#5d94f5',
          400: '#3274ee',
          500: '#1a5ad4',
          600: '#1144b0',
          700: '#0d348a',
          800: '#0a2768',
          900: '#071a4a',
        },
        'ba-gold': '#f5c842',
      },
      fontFamily: {
        sans: ['var(--font-heebo)', 'Heebo', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-gold': 'pulseGold 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        bounceIn: { '0%': { transform: 'scale(0.5)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(245,200,66,0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(245,200,66,0)' } },
      },
    },
  },
  plugins: [],
}

export default config
