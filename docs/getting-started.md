# Getting Started

## Overview

Tally API is a hosted view counter service available at **[tally.yuki.sh](https://tally.yuki.sh)**. No signup or configuration required — just drop a URL into your README or blog post and the counter starts incrementing immediately.

## Embed a Counter

Add the following to any Markdown file:

```md
![counter](https://tally.yuki.sh/api/hits/:id/:resource.svg)
```

Replace `:id` with a namespace (e.g. your GitHub username) and `:resource` with a unique name for this counter (e.g. the repository name):

```md
![counter](https://tally.yuki.sh/api/hits/github/my-repo.svg)
```

### Link the Badge

Wrap it in a link so visitors can click through:

```md
[![counter](https://tally.yuki.sh/api/hits/github/my-repo.svg)](https://github.com/your-username/my-repo)
```

### Choose a Theme

Append `?theme=` to select a visual style:

```md
![counter](https://tally.yuki.sh/api/hits/github/my-repo.svg?theme=moebooru-h)
```

| Theme | Format | Description |
|---|---|---|
| `moebooru` | GIF | Animated pixel-art characters (default) |
| `moebooru-h` | PNG | Alternative moebooru character set |

### Fetch the Raw Count

To read the current hit count as JSON (e.g. for a custom display):

```
GET https://tally.yuki.sh/api/hits/github/my-repo.json
```

```json
{ "count": 42 }
```

---

## Self-hosting

If you prefer to run your own instance, you can deploy Tally API to your own Cloudflare account.

### Prerequisites

- [Cloudflare](https://dash.cloudflare.com/) account (free tier is sufficient)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — included as a dev dependency
- [Bun](https://bun.sh/) runtime

### Steps

**1. Clone and install**

```sh
git clone https://github.com/xueelf/tally-api.git
cd tally-api
bun install
```

**2. Create a KV namespace**

```sh
bunx wrangler kv namespace create KV_TALLY
```

Copy the returned `id` into `wrangler.json`:

```json
"kv_namespaces": [{ "binding": "KV_TALLY", "id": "<your-kv-id>" }]
```

**3. Build the documentation site**

```sh
bun run docs:build
```

This runs `vitepress build docs` and outputs to `dist/`. The theme assets under `docs/public/theme/` are automatically copied into `dist/` by VitePress.

**4. Deploy**

```sh
bunx wrangler pages deploy
```

Wrangler reads `pages_build_output_dir: "./dist"` from `wrangler.json` and deploys both the static documentation site and the API functions.

### Local Development

```sh
bun run dev
```

This builds the VitePress docs and starts `wrangler pages dev ./dist`, serving both the documentation site and the API at `http://localhost:8788`.

| Script       | Command                                           | Purpose                                      |
| ------------ | ------------------------------------------------- | -------------------------------------------- |
| `dev`        | `bun run docs:build && wrangler pages dev ./dist` | Full-stack local dev server (docs + API)     |
| `docs:dev`   | `vitepress dev docs`                              | Live-reload docs authoring                   |
| `docs:build` | `vitepress build docs`                            | Production build (outputs to `dist/`)        |
| `build`      | `wrangler types`                                  | Regenerate `types/worker-configuration.d.ts` |
