/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'node-batsman': '#00e5ff',
        'node-bowler': '#ff6d00',
        'node-allrounder': '#aa00ff',
        'node-condition': '#00e676',
        'node-pitch': '#78909c',
        'bg-primary': '#0a0e1a',
        'bg-secondary': '#0d1220',
        'accent': '#7c4dff',
        'danger': '#ff1744',
        'success': '#00e676',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124, 77, 255, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(124, 77, 255, 0.8), 0 0 50px rgba(124, 77, 255, 0.3)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
