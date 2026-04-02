# API Reference

## Endpoint

```
GET /api/hits/:id/:resource[.format]
```

| Segment     | Description                                 |
| ----------- | ------------------------------------------- |
| `:id`       | Namespace / owner identifier, e.g. `github` |
| `:resource` | Counter name, e.g. `my-repo`                |
| `.format`   | Optional. `.json` (default) or `.svg`       |

Counters are stored in Cloudflare KV under the key `hits:<id>:<resource>` and increment on every request.

---

## JSON Response

**Request**

```
GET /api/hits/github/my-repo
GET /api/hits/github/my-repo.json
```

**Response** `200 OK`

```json
{ "count": 42 }
```

| Header                        | Value                                 |
| ----------------------------- | ------------------------------------- |
| `Content-Type`                | `application/json`                    |
| `Cache-Control`               | `no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                   |

---

## SVG Response

**Request**

```
GET /api/hits/github/my-repo.svg
GET /api/hits/github/my-repo.svg?theme=moebooru-h
```

**Response** `200 OK` — an inline SVG image with embedded base64 digit images.

| Header                        | Value                                 |
| ----------------------------- | ------------------------------------- |
| `Content-Type`                | `image/svg+xml`                       |
| `Cache-Control`               | `no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                   |

### Query Parameters

| Parameter | Type     | Default    | Description                                                                         |
| --------- | -------- | ---------- | ----------------------------------------------------------------------------------- |
| `theme`   | `string` | `moebooru` | Visual theme for the SVG counter. Falls back to `moebooru` if the value is unknown. |

### Available Themes

| Theme        | Format | Preview                             |
| ------------ | ------ | ----------------------------------- |
| `moebooru`   | GIF    | Animated pixel-art characters (0–9) |
| `moebooru-h` | PNG    | Alternative moebooru character set  |

### SVG Structure

The generated SVG follows the same structure as [Moe Counter](https://github.com/journey-ad/Moe-Counter):

- `<defs>` contains one `<image>` element per **unique** digit (base64 data URI), avoiding duplicate blobs for repeated digits.
- `<g>` contains `<use>` elements that reference the defs by digit character — efficient and spec-compliant.
- `image-rendering: pixelated` is applied via `<style>` to preserve pixel art quality.
- Dark-mode: `@media (prefers-color-scheme: dark)` applies `filter: brightness(.6)`.

---

## Error Responses

| Status | Body                                    | Cause                                        |
| ------ | --------------------------------------- | -------------------------------------------- |
| `400`  | `{ "error": "Missing id or resource" }` | Route params not strings                     |
| `400`  | `{ "error": "Invalid resource" }`       | Resource segment failed regex parse          |
| `400`  | `{ "error": "Unsupported format" }`     | Format extension is neither `json` nor `svg` |
