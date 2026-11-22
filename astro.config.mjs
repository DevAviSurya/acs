// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Kept in sync with src/config/site.ts — backs canonical URLs, OG tags,
  // and the sitemap.
  site: 'https://attribute.solutions',
  vite: {
    plugins: [tailwindcss()]
  }
});