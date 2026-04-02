/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface': '#060e20',
        'surface-low': '#091328',
        'surface-high': '#141f38',
        'primary': '#4F46E5',  // Indigo
        'secondary': '#A855F7', // Purple
        'tertiary': '#22D3EE', // Cyan
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
