import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  server: {
    port: process.env.PORT || 4321
  },
  vite: {
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..']
      }
    }
  }
});
