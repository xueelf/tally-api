# API Reference

By default, every request increments the counter. The endpoint format is:

```http
GET /hits/:id/:resource[.format]
```

## Path Parameters

| Segment     | Description                                      |
| ----------- | ------------------------------------------------ |
| `:id`       | Namespace                                        |
| `:resource` | Counter name                                     |
| `.format`   | Optional. Use `.json` or `.svg`. JSON is default |

Each counter is stored in KV under the following keys:

- `hits:<id>:<resource>:visit` — total hit count
- `hits:<id>:<resource>:visitor` — unique visitor count
- `hits:<id>:<resource>:ip:<ip>` — Unix timestamp (ms) of the first visit from that IP

The client IP is read from the `CF-Connecting-IP` header provided by Cloudflare.

If you only want to read the current value without incrementing it, append `?mode=read`. This is useful when the same page fetches the counter more than once.

## JSON Response

If you want to render the number yourself, request JSON:

```http
GET /hits/github/tally-api
GET /hits/github/tally-api.json
```

Example response structure:

```typescript
type Response = {
  visit: number;
  visitor: number;
};
```

| Field     | Description                                            |
| --------- | ------------------------------------------------------ |
| `visit`   | Total number of hits since the counter was created     |
| `visitor` | Number of distinct client IPs observed for the counter |

| Header                        | Value                                            |
| ----------------------------- | ------------------------------------------------ |
| `Content-Type`                | `application/json`                               |
| `Cache-Control`               | `max-age=0, no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                              |

## SVG Counter

If you want a badge-style counter for a README or webpage, request SVG:

```http
GET /hits/github/tally-api.svg
GET /hits/github/tally-api.svg?theme=gelbooru
```

The response is a pixel-style counter image that can be embedded directly in Markdown or HTML.

| Header                        | Value                                            |
| ----------------------------- | ------------------------------------------------ |
| `Content-Type`                | `image/svg+xml`                                  |
| `Cache-Control`               | `max-age=0, no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                              |

### Query Parameters

| Parameter | Default    | Description                                      |
| --------- | ---------- | ------------------------------------------------ |
| `mode`    | -          | Set to `read` to return the current value only   |
| `theme`   | `moebooru` | Counter theme. Supports the full Moe Counter set |

### Themes

Tally API includes the full Moe Counter theme set. Common choices include `moebooru`, `gelbooru`, `miku`, and `minecraft`.

If `theme` is invalid, the service falls back to `moebooru` automatically.

## Error Responses

| Status | Response body                           | Description                   |
| ------ | --------------------------------------- | ----------------------------- |
| `400`  | `{ "error": "Missing id or resource" }` | Missing required route params |
| `400`  | `{ "error": "Invalid resource" }`       | Resource parsing failed       |

## Credits

The SVG themes and rendering approach are inspired by [journey-ad/Moe-Counter](https://github.com/journey-ad/Moe-Counter). Tally API keeps the familiar image-counter workflow and adds a JSON endpoint for scripts and custom UI.
