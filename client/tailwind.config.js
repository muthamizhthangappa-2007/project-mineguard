/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coal: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        safety: {
          amber: '#F59E0B',
          red: '#EF4444',
          green: '#10B981',
          blue: '#2563EB',
          darkBlue: '#1E3A8A',
        }
      }
    },
  },
  plugins: [],
}
