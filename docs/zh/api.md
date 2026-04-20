# API 参考

默认情况下，每次请求都会使计数加一。接口路径格式如下：

```http
GET /hits/:id/:resource[.format]
```

## 路径说明

| 路径段      | 说明                                         |
| ----------- | -------------------------------------------- |
| `:id`       | 命名空间                                     |
| `:resource` | 计数器标识                                   |
| `.format`   | 可选，`.json` 或 `.svg`，省略时默认返回 JSON |

计数器在 KV 中会写入以下几个键：

- `hits:<id>:<resource>:visit` — 访问总数
- `hits:<id>:<resource>:visitor` — 独立 IP 总数
- `hits:<id>:<resource>:ip:<ip>` — 该 IP 首次访问时的 Unix 时间戳（毫秒）

客户端 IP 从 Cloudflare 注入的 `CF-Connecting-IP` 请求头读取。

如果只想读取当前数值而不增加计数，可以添加 query 参数 `?mode=read`。例如在页面内多次获取统计数据时，使用只读模式可避免计数虚增。

## JSON 响应

如果你需要在页面中自行渲染数据，直接请求 JSON 即可：

```http
GET /hits/github/tally-api
GET /hits/github/tally-api.json
```

响应结构：

```typescript
type Response = {
  visit: number;
  visitor: number;
};
```

| 字段      | 说明                         |
| --------- | ---------------------------- |
| `visit`   | 计数器建立以来的访问总次数   |
| `visitor` | 访问过该计数器的独立 IP 总数 |

| 响应头                        | 值                                               |
| ----------------------------- | ------------------------------------------------ |
| `Content-Type`                | `application/json`                               |
| `Cache-Control`               | `max-age=0, no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                              |

## SVG 计数器

如果只需要在 Markdown 中嵌入一个数字徽章，直接请求 SVG 会更方便：

```http
GET /hits/github/tally-api.svg
GET /hits/github/tally-api.svg?theme=gelbooru
```

响应为像素风格的计数器 SVG 图片，适合直接嵌入 README 或网页。

| 响应头                        | 值                                               |
| ----------------------------- | ------------------------------------------------ |
| `Content-Type`                | `image/svg+xml`                                  |
| `Cache-Control`               | `max-age=0, no-cache, no-store, must-revalidate` |
| `Access-Control-Allow-Origin` | `*`                                              |

### 查询参数

| 参数    | 默认值     | 说明                                  |
| ------- | ---------- | ------------------------------------- |
| `mode`  | -          | 设为 `read` 时仅读取计数，不递增      |
| `theme` | `moebooru` | 图片主题，支持 Moe-Counter 的所有样式 |

### 主题

当前版本内置了很多主题，例如 `moebooru`、`gelbooru`、`miku`、`minecraft` 等。如果传入非法主题值，服务会自动回退到 `moebooru`。

## 错误响应

| 状态码 | 响应体                                  | 说明                |
| ------ | --------------------------------------- | ------------------- |
| `400`  | `{ "error": "Missing id or resource" }` | 缺少必需的路由参数  |
| `400`  | `{ "error": "Invalid resource" }`       | `resource` 解析失败 |

## 鸣谢

SVG 主题与生成逻辑受 [journey-ad/Moe-Counter](https://github.com/journey-ad/Moe-Counter) 启发。Tally API 在保留图片计数器用法的基础上，额外提供了 JSON 响应，便于脚本读取与自定义展示。
