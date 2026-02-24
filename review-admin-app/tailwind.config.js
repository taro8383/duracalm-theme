/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f6',
          100: '#f9ebe5',
          200: '#f3d5c9',
          300: '#e8b49f',
          400: '#db877b',
          500: '#d87e71',
          600: '#c45a50',
          700: '#a34542',
          800: '#873b39',
          900: '#703534',
        }
      }
    },
  },
  plugins: [],
}
