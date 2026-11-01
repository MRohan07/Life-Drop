/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lifedrop: {
          white: '#FFFFFF',
          bg: '#F8FAFC',
          primary: '#C1121F',
          emergency: '#E63946',
          darkRed: '#8B0000',
          navy: '#172033',
          navyLight: '#243048',
          text: '#1F2937',
          secondary: '#64748B',
          success: '#16A34A',
          warning: '#F59E0B',
          info: '#2563EB',
          purple: '#7C3AED',
        },
      },
      boxShadow: {
        '3d-subtle': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        '3d-card': '0 14px 30px rgba(23, 32, 51, 0.08), 0 4px 6px rgba(0, 0, 0, 0.02)',
        '3d-hover': '0 20px 35px -4px rgba(193, 18, 31, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'emergency-glow': '0 0 25px rgba(230, 57, 70, 0.4), 0 0 10px rgba(230, 57, 70, 0.2)',
        'success-glow': '0 0 25px rgba(22, 163, 74, 0.35)',
      },
      keyframes: {
        pulseRadar: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        floatDrop: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(2deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        }
      },
      animation: {
        'pulse-radar': 'pulseRadar 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float-drop': 'floatDrop 5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
