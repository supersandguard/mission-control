/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#12121a',
        card: '#1a1a28',
        accent: '#2a2a3a',
        highlight: '#6366f1',
        text: '#e5e7eb',
        muted: '#6b7280',
      }
    },
  },
  plugins: [],
}
