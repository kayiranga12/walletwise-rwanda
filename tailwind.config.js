/** @type {import('tailwindcss').Config} */
export default {
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
      },
    },
  },
  plugins: [],
}
