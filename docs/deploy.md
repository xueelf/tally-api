# Deploy

If you want your own counter service under a custom domain, deploy Tally API to Cloudflare Pages. The project uses Pages Functions for the API and Cloudflare KV for persistence, so there is no separate database to manage.

## Prerequisites

- A Cloudflare account
- A JavaScript runtime, such as Bun or Node.js

The examples below use Bun because that is what I use personally. If you are only adapting the deployment flow, you can replace the package-manager commands with npm, pnpm, or yarn equivalents.

If Wrangler is not authenticated yet, run `bunx wrangler login` before you create the KV namespace or deploy the site.

## Deploy to Cloudflare Pages

1. Clone the repository and install dependencies:

```sh
git clone https://github.com/xueelf/tally-api.git
cd tally-api
bun install
```

2. Create a KV namespace:

```sh
bunx wrangler kv namespace create KV
```

3. Copy the returned `id` into `kv_namespaces` in `wrangler.json`:

```json
"kv_namespaces": [{ "binding": "KV", "id": "<your KV id>" }]
```

Replace the placeholder with the real namespace ID. Without it, local development and deployment will fail.

4. Generate worker type definitions:

```sh
bun run types
```

5. Build the docs site:

```sh
bun run docs:build
```

6. Deploy to Cloudflare Pages:

```sh
bunx wrangler pages deploy
```

Wrangler uses the `pages_build_output_dir` setting from `wrangler.json`, so the static docs and the API routes under `functions` are deployed together.

## Local Development

```sh
bun run dev
```

This script builds the docs, generates types, and starts `wrangler pages dev ./dist`. Once it is running, open `http://localhost:8788` to test the docs site and API locally.

## Notes

If all you want is your own counter service, the steps above are enough. After that, you can switch the domain, adjust the copy, or pick a different theme if needed.

For route rules, response formats, and error handling, see [API Reference](/api).
