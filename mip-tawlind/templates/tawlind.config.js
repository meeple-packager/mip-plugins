/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{html,js,jsx,ts,tsx,vue}",
    "!./node_modules/**",
    "!./dist/**"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#22c55e'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}