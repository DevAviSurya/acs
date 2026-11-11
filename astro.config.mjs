// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TODO: confirm production domain (kept in sync with src/config/site.ts)
  // before launch — this backs canonical URLs, OG tags, and the sitemap.
  site: 'https://www.attributecorporatesolutions.com',
  vite: {
    plugins: [tailwindcss()]
  }
});