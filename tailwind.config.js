/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      colors: {
        // Clean, modern palette - not AI-like
        'brand-primary': '#000000',
        'brand-secondary': '#ffffff',
        'brand-accent': '#0066ff',
      },
      spacing: {
        // Fine-tuned spacing for professional look
        'safe': '1rem',
      },
    },
  },
  plugins: [],
};
