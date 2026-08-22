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
        background: '#05070d',
        surface: 'rgba(255, 255, 255, 0.045)',
        'surface-strong': 'rgba(255, 255, 255, 0.085)',
        'surface-card': 'rgba(10, 15, 26, 0.65)',
        border: 'rgba(255, 255, 255, 0.10)',
        'border-strong': 'rgba(255, 255, 255, 0.18)',
        eye: {
          bg: '#05070d',
          elevated: '#0a0f18',
          primary: '#4de7ff',
          'primary-soft': 'rgba(77, 231, 255, 0.16)',
          secondary: '#9b7cff',
          'secondary-soft': 'rgba(155, 124, 255, 0.16)',
          success: '#55e6a5',
          warning: '#ffc857',
          danger: '#ff5c7a',
          info: '#65a7ff',
          text: '#eef7ff',
          muted: '#8ea1b7',
          dim: '#617084',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -3px rgba(77, 231, 255, 0.45)',
        'glow-secondary': '0 0 20px -3px rgba(155, 124, 255, 0.45)',
        'glow-danger': '0 0 20px -3px rgba(255, 92, 122, 0.45)',
        'glow-warning': '0 0 20px -3px rgba(255, 200, 87, 0.45)',
        'glow-success': '0 0 20px -3px rgba(85, 230, 165, 0.45)',
        'liquid-card': 'inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 20px 50px rgba(0, 0, 0, 0.40)',
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
      }
    },
  },
  plugins: [],
}
