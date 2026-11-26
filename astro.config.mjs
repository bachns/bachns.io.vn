import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bachns.io.vn',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: false,
      transformers: [{ pre(node) { node.properties['data-lang'] = this.options.lang; } }],
    },
  },
});
