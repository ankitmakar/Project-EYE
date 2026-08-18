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
        background: '#090d16',
        surface: '#0f172a',
        'surface-card': '#131e36',
        'surface-border': '#1e293b',
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        cyber: {
          blue: '#00f0ff',
          green: '#00ff66',
          red: '#ff0055',
          amber: '#ffaa00',
          purple: '#9d00ff'
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 15px -3px rgba(0, 240, 255, 0.3)',
        'glow-red': '0 0 15px -3px rgba(255, 0, 85, 0.3)',
        'glow-green': '0 0 15px -3px rgba(0, 255, 102, 0.3)',
      }
    },
  },
  plugins: [],
}
