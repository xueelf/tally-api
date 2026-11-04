---
title: Counterflare
description: 基于 Cloudflare Workers 与 D1 的轻量级访问计数器，提供 SVG 图片与 JSON API。
layout: home

nav:
  - label: 指南
    sidebar:
      - label: 开始使用
        items:
          - href: /zh/quick-start
          - href: /zh/deploy
  - label: 参考
    sidebar:
      - label: API
        items:
          - href: /zh/api

hero:
  title: Counterflare
  description: 基于 Cloudflare Workers 与 D1 的轻量级访问计数器，提供 SVG 图片与 JSON API。
  image:
    src: /counters/docs/counterflare.svg?theme=gelbooru
    alt: Counterflare 访问计数器
  actions:
    - label: 快速上手
      href: /zh/quick-start
    - label: 部署
      href: /zh/deploy
    - label: API 参考
      href: /zh/api

features:
  - title: 嵌入 SVG
    description: 在 Markdown 或 HTML 中添加图片地址，从内置主题中选择喜欢的样式。
  - title: 使用 JSON
    description: 通过 POST 记录访问、GET 读取计数，轻松接入自己的组件。
  - title: 原子计数
    description: 访问总数与独立 IP 数在同一 D1 事务中更新，不保存原始 IP 地址。
  - title: 专为 Cloudflare 构建
    description: 一个 Worker 提供计数接口和文档，D1 是唯一的数据库。
---
