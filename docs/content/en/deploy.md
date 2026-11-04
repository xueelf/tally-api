---
title: Deploy
description: Develop locally and deploy Counterflare to Cloudflare Workers with D1.
---

# Deploy

Counterflare runs on Cloudflare Workers with one D1 database. The Worker serves both the API and the built documentation through Workers Static Assets.

## Install

Install dependencies with [Bun](https://bun.sh) 1.4 or later. Deployment requires a Cloudflare account.

```sh
git clone https://github.com/xueelf/counterflare.git
cd counterflare
bun install
```

## Local development

Start the Worker and documentation:

```sh
bun run dev
```

Open `http://127.0.0.1:8787`. The command builds the documentation, applies local D1 migrations, and serves the Worker directly through workerd. Local counts persist in `.wrangler/state`. Restart the command after editing the Worker, documentation, or themes. Use `bun run docs:dev` for documentation watch mode.

## Deploy to your account

Authenticate Wrangler and create a database:

```sh
bun run wrangler login
bun run wrangler d1 create counterflare
```

In the `DB` binding in `wrangler.jsonc`, uncomment `database_id` and fill in the returned database ID; keep the binding name `DB`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "counterflare",
    "database_id": "your-database-id",
  },
],
```

Deploy:

```sh
bun run deploy
```

The script builds assets, applies remote database migrations, and deploys the Worker. Wrangler prints the deployed URL. Use that URL in counter links; optionally add a custom domain in the Worker's Cloudflare settings.

For subsequent deployments, run `bun run deploy` again. Keep the existing database to preserve counters and IP deduplication. Migrations do not import data from another service.

## Configuration

| Setting                    | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `name` in `wrangler.jsonc` | Worker name, default `counterflare`                   |
| `DB`                       | D1 database binding                                   |
| `ASSETS`                   | Static documentation binding, built into `docs/dist/` |

Counterflare does not require Worker secrets. The D1 binding is the only runtime configuration.

## Checks and maintenance

```sh
bun run check
```

This checks formatting, lint, types, tests, the production build, and a dry run of the Worker deployment. To apply migrations separately:

```sh
bun run db:migrate:local
bun run db:migrate:remote
```

The `dev` and `deploy` commands apply local and remote migrations, respectively.

This is a public counter service, with no user accounts or private namespaces. Size the deployment for your expected traffic and the lifetime IP fingerprints it retains. D1 quotas and pricing depend on your Cloudflare plan; see the [D1 documentation](https://developers.cloudflare.com/d1/platform/pricing/).
