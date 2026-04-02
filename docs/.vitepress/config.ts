import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Tally API',
  description:
    'A high-performance view counter for blogs and communities, powered by Cloudflare Pages.',
  outDir: '../dist',

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'API Reference', link: '/api' },
        ],
        sidebar: [
          {
            text: 'Guide',
            items: [{ text: 'Getting Started', link: '/getting-started' }],
          },
          {
            text: 'Reference',
            items: [{ text: 'API Reference', link: '/api' }],
          },
        ],
      },
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '快速上手', link: '/zh/getting-started' },
          { text: 'API 参考', link: '/zh/api' },
        ],
        sidebar: [
          {
            text: '指引',
            items: [{ text: '快速上手', link: '/zh/getting-started' }],
          },
          {
            text: '参考',
            items: [{ text: 'API 参考', link: '/zh/api' }],
          },
        ],
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/xueelf/tally-api' },
    ],
  },
});
