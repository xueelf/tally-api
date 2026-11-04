# Counterflare

运行于 [Cloudflare Workers](https://developers.cloudflare.com/workers/) 与 [D1 SQLite Database](https://developers.cloudflare.com/d1/) 的轻量级访问计数器。可以在 README 或网页中嵌入 SVG 图片，也可以使用 JSON API 记录访问、自行展示计数。

使用其他语言阅读：[English](./README.md) | 中文

每个计数器记录访问总数与独立 IP 数，计数更新和 IP 去重在同一数据库事务中提交。D1 只保存 IP 的 SHA-256 指纹，不保存原始 IP 地址。Counterflare 仅支持 Cloudflare。

## 使用

[部署自己的实例](./docs/content/zh/deploy.md)，然后将示例中的 `https://counter.example.com` 替换为实例地址。

在 Markdown 中嵌入计数器：

```md
![counter](https://counter.example.com/counters/github@yourname/readme.svg)
```

每次 SVG 请求记录一次访问。添加 `?theme=miku` 可选择主题，添加 `?mode=read` 可只展示已有计数器而不记录访问。默认主题为 `moebooru`。

记录一次访问并返回 JSON：

```http
POST /api/counters/github@yourname/readme
```

首次访问创建计数器，返回 `201 Created`；后续访问返回 `200 OK`：

```json
{ "visit": 1, "visitor": 1 }
```

使用 `GET /api/counters/github@yourname/readme` 读取同一计数器。读取不会递增或创建计数器；计数器不存在时返回 `404 Not Found`。

`visitor` 表示计数器自建立以来出现过的独立 IP 数，不等于人数或每日独立访客数。图片代理、缓存、机器人及客户端重试会影响实际到达服务的请求。本服务的计数接口公开，命名空间只用于组织计数器，不代表所有权或访问权限。

详见[快速上手](./docs/content/zh/quick-start.mdx)、[API 参考](./docs/content/zh/api.md)与[部署指南](./docs/content/zh/deploy.md)。

## 本地开发

使用 [Bun](https://bun.sh) 1.4 或更新版本安装依赖。

```sh
bun install
```

运行 `bun run dev` 并打开 `http://127.0.0.1:8787`。该命令应用本地 D1 迁移，并通过本地 workerd 提供 Worker 和文档。

| 命令                        | 用途                                           |
| --------------------------- | ---------------------------------------------- |
| `bun run dev`               | 在本地运行 Worker 和文档                       |
| `bun run build`             | 生成主题资源并构建文档                         |
| `bun run docs:dev`          | 以监听模式运行文档站点                         |
| `bun run deploy`            | 构建、应用远程数据库迁移并部署                 |
| `bun run db:migrate:local`  | 应用本地数据库迁移                             |
| `bun run db:migrate:remote` | 应用远程数据库迁移                             |
| `bun test`                  | 运行测试                                       |
| `bun run check`             | 检查格式、代码、类型、测试、构建及 Worker 打包 |

Wrangler 根据 `wrangler.jsonc` 在 `types/` 中生成绑定类型，运行时类型由 `@cloudflare/workers-types` 提供。

## 项目结构

```text
src/worker/      HTTP 处理、D1 计数与 SVG 渲染
migrations/      D1 数据库迁移
scripts/         生成主题资源和启动本地 Worker
tests/           HTTP、持久化与渲染测试
docs/            Phyllo 文档、React 示例及主题图片
types/           生成的 Worker 绑定类型
```

## 鸣谢与协议

SVG 渲染与主题处理参考了 [journey-ad/Moe-Counter](https://github.com/journey-ad/Moe-Counter)。主题图片的权利归各自创作者所有，随项目提供不代表它们被重新授权为本项目的开源协议。

Counterflare 的代码基于 [MIT License](./LICENSE) 开源。
