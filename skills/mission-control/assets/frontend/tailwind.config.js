/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#151520',
        card: '#1f1f2e',
        accent: '#2a2a3f',
        highlight: '#6366f1',
        text: '#f1f5f9',
        muted: '#94a3b8',
      }
    },
  },
  plugins: [],
}
