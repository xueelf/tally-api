---
layout: home

hero:
  name: Tally API
  text: A lightweight view counter
  tagline: High-performance hit counter for GitHub READMEs, blogs, and communities — powered by Cloudflare Pages & KV.
  actions:
    - theme: brand
      text: Getting Started
      link: /getting-started
    - theme: alt
      text: API Reference
      link: /api

features:
  - title: Edge-native Performance
    details: Runs on Cloudflare Pages Functions at the edge. KV writes are non-blocking via waitUntil, so every response is as fast as possible.
  - title: SVG Counter with Themes
    details: Returns a pixel-art animated SVG counter with full dark-mode support. Choose from multiple themes or fall back gracefully to the default.
  - title: Zero Dependencies
    details: Pure TypeScript, no runtime packages. Image dimensions are parsed directly from binary headers — no image processing libraries needed.
---

## Acknowledgements

The SVG counter theme and generation logic are inspired by [Moe Counter](https://github.com/journey-ad/Moe-Counter) by [journey-ad](https://github.com/journey-ad).
