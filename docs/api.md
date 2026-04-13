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

Each counter is stored in KV under the key format `hits:<id>:<resource>`.

If you only want to read the current value without incrementing it, append `?mode=read`. This is useful when the same page fetches the counter more than once.

## JSON Response

If you want to render the number yourself, request JSON:

```http
GET /hits/github/tally-api
GET /hits/github/tally-api.json
```

Example response body:

```json
{ "count": 42 }
```

| Header                        | Value                                 |
| ----------------------------- | ------------------------------------- |
| `Content-Type`                | `application/json`                    |
| `Cache-Control`               | `no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                   |

## SVG Counter

If you want a badge-style counter for a README or webpage, request SVG:

```http
GET /hits/github/tally-api.svg
GET /hits/github/tally-api.svg?theme=gelbooru
```

The response is a pixel-style counter image that can be embedded directly in Markdown or HTML.

| Header                        | Value                                 |
| ----------------------------- | ------------------------------------- |
| `Content-Type`                | `image/svg+xml`                       |
| `Cache-Control`               | `no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                   |

### Query Parameters

| Parameter | Default      | Description                                    |
| --------- | ------------ | ---------------------------------------------- |
| `mode`    | -            | Set to `read` to return the current value only |
| `theme`   | `moebooru`   | Counter theme. Supports the full Moe Counter set |

### Themes

Tally API includes the full Moe Counter theme set. Common choices include `moebooru`, `gelbooru`, `miku`, and `minecraft`.

If `theme` is invalid, the service falls back to `moebooru` automatically.

## Error Responses

| Status | Response body                            | Description                     |
| ------ | ---------------------------------------- | ------------------------------- |
| `400`  | `{ "error": "Missing id or resource" }` | Missing required route params   |
| `400`  | `{ "error": "Invalid resource" }`       | Resource parsing failed         |

## Credits

The SVG themes and rendering approach are inspired by [journey-ad/Moe-Counter](https://github.com/journey-ad/Moe-Counter). Tally API keeps the familiar image-counter workflow and adds a JSON endpoint for scripts and custom UI.
