# Counterflare

A lightweight web counter running on [Cloudflare Workers](https://developers.cloudflare.com/workers/) and [D1 SQLite Database](https://developers.cloudflare.com/d1/). Embed an SVG counter in a README or webpage, or use the JSON API to record visits and display counts yourself.

Read this in other languages: English | [中文](./README.zh.md)

Each counter tracks total visits and distinct client IPs. Updates and IP deduplication commit in one database transaction. D1 stores SHA-256 IP fingerprints, not raw IP addresses. Counterflare supports Cloudflare only.

## Usage

[Deploy your own instance](./docs/content/en/deploy.md), then replace `https://counter.example.com` in these examples with its URL.

Embed a counter in Markdown:

```md
![counter](https://counter.example.com/counters/github@yourname/readme.svg)
```

Each SVG request records one visit. Add `?theme=miku` to select a theme or `?mode=read` to display an existing counter without recording a visit. The default theme is `moebooru`.

Record a visit and receive JSON:

```http
POST /api/counters/github@yourname/readme
```

The first visit creates the counter and returns `201 Created`; subsequent visits return `200 OK`:

```json
{ "visit": 1, "visitor": 1 }
```

Read the same counter with `GET /api/counters/github@yourname/readme`. Reads never increment or create counters; an unknown counter returns `404 Not Found`.

`visitor` is the number of distinct IPs seen over a counter's lifetime, not people or daily unique visitors. Image proxies, caches, bots, and client retries affect what requests reach the service. The service is public: namespaces organize counters and do not grant ownership or access control.

See the [getting started guide](./docs/content/en/quick-start.mdx), [API reference](./docs/content/en/api.md), and [deployment guide](./docs/content/en/deploy.md).

## Local development

Install dependencies with [Bun](https://bun.sh) 1.4 or later.

```sh
bun install
```

Run `bun run dev` and open `http://127.0.0.1:8787`. It serves the Worker and documentation through local workerd and applies local D1 migrations.

| Command                     | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `bun run dev`               | Run the Worker and documentation locally                       |
| `bun run build`             | Generate theme assets and build the documentation              |
| `bun run docs:dev`          | Run the documentation site in watch mode                       |
| `bun run deploy`            | Build, apply remote database migrations, and deploy            |
| `bun run db:migrate:local`  | Apply local database migrations                                |
| `bun run db:migrate:remote` | Apply remote database migrations                               |
| `bun test`                  | Run tests                                                      |
| `bun run check`             | Check formatting, lint, types, tests, build, and Worker bundle |

Wrangler generates the binding types in `types/` from `wrangler.jsonc`. Runtime declarations come from `@cloudflare/workers-types`.

## Project layout

```text
src/worker/      HTTP handling, D1 counters, and SVG rendering
migrations/      D1 schema migrations
scripts/         Theme asset generation and local Worker startup
tests/           HTTP, persistence, and rendering tests
docs/            Phyllo documentation, React examples, and theme images
types/           Generated Worker binding types
```

## Credits and license

The SVG rendering and theme handling reference [journey-ad/Moe-Counter](https://github.com/journey-ad/Moe-Counter). Theme images belong to their respective creators; including them does not relicense them under this project's license.

Counterflare's code is released under the [MIT License](./LICENSE).
