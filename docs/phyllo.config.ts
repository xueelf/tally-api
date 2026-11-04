import { defineConfig } from '@phyllo/core';

export default defineConfig({
  theme: 'phyllo-theme-docs',
  title: 'Counterflare',
  description:
    'A lightweight web counter with SVG images and a JSON API, powered by Cloudflare Workers and D1.',
  lang: 'en-US',
  search: true,
  redirects: {
    '/': '/en',
  },
});
