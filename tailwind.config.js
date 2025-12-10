/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
    "./resources/**/*.vue",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFFFFF', // Pure White
          bg: '#F9FAFB',      // Light Grey/Blue
        },
        text: {
          main: '#111827',    // Deep Charcoal
          secondary: '#6B7280', // Cool Grey
        },
        accent: {
          DEFAULT: '#0F172A', // Midnight Blue
          blue: '#2563EB',    // Electric Blue
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '8px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
