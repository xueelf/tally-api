# API 参考

## 接口

```
GET /api/hits/:id/:resource[.format]
```

| 路径段      | 说明                               |
| ----------- | ---------------------------------- |
| `:id`       | 命名空间 / 拥有者标识，如 `github` |
| `:resource` | 计数器名称，如 `tally-api`         |
| `.format`   | 可选。`.json`（默认）或 `.svg`     |

计数器以 `hits:<id>:<resource>` 为键存储于 Cloudflare KV，每次请求时自动递增。

---

## JSON 响应

**请求**

```
GET /api/hits/github/tally-api
GET /api/hits/github/tally-api.json
```

**响应** `200 OK`

```json
{ "count": 42 }
```

| 响应头                        | 值                                    |
| ----------------------------- | ------------------------------------- |
| `Content-Type`                | `application/json`                    |
| `Cache-Control`               | `no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                   |

---

## SVG 响应

**请求**

```
GET /api/hits/github/tally-api.svg
GET /api/hits/github/tally-api.svg?theme=moebooru-h
```

**响应** `200 OK` — 内嵌 base64 数字图片的 SVG 图像。

| 响应头                        | 值                                    |
| ----------------------------- | ------------------------------------- |
| `Content-Type`                | `image/svg+xml`                       |
| `Cache-Control`               | `no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                   |

### 查询参数

| 参数    | 类型     | 默认值     | 说明                                                  |
| ------- | -------- | ---------- | ----------------------------------------------------- |
| `theme` | `string` | `moebooru` | SVG 计数器的视觉主题。值非法时静默降级为 `moebooru`。 |

### 可用主题

| 主题         | 格式 | 说明                    |
| ------------ | ---- | ----------------------- |
| `moebooru`   | GIF  | 动态像素艺术角色（0–9） |
| `moebooru-h` | PNG  | 另一套 moebooru 角色    |

### SVG 结构

生成的 SVG 与 [Moe Counter](https://github.com/journey-ad/Moe-Counter) 结构完全一致：

- `<defs>` 中每个**唯一**数字对应一个 `<image>`（base64 Data URI），避免重复数字重复编码。
- `<g>` 中用 `<use>` 元素引用 defs，相同数字无额外开销。
- 通过 `<style>` 应用 `image-rendering: pixelated`，保留像素艺术质感。
- 暗色模式：`@media (prefers-color-scheme: dark)` 应用 `filter: brightness(.6)`。

---

## 错误响应

| 状态码 | 响应体                                  | 原因                                  |
| ------ | --------------------------------------- | ------------------------------------- |
| `400`  | `{ "error": "Missing id or resource" }` | 路由参数不是字符串                    |
| `400`  | `{ "error": "Invalid resource" }`       | resource 路径段正则解析失败           |
| `400`  | `{ "error": "Unsupported format" }`     | format 后缀既不是 `json` 也不是 `svg` |
