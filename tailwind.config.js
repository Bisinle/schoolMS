import defaultTheme from 'tailwindcss/defaultTheme'
import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    './storage/framework/views/*.blade.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.jsx',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        navy: {
          DEFAULT: '#0b1a34',
          dark: '#081426',
          light: '#0f2247',
        },
        orange: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
          light: '#fb923c',
        },
      },
    },
  },
  plugins: [forms],
}
