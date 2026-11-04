---
title: Counterflare
description: A lightweight web counter with SVG images and a JSON API, running on Cloudflare Workers and D1.
layout: home

nav:
  - label: Guide
    sidebar:
      - label: Getting started
        items:
          - href: /en/quick-start
          - href: /en/deploy
  - label: Reference
    sidebar:
      - label: API
        items:
          - href: /en/api

hero:
  title: Counterflare
  description: A lightweight web counter with SVG images and a JSON API, running on Cloudflare Workers and D1.
  image:
    src: /counters/docs/counterflare.svg?theme=gelbooru
    alt: Counterflare visit counter
  actions:
    - label: Getting started
      href: /en/quick-start
    - label: Deploy
      href: /en/deploy
    - label: API reference
      href: /en/api

features:
  - title: Embed an SVG
    description: Add an image URL to Markdown or HTML. Choose from the bundled counter themes.
  - title: Use JSON
    description: Record visits with POST and read counts with GET for your own components.
  - title: Atomic Counts
    description: Total visits and distinct IPs update in one D1 transaction. Raw IP addresses are not stored.
  - title: Built for Cloudflare
    description: One Worker serves the counter and documentation, with D1 as its only database.
---
