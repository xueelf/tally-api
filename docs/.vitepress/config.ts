import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Tally API',
  description:
    'A lightweight hit counter for GitHub READMEs, blogs, and personal sites, powered by Cloudflare Pages Functions and KV.',
  outDir: '../dist',

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Getting Started', link: '/quick-start' },
          { text: 'Deploy', link: '/deploy' },
          { text: 'API Reference', link: '/api' },
        ],
        sidebar: [
          {
            text: 'Guide',
            items: [
              { text: 'Getting Started', link: '/quick-start' },
              { text: 'Deploy', link: '/deploy' },
            ],
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
        outline: {
          label: '本页目录',
        },
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色主题',
        darkModeSwitchTitle: '切换到深色主题',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '快速上手', link: '/zh/quick-start' },
          { text: '部署', link: '/zh/deploy' },
          { text: 'API 参考', link: '/zh/api' },
        ],
        sidebar: [
          {
            text: '指引',
            items: [
              { text: '快速上手', link: '/zh/quick-start' },
              { text: '部署', link: '/zh/deploy' },
            ],
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
