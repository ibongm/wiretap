/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        oled: {
          bg: '#000000',
          surface: '#121212',
          card: '#181818',
          border: '#27272a',
          text: '#ffffff',
          muted: '#a1a1aa'
        },
        slate: {
          950: '#0b1120',
        },
        editorial: {
          bg: '#FAF8F5',
          surface: '#F4EFEA',
          card: '#FFFFFF',
          border: '#E7E0D8',
          text: '#1C1917',
          muted: '#78716C'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'Cambria', 'Times New Roman', 'serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
