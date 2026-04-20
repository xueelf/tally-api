# Getting Started

Need a view counter for a GitHub README, blog, or personal site? Tally API gives you a hosted counter endpoint with no signup and no backend to manage. If you prefer, you can also deploy the same stack to your own Cloudflare account.

## Why Tally API

Tally API started as a simpler replacement for a counter stack built around [LeanCloud](https://leancloud.app/), [MongoDB Atlas](https://www.mongodb.com/), and [Moe Counter](https://github.com/journey-ad/Moe-Counter). When LeanCloud announced the end of its public service in January 2026, moving the storage layer to [Cloudflare KV](https://developers.cloudflare.com/kv/) became the cleaner long-term option.

Unlike Moe Counter, Tally API also exposes JSON. You can keep the familiar SVG badge for Markdown, or build your own UI around the raw count.

## URL Structure

The API follows this format:

```text
https://tally.yuki.sh/hits/:id/:resource[.format]
```

- `:id` is your namespace
- `:resource` is the counter name inside that namespace

If you want to track visits to a GitHub README, you might use:

```http
https://tally.yuki.sh/hits/github/readme
```

If you want to track a blog post, for example `https://blog.yuki.sh/posts/976864126ca2`, you could use:

```http
https://tally.yuki.sh/hits/blog/976864126ca2
```

The public instance runs on a shared domain, so choose a namespace that is unlikely to collide with someone else's. A pattern like `github@yourname` works well, for example `/hits/github@xueelf/readme`.

If you would rather not rely on a shared service, follow the [Deploy](/deploy) guide and run your own instance.

## Read Counts as JSON

You can request JSON directly:

```http
GET https://tally.yuki.sh/hits/docs/tally-api.json
```

The `.json` suffix is optional. If you omit it, the API still returns JSON by default. The response includes both the total hit count and the number of unique client IPs:

```typescript
type Response = {
  visit: number;
  visitor: number;
};
```

That makes Tally API easy to integrate into your own components. The box below is rendered from a live API request:

<script setup lang="ts">
	import CountCard from './.vitepress/components/CountCard.vue';
</script>

<CountCard />

Full component source:

<<< ./.vitepress/components/CountCard.vue

## Embed as SVG

If all you need is a counter badge in Markdown, SVG is the simplest option:

```md
![counter](https://tally.yuki.sh/hits/docs/tally-api.svg)
```

Preview:

![counter](https://tally.yuki.sh/hits/docs/tally-api.svg?mode=read)

You can switch themes with a query parameter:

```md
![counter](https://tally.yuki.sh/hits/docs/tally-api.svg?theme=miku)
```

For example:

![counter](https://tally.yuki.sh/hits/docs/tally-api.svg?mode=read&theme=miku)

Tally API supports every Moe Counter theme, including `moebooru`, `gelbooru`, `miku`, and `minecraft`. See https://count.getloli.com for the full gallery.

If you want the image itself to be clickable, wrap it in a link:

```md
[![counter](https://tally.yuki.sh/hits/docs/tally-api.svg)](https://github.com/xueelf/tally-api)
```

## Next Steps

For request rules, response formats, and error cases, continue with [API Reference](/api).
