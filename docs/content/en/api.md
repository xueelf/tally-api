---
title: API reference
description: Counter routes, request validation, counting semantics, privacy, and HTTP responses.
---

# API reference

Counterflare identifies a counter by its namespace and name. JSON reads and writes use separate HTTP methods; SVG image requests record visits so they can be embedded directly in Markdown and HTML.

## Endpoints

| Method    | Path                                       | Behavior                                                         | Success                             |
| --------- | ------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------- |
| `GET`     | `/api/counters/:namespace/:name`           | Read an existing counter                                         | `200`                               |
| `HEAD`    | `/api/counters/:namespace/:name`           | Read without a response body                                     | `200`                               |
| `POST`    | `/api/counters/:namespace/:name`           | Record one visit; create if needed                               | `201` when created, otherwise `200` |
| `GET`     | `/counters/:namespace/:name.svg`           | Record one visit and render its total as SVG                     | `200`                               |
| `GET`     | `/counters/:namespace/:name.svg?mode=read` | Render an existing counter without incrementing                  | `200`                               |
| `HEAD`    | `/counters/:namespace/:name.svg`           | Read without incrementing or returning a body                    | `200`                               |
| `OPTIONS` | Either counter path                        | Return supported methods without reading or writing the database | `204`                               |

Requests have no body. Reads, including `HEAD` and SVG `mode=read`, return `404` for counters that do not exist. Only recording a visit creates a counter. Unsupported methods return `405` with an `Allow` header.

### Identifiers

Both `namespace` and `name` must be nonempty, not entirely whitespace, and at most 128 UTF-16 code units long. They are case-sensitive and may contain Unicode. The names `.` and `..` are reserved. Slashes, backslashes, and control characters are not allowed, including when URL-encoded. Encode each path segment with `encodeURIComponent` when constructing URLs in code.

The namespace organizes counters; it is not an account or access credential. Anyone who knows a counter's URL can read it or record visits.

The SVG path removes only its final `.svg` suffix. Dots in JSON counter names are ordinary characters: `/api/counters/site/home.json` identifies a counter named `home.json`.

## JSON

Record a visit without sending a body:

```http
POST /api/counters/github@yourname/readme
```

The first visit returns `201 Created` with `Location: /api/counters/github@yourname/readme`. Subsequent visits return `200 OK`. Both responses contain the updated values:

```json
{ "visit": 42, "visitor": 12 }
```

Read the counter with:

```http
GET /api/counters/github@yourname/readme
```

| Field     | Meaning                                                   |
| --------- | --------------------------------------------------------- |
| `visit`   | Total visits recorded since this counter was created      |
| `visitor` | Distinct client IPs observed over this counter's lifetime |

The JSON endpoint accepts no query parameters. Use `GET` to read and `POST` to record; `mode` and `theme` belong to the SVG endpoint only.

## SVG

```http
GET /counters/github@yourname/readme.svg
GET /counters/github@yourname/readme.svg?theme=miku
GET /counters/github@yourname/readme.svg?theme=miku&mode=read
```

| Parameter | Default        | Accepted values                                                              |
| --------- | -------------- | ---------------------------------------------------------------------------- |
| `theme`   | `moebooru`     | A bundled theme name, such as `moebooru`, `gelbooru`, `miku`, or `minecraft` |
| `mode`    | Record a visit | `read` to read without recording                                             |

Unknown themes, invalid modes, unsupported query parameters, and repeated query parameters return `400` before recording a visit. Themes use the images bundled with this release; the upstream gallery may include different themes. The SVG embeds its images and displays the total `visit` count.

## Counting and privacy

One transaction updates the total, deduplicates the client IP, and reads the result. Concurrent requests do not overwrite one another's increments. A retried recording request counts again; there is no client-event deduplication.

The client IP comes from Cloudflare's `CF-Connecting-IP` header. The service stores a SHA-256 fingerprint of the IP; raw IPs are not stored. Without a client IP, only `visit` increases. Fingerprints are retained for lifetime deduplication and grow with the number of distinct IPs per counter. Because the digest is not keyed, the same IP produces the same fingerprint across counters.

An IP is not a person. Shared networks, changing IPs, bots, image proxies, and caching affect these numbers. A README view can be served by an image proxy without reaching the counter, or arrive with the proxy's IP.

## Responses and errors

Dynamic responses include `Cache-Control: no-store` and `Access-Control-Allow-Origin: *`. JSON uses `application/json`; SVG uses `image/svg+xml`. `HEAD` responses never contain a body, including errors. `OPTIONS` responses also have no body.

Counter endpoint errors use JSON with an `error` message:

```json
{ "error": "Counter not found" }
```

| Status                      | Meaning                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `200 OK`                    | Existing counter read or updated; SVG rendered             |
| `201 Created`               | JSON recording created a counter; `Location` identifies it |
| `204 No Content`            | Preflight request succeeded                                |
| `400 Bad Request`           | Invalid identifier, query parameter, or request body       |
| `404 Not Found`             | Unknown path or a read of a counter that does not exist    |
| `405 Method Not Allowed`    | Unsupported method; see `Allow`                            |
| `500 Internal Server Error` | Server configuration or an unexpected internal failure     |
| `503 Service Unavailable`   | Temporary database unavailability                          |
