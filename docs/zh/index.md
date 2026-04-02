---
layout: home

hero:
  name: Tally API
  text: 轻量级访问计数器
  tagline: 基于 Cloudflare Pages & KV 的高性能计数器，适用于 GitHub README、博客和社区。
  actions:
    - theme: brand
      text: 快速上手
      link: /zh/getting-started
    - theme: alt
      text: API 参考
      link: /zh/api

features:
  - title: 边缘原生性能
    details: 运行于 Cloudflare Pages Functions 边缘节点。KV 写入通过 waitUntil 非阻塞执行，每个响应都尽可能快速。
  - title: 带主题的 SVG 计数器
    details: 返回像素艺术风格的 SVG 计数器，支持暗色模式。可选择多个主题，非法主题值自动降级为默认主题。
  - title: 零依赖
    details: 纯 TypeScript，无运行时依赖包。图片尺寸直接从二进制头部解析，无需任何图像处理库。
---

## 鸣谢

SVG 计数器主题及生成逻辑受 [journey-ad](https://github.com/journey-ad) 的 [Moe Counter](https://github.com/journey-ad/Moe-Counter) 项目启发。
