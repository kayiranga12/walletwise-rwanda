/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B35", // Coral Orange
        secondary: "#F7931E", // Bright Yellow
        success: "#4CAF50", // Green
        info: "#2196F3", // Blue
        // Goal colors
        purple: "#9C27B0",
        pink: "#E91E63",
        cyan: "#00BCD4",
        lemon: "#FFEB3B",
        deepOrange: "#FF5722",
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'sans-serif'],
      },
      animation: {
        'bounce-short': 'bounce 1s infinite',
        'fade-in-up': 'fade-in-up 0.3s ease-out both',
        'pop': 'pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pop: {
          '0%': { opacity: 0, transform: 'scale(0.6)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
