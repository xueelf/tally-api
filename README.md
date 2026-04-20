# Tally API

![counter](https://tally.yuki.sh/hits/github/tally-api.svg?theme=gelbooru)

A lightweight hit counter built on Cloudflare Pages Functions and KV. Use it in GitHub READMEs, blogs, and personal sites.

Read this in other languages: English | [中文](./README.zh.md)

Tally API is ready to use out of the box. It serves both SVG counters and JSON responses, and you can also deploy it to your own Cloudflare Pages project.

## Usage

Endpoint format:

```text
https://tally.yuki.sh/hits/:id/:resource[.format]
```

- `.svg` returns an image counter
- `.json` returns JSON with total hit `visit` and unique-IP `visitor` (Default value, can be omitted)
- `?mode=read` reads the current value without incrementing it

Embed an SVG counter:

```md
![counter](https://tally.yuki.sh/hits/github/tally-api.svg)
```

![counter](https://tally.yuki.sh/hits/github/tally-api.svg?mode=read)

Apply a theme:

```md
![counter](https://tally.yuki.sh/hits/github/tally-api.svg?theme=miku)
```

Tally API supports every Moe Counter theme, including `moebooru`, `gelbooru`, `miku`, and `minecraft`. The default theme is `moebooru`. See https://count.getloli.com for the full gallery.

![counter](https://tally.yuki.sh/hits/github/tally-api.svg?mode=read&theme=miku)

Fetch JSON:

```http
GET https://tally.yuki.sh/hits/github/tally-api.json
```

## Documentation

For guides, API behavior, theme usage, and self-hosting instructions, see:

[https://tally.yuki.sh/](https://tally.yuki.sh/)

## Credits

The SVG themes and rendering approach are inspired by [journey-ad/Moe-Counter](https://github.com/journey-ad/Moe-Counter). Tally API keeps the familiar image-counter workflow and adds a JSON endpoint for scripts and custom UI.

## License

Released under the [MIT License](./LICENSE).
