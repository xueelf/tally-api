---
title: API 参考
description: 计数接口、请求校验、计数语义、隐私及 HTTP 响应规则。
---

# API 参考

Counterflare 通过命名空间与名称确定一个计数器。JSON 接口用不同的 HTTP 方法区分读取与写入；SVG 图片请求会记录访问，以便直接嵌入 Markdown 或 HTML。

## 接口

| 方法      | 路径                                       | 行为                               | 成功状态                 |
| --------- | ------------------------------------------ | ---------------------------------- | ------------------------ |
| `GET`     | `/api/counters/:namespace/:name`           | 读取已有计数器                     | `200`                    |
| `HEAD`    | `/api/counters/:namespace/:name`           | 读取，但不返回响应体               | `200`                    |
| `POST`    | `/api/counters/:namespace/:name`           | 记录一次访问，不存在时创建         | 创建时 `201`，其余 `200` |
| `GET`     | `/counters/:namespace/:name.svg`           | 记录一次访问，以 SVG 展示访问总数  | `200`                    |
| `GET`     | `/counters/:namespace/:name.svg?mode=read` | 只展示已有计数器，不递增           | `200`                    |
| `HEAD`    | `/counters/:namespace/:name.svg`           | 读取，不递增且不返回响应体         | `200`                    |
| `OPTIONS` | 任一计数接口路径                           | 返回支持的方法，不读取或写入数据库 | `204`                    |

请求不带请求体。读取时，包括 `HEAD` 与 SVG 的 `mode=read`，若计数器不存在则返回 `404`。只有记录访问才会创建计数器。不支持的方法返回 `405`，并附带 `Allow` 响应头。

### 标识规则

`namespace` 与 `name` 均不能为空或全为空白，长度最多为 128 个 UTF-16 代码单元，区分大小写，可以包含 Unicode。`.` 和 `..` 为保留名称。斜杠、反斜杠和控制字符不允许出现，经过 URL 编码也不例外。在代码中拼接地址时，对每个路径段分别使用 `encodeURIComponent`。

命名空间用于组织计数器，不代表账号或访问凭证。任何知道计数器地址的人都可以读取或记录访问。

SVG 路径只移除末尾的 `.svg` 后缀。JSON 计数器名称中的点是普通字符：`/api/counters/site/home.json` 对应名为 `home.json` 的计数器。

## JSON

记录一次访问，不发送请求体：

```http
POST /api/counters/github@yourname/readme
```

首次访问返回 `201 Created`，并附带 `Location: /api/counters/github@yourname/readme`。后续访问返回 `200 OK`。两种响应均返回更新后的数据：

```json
{ "visit": 42, "visitor": 12 }
```

读取同一计数器：

```http
GET /api/counters/github@yourname/readme
```

| 字段      | 含义                                     |
| --------- | ---------------------------------------- |
| `visit`   | 计数器自建立以来记录的访问总次数         |
| `visitor` | 计数器自建立以来出现过的独立客户端 IP 数 |

JSON 接口不接受查询参数。读取使用 `GET`，记录使用 `POST`；`mode` 与 `theme` 只适用于 SVG 接口。

## SVG

```http
GET /counters/github@yourname/readme.svg
GET /counters/github@yourname/readme.svg?theme=miku
GET /counters/github@yourname/readme.svg?theme=miku&mode=read
```

| 参数    | 默认值     | 可接受的值                                                             |
| ------- | ---------- | ---------------------------------------------------------------------- |
| `theme` | `moebooru` | 当前版本内置的主题名称，如 `moebooru`、`gelbooru`、`miku`、`minecraft` |
| `mode`  | 记录访问   | `read` 表示只读，不记录访问                                            |

未知主题、非法模式、不支持的查询参数或重复的查询参数均返回 `400`，不会记录访问。主题以当前版本附带的图片为准，上游画廊中的主题可能有所不同。SVG 内嵌主题图片，展示访问总数 `visit`。

## 计数与隐私

访问总数更新、客户端 IP 去重与结果读取在同一事务中完成，并发请求不会相互覆盖增量。记录请求被重试时会再次计数；本项目不对客户端事件去重。

客户端 IP 来自 Cloudflare 提供的 `CF-Connecting-IP` 请求头，服务只保存 IP 的 SHA-256 指纹，不保存原始 IP。缺少客户端 IP 时只增加 `visit`。指纹为终身去重而持续保留，数量随每个计数器的独立 IP 数增长。由于该摘要不带密钥，同一个 IP 在不同计数器下会产生相同指纹。

IP 不等于人。共享网络、动态 IP、机器人、图片代理及缓存都会影响统计结果。README 的一次浏览可能由图片代理直接缓存返回而未到达计数器，也可能使用代理的 IP 发起请求。

## 响应与错误

动态响应包含 `Cache-Control: no-store` 与 `Access-Control-Allow-Origin: *`。JSON 使用 `application/json`，SVG 使用 `image/svg+xml`。`HEAD` 响应始终没有响应体，错误响应也一样。`OPTIONS` 响应同样没有响应体。

计数接口的错误以 JSON 返回，包含 `error` 字段：

```json
{ "error": "Counter not found" }
```

| 状态码                      | 含义                                             |
| --------------------------- | ------------------------------------------------ |
| `200 OK`                    | 读取或更新已有计数器，或生成 SVG 成功            |
| `201 Created`               | JSON 记录请求创建了计数器，`Location` 指向该资源 |
| `204 No Content`            | 预检请求成功                                     |
| `400 Bad Request`           | 非法标识、查询参数或请求体                       |
| `404 Not Found`             | 路径不存在，或读取的计数器尚未建立               |
| `405 Method Not Allowed`    | 方法不受支持，详见 `Allow`                       |
| `500 Internal Server Error` | 服务端配置或意外的内部错误                       |
| `503 Service Unavailable`   | 数据库暂时不可用                                 |
