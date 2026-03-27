/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
<<<<<<< HEAD
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
=======
    "./src/**/*.{ts,tsx,js,jsx}",
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9
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
