/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: { 
      extend: {
        colors: {
          blue: {
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
          },
          gray: {
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          },
        },
      },
    },
    plugins: [],
  };
