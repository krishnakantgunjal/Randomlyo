// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://randomlyo.krishnakantgunjal5.workers.dev',
  output: 'static',
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['crypto'],
    },
  },
});
