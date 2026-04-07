/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0f0f1a',
          surface: '#1a1a2e',
          blue: '#4A6FA5',
          green: '#6A994E',
          red: '#BC4749',
          gold: '#E8A838'
        }
      },
      fontFamily: {
        japanese: ['Hiragino Kana', 'Meiryo', 'Yu Gothic', 'sans-serif']
      }
    }
  },
  plugins: []
}
