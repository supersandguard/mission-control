/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a2e',
        card: '#16213e',
        accent: '#0f3460',
        highlight: '#e94560',
        text: '#eeeeee',
        muted: '#888888'
      }
    },
  },
  plugins: [],
}