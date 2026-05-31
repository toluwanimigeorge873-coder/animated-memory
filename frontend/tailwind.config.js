/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: { DEFAULT: '#c9a84c', light: '#e8c97a', bright: '#f5e4a8' },
        parchment: { DEFAULT: '#f0ead8', dark: '#b8ad98' },
        ink: { DEFAULT: '#0e0c0a', 2: '#171512', 3: '#1f1c18', 4: '#282420' },
      },
    },
  },
  plugins: [],
};
