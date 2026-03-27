/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        delphi: {
          keppel: '#2BBAA5',
          celadon: '#93D3AE',
          vanilla: '#FAECB6',
          orange: '#F9A822',
          giants: '#F96635',
        }
      }
    },
  },
  plugins: [],
}
