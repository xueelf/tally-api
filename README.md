# Tally API

A lightweight, edge-native view counter for GitHub READMEs, blogs, and communities — powered by Cloudflare Pages Functions & KV.

Read this in other languages: English | [中文](./README.zh.md)

## Usage

Embed a pixel-art SVG counter using the hosted service at **[tally.yuki.sh](https://tally.yuki.sh)**:

```md
![counter](https://tally.yuki.sh/api/hits/github/tally-api.svg)
```

With a custom theme:

```md
![counter](https://tally.yuki.sh/api/hits/github/tally-api.svg?theme=moebooru-h)
```

Or fetch the raw count as JSON:

```
GET https://tally.yuki.sh/api/hits/github/tally-api.json
→ { "count": 42 }
```

## API

| Endpoint                           | Description                           |
| ---------------------------------- | ------------------------------------- |
| `GET /api/hits/:id/:resource`      | Increment and return count as JSON    |
| `GET /api/hits/:id/:resource.json` | Same as above, explicit format        |
| `GET /api/hits/:id/:resource.svg`  | Return count as a pixel-art SVG image |

**Query parameters (SVG only)**

| Parameter | Default    | Description                                       |
| --------- | ---------- | ------------------------------------------------- |
| `theme`   | `moebooru` | Visual theme. Available: `moebooru`, `moebooru-h` |

## Self-hosting

```sh
# 1. Clone and install
git clone https://github.com/xueelf/tally-api.git && cd tally-api && bun install

# 2. Create a KV namespace
bunx wrangler kv namespace create KV_TALLY
# → copy the returned id into wrangler.json

# 3. Build and deploy
bun run docs:build && bunx wrangler pages deploy
```

See the [documentation](https://tally.yuki.sh) for the full self-hosting guide.

## Acknowledgements

The SVG counter theme and generation logic are inspired by [Moe Counter](https://github.com/journey-ad/Moe-Counter) by [journey-ad](https://github.com/journey-ad).

## License

[MIT](LICENSE)
