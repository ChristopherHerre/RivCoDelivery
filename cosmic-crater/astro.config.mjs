// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://rivcodelivery.com',
  integrations: [mdx(), sitemap(), react()],
  vite: {
    build: {
      rollupOptions: {
        external: ['tailwindcss/version.js']
      }
    },
    ssr: {
      noExternal: ['flowbite-react']
    }
  }
});